const PROFILE_PREFIX = "campuslink:skill-profile:";
const DIRECTORY_KEY = "campuslink:skill-profile-directory";
const SETTINGS_KEY = "campuslink:skill-assessment-settings";
const FILE_DB = "campuslink-skill-files";
const FILE_STORE = "documents";

export const SKILL_CATALOG = [
  { name: "Python", category: "Programming languages", aliases: ["python"] },
  { name: "Java", category: "Programming languages", aliases: ["java"] },
  { name: "JavaScript", category: "Programming languages", aliases: ["javascript", "js"] },
  { name: "C++", category: "Programming languages", aliases: ["c++", "cpp"] },
  { name: "React", category: "Frameworks", aliases: ["react", "react.js", "reactjs"] },
  { name: "Django", category: "Frameworks", aliases: ["django"] },
  { name: "Node.js", category: "Frameworks", aliases: ["node.js", "nodejs"] },
  { name: "SQL", category: "Databases", aliases: ["sql"] },
  { name: "PostgreSQL", category: "Databases", aliases: ["postgresql", "postgres"] },
  { name: "MongoDB", category: "Databases", aliases: ["mongodb", "mongo db"] },
  { name: "Git", category: "Tools", aliases: ["git", "github"] },
  { name: "Docker", category: "Tools", aliases: ["docker"] },
  { name: "AWS", category: "Cloud", aliases: ["aws", "amazon web services"] },
  { name: "Azure", category: "Cloud", aliases: ["azure"] },
  { name: "Communication", category: "Soft skills", aliases: ["communication", "communication skills"] },
  { name: "Leadership", category: "Soft skills", aliases: ["leadership", "team leadership"] },
  { name: "Problem solving", category: "Soft skills", aliases: ["problem solving", "problem-solving"] },
];

export const DEFAULT_SKILL_SETTINGS = {
  passingThreshold: 80,
  strongThreshold: 85,
  developingThreshold: 60,
  questionsPerLevel: 5,
};

export function skillProfileKey(student) {
  return `${PROFILE_PREFIX}${String(student?.email || student?.collegeId || "student").trim().toLowerCase()}`;
}

export function createEmptySkillProfile(student = {}) {
  return {
    student: {
      fullName: student.fullName || "Student",
      email: student.email || "",
      branch: student.branch || "",
      collegeId: student.collegeId || "",
      graduationYear: student.graduationYear || "",
      cgpa: student.cgpa || "",
      location: student.location || "",
      experience: student.experience || "",
      photo: student.photo || "",
    },
    resume: { fileName: "", fileId: "", text: "", analyzedAt: null, claimedSkills: [], sections: {} },
    additionalSkills: [],
    certificates: [],
    assessments: [],
    activeAssessment: null,
  };
}

export function loadSkillProfile(student) {
  try {
    const stored = JSON.parse(localStorage.getItem(skillProfileKey(student)) || "null");
    const empty = createEmptySkillProfile(student);
    return stored ? {
      ...empty,
      ...stored,
      student: { ...empty.student, ...stored.student, ...student },
      resume: { ...empty.resume, ...stored.resume },
      additionalSkills: stored.additionalSkills || [],
      certificates: stored.certificates || [],
      assessments: stored.assessments || [],
      activeAssessment: stored.activeAssessment || null,
    } : empty;
  } catch {
    return createEmptySkillProfile(student);
  }
}

export function loadSkillSettings() {
  try {
    return { ...DEFAULT_SKILL_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_SKILL_SETTINGS };
  }
}

export function saveSkillSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function saveSkillProfile(student, profile) {
  const key = skillProfileKey(student);
  const mergedStudent = { ...profile.student, ...student };
  const next = { ...profile, student: mergedStudent, updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(next));
  const directory = readSkillDirectory();
  if (mergedStudent.email) directory[mergedStudent.email.toLowerCase()] = publicSkillProfile(next);
  localStorage.setItem(DIRECTORY_KEY, JSON.stringify(directory));
}

export function readSkillDirectory() {
  try {
    return JSON.parse(localStorage.getItem(DIRECTORY_KEY) || "{}");
  } catch {
    return {};
  }
}

export function publicSkillProfile(profile) {
  const skillScores = getVerifiedSkillScores(profile);
  const passedLevels = [1, 2, 3].filter((level) => profile.assessments.some((item) => item.level === level && item.passed));
  const lastResult = [...profile.assessments].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0];
  return {
    student: profile.student,
    resumeSkills: profile.resume.claimedSkills || [],
    additionalSkills: profile.additionalSkills || [],
    certificates: profile.certificates || [],
    skillScores,
    assessments: profile.assessments || [],
    passedLevels,
    overallScore: skillScores.length ? Math.round(skillScores.reduce((sum, item) => sum + item.score, 0) / skillScores.length) : 0,
    questionsAttempted: profile.assessments.reduce((sum, item) => sum + item.totalQuestions, 0),
    correctAnswers: profile.assessments.reduce((sum, item) => sum + item.correctAnswers, 0),
    averageResponseSeconds: lastResult?.averageResponseSeconds || 0,
    updatedAt: profile.updatedAt || new Date().toISOString(),
  };
}

export function extractResumeProfile(text) {
  const source = String(text || "");
  const normalized = source.toLowerCase();
  const found = SKILL_CATALOG.filter((skill) => skill.aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`, "i").test(normalized);
  }));
  const section = (labels) => {
    const labelPattern = labels.join("|");
    const match = source.match(new RegExp(`(?:${labelPattern})\\s*[:\\-]?\\s*([\\s\\S]*?)(?=\\n\\s*(?:education|skills|experience|internships?|projects?|certifications?|summary|objective)\\b|$)`, "i"));
    return match ? match[1].split(/\n/).map((line) => line.trim()).filter(Boolean).slice(0, 12) : [];
  };
  return {
    claimedSkills: found.map(({ name, category }) => ({ name, category })),
    sections: {
      projects: section(["projects?"]),
      internships: section(["internships?"]),
      education: section(["education"]),
      experience: section(["experience"]),
      certifications: section(["certifications?", "certificates?"]),
    },
  };
}

export function getVerifiedSkillScores(profile) {
  const latest = new Map();
  [...(profile.assessments || [])]
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
    .forEach((result) => (result.skillScores || []).forEach((item) => latest.set(item.skill, item.score)));
  return [...latest.entries()].map(([skill, score]) => ({ skill, score }));
}

function openFileDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error("Browser document storage is unavailable."));
    const request = indexedDB.open(FILE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(FILE_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeSkillDocument(file) {
  const db = await openFileDatabase();
  const fileId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE, "readwrite");
    transaction.objectStore(FILE_STORE).put(file, fileId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
  return fileId;
}

export async function loadSkillDocument(fileId) {
  const db = await openFileDatabase();
  const file = await new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE, "readonly");
    const request = transaction.objectStore(FILE_STORE).get(fileId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return file;
}
