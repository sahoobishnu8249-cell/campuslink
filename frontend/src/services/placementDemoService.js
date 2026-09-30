const DIRECTORY_KEY = "campuslink:passport-directory";

function randomHex(size = 8) {
  const bytes = new Uint8Array(size);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function randomToken() {
  if (!globalThis.crypto?.getRandomValues) throw new Error("Secure token generation is unavailable in this browser.");
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function placementStorageKey(student) {
  return `campuslink-placement-demo:${String(student?.collegeId || student?.email || "student").toLowerCase()}`;
}

export function createPlacementDemoState(student = {}) {
  const now = new Date();
  const isoDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString().slice(0, 10);
  return {
    passport: {
      passportId: `CP-PASS-${now.getFullYear()}-${randomHex(4)}`,
      qrToken: randomToken(),
      status: "PENDING",
      expiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
      photo: "",
      verifiedAt: null,
      profileSnapshot: null,
      checks: [
        { id: "academic", label: "Academic Verification", status: "PENDING", note: "Awaiting institution review" },
        { id: "eligibility", label: "Eligibility Verification", status: "PENDING", note: "Calculated from profile and drive rules" },
        { id: "tpo", label: "TPO Clearance", status: "PENDING", note: "Awaiting TPO review" },
        { id: "attendance", label: "Attendance Verification", status: "PENDING", note: "No drive check-in recorded" },
        { id: "documents", label: "Document Verification", status: "PENDING", note: "No documents reviewed" },
      ],
    },
    drive: {
      jobId: "",
      company: "TechNova",
      title: "Campus Placement Drive",
      date: isoDay,
      venue: "Campus · Block B",
      room: "B-204",
      status: "ACTIVE",
      currentStage: "Technical Round",
      stageIndex: 2,
      ownToken: "B-18",
      nowServing: "B-15",
      audioEnabled: false,
      queue: [
        { token: "B-14", candidate: "Demo Candidate 14", status: "COMPLETED", room: "B-204", round: "Technical Round" },
        { token: "B-15", candidate: "Demo Candidate 15", status: "IN_PROGRESS", room: "B-204", round: "Technical Round" },
        { token: "B-16", candidate: "Demo Candidate 16", status: "WAITING", room: "B-204", round: "Technical Round" },
        { token: "B-17", candidate: "Demo Candidate 17", status: "WAITING", room: "B-204", round: "Technical Round" },
        { token: "B-18", candidate: student?.fullName || "Demo Student", status: "WAITING", room: "B-204", round: "Technical Round", isStudent: true },
        { token: "B-19", candidate: "Demo Candidate 19", status: "WAITING", room: "B-204", round: "Technical Round" },
      ],
    },
    policy: {
      active: false,
      name: "",
      category: "",
      minPackage: "",
      maxPackage: "",
      allowAnotherDrive: true,
      blockAfterOffer: false,
      minimumUpgradePercent: "",
    },
    decisions: [],
  };
}

export function loadPlacementDemoState(key, student) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "null");
    if (!stored) return createPlacementDemoState(student);
    const fresh = createPlacementDemoState(student);
    return {
      ...fresh,
      ...stored,
      passport: { ...fresh.passport, ...stored.passport, checks: stored.passport?.checks || fresh.passport.checks },
      drive: { ...fresh.drive, ...stored.drive, queue: stored.drive?.queue || fresh.drive.queue },
      policy: { ...fresh.policy, ...stored.policy },
      decisions: stored.decisions || [],
    };
  } catch {
    return createPlacementDemoState(student);
  }
}

export function savePlacementDemoState(key, state, student = {}) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    const directory = JSON.parse(localStorage.getItem(DIRECTORY_KEY) || "{}");
    const status = state.passport.expiresAt && Date.parse(state.passport.expiresAt) < Date.now() ? "EXPIRED" : state.passport.status;
    directory[state.passport.passportId] = {
      token: state.passport.qrToken,
      name: student.fullName || "Student",
      collegeId: student.collegeId || "",
      branch: student.branch || "",
      status,
      eligibility: state.passport.checks.find((check) => check.id === "eligibility")?.status === "VERIFIED" ? "YES" : "REVIEW REQUIRED",
      verifiedAt: state.passport.verifiedAt,
    };
    localStorage.setItem(DIRECTORY_KEY, JSON.stringify(directory));
  } catch {
    // Keep the demo usable in private browsing even when storage is disabled.
  }
}

export function readPublicPassport(passportId, token) {
  try {
    const record = JSON.parse(localStorage.getItem(DIRECTORY_KEY) || "{}")[passportId];
    if (!record || !token || record.token !== token) return null;
    const maskedId = record.collegeId.length > 4
      ? `${"•".repeat(Math.max(0, record.collegeId.length - 4))}${record.collegeId.slice(-4)}`
      : record.collegeId;
    return { ...record, collegeId: maskedId };
  } catch {
    return null;
  }
}

export function createPassportUrl(passport) {
  const path = `/passport/verify/${encodeURIComponent(passport.passportId)}`;
  return `${window.location.origin}${path}?token=${encodeURIComponent(passport.qrToken)}`;
}
