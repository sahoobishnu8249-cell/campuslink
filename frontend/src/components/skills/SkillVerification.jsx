import { useEffect, useRef, useState } from "react";
import { Activity, ArrowRight, Award, BarChart3, BrainCircuit, Check, CheckCircle2, Clock3, FileText, LockKeyhole, Plus, RotateCcw, ShieldAlert, ShieldCheck, Sparkles, Target, Upload, Users, X } from "lucide-react";
import "../../styles/skill-verification.css";
import {
  SKILL_CATALOG,
  extractResumeProfile,
  getVerifiedSkillScores,
  loadSkillDocument,
  loadSkillProfile,
  loadSkillSettings,
  readSkillDirectory,
  saveSkillProfile,
  saveSkillSettings,
  storeSkillDocument,
} from "../../services/skillVerificationService";

const QUESTION_BANK = {
  Python: {
    1: [
      ["Code output", "What does `len([x for x in range(2, 8, 2)])` return?", ["2", "3", "4", "6"], "3", "The generated values are 2, 4, and 6."],
      ["Concept", "Which Python value represents an intentional absence of a value?", ["None", "null", "undefined", "void"], "None", "Python uses None for an absent value."],
      ["Concept", "Which collection keeps insertion order and allows duplicate values?", ["list", "set", "dict keys", "frozenset"], "list", "Lists are ordered and can contain duplicates."],
    ],
    2: [
      ["Practical", "A function repeatedly checks whether IDs appear in a list. Which change usually improves lookup time?", ["Convert IDs to a set", "Sort the list every time", "Copy the list for each lookup", "Convert IDs to strings"], "Convert IDs to a set", "Set membership is typically O(1) on average."],
      ["Debugging", "A function changes a list argument unexpectedly. Which safer default should it use?", ["items=None, then create a list inside", "items=[]", "items=() and append", "items=0"], "items=None, then create a list inside", "Mutable default arguments are shared between calls."],
      ["Scenario", "You need to process a large file without loading all rows at once. What is a suitable approach?", ["Iterate over the file line by line", "Read the file into one string", "Duplicate the file in memory", "Convert it to a tuple first"], "Iterate over the file line by line", "Streaming iteration keeps memory use low."],
    ],
    3: [
      ["Architecture", "A Python API has slow repeated database reads for the same reference data. What should you measure before optimizing?", ["Query timings and cache hit rates", "Only source-file length", "The number of comments", "The API logo dimensions"], "Query timings and cache hit rates", "Measure bottlenecks before choosing a cache or query change."],
      ["Debugging", "A worker occasionally duplicates a job after retrying. Which design best protects the operation?", ["Make the handler idempotent with a unique job key", "Increase the worker count", "Remove error logs", "Retry forever without a limit"], "Make the handler idempotent with a unique job key", "Idempotency prevents duplicate effects when requests are retried."],
      ["Scenario", "A CPU-heavy Python task blocks other requests in one process. What is a sensible next step?", ["Profile it, then use processes or a task queue if appropriate", "Add more await keywords", "Store more data in globals", "Disable request timeouts"], "Profile it, then use processes or a task queue if appropriate", "CPU-bound work usually needs profiling and process-level execution."],
    ],
  },
  SQL: {
    1: [
      ["Query concept", "Which clause filters rows before grouping?", ["WHERE", "HAVING", "ORDER BY", "LIMIT"], "WHERE", "WHERE filters input rows; HAVING filters groups."],
      ["Query concept", "Which join returns only rows with a match in both tables?", ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "FULL JOIN"], "INNER JOIN", "An inner join keeps rows with matching join keys."],
      ["Query concept", "What does `COUNT(*)` count?", ["Rows", "Only non-null values in one column", "Distinct tables", "Indexes"], "Rows", "COUNT(*) counts rows, including rows with nullable columns."],
    ],
    2: [
      ["Practical", "A query filters by `student_id` but scans a large table. What is a likely improvement?", ["Add or verify an index on student_id", "Select every column", "Remove the WHERE clause", "Sort in the browser"], "Add or verify an index on student_id", "An appropriate index can speed selective lookups."],
      ["Scenario", "You need each student's latest assessment. Which SQL pattern is appropriate?", ["ROW_NUMBER partitioned by student and ordered by date descending", "COUNT grouped by student", "CROSS JOIN every row", "ORDER BY without selecting a row"], "ROW_NUMBER partitioned by student and ordered by date descending", "A window function can rank each student's records."],
      ["Debugging", "A join unexpectedly multiplies rows. What should you inspect first?", ["Whether the join key is unique on the expected side", "The CSS for the table", "The database name length", "Whether ORDER BY is present"], "Whether the join key is unique on the expected side", "One-to-many matches can multiply result rows."],
    ],
    3: [
      ["Architecture", "Two transactions update the same placement offer. What helps avoid lost updates?", ["A transaction with a version check or suitable isolation", "A wider screen", "A client-side delay only", "Removing the unique key"], "A transaction with a version check or suitable isolation", "Concurrency controls prevent one update silently overwriting another."],
      ["Performance", "A query is slow despite an index. What should you review?", ["EXPLAIN plan, selectivity, and actual row counts", "Only the column labels", "The number of API buttons", "The database icon"], "EXPLAIN plan, selectivity, and actual row counts", "The query plan reveals whether the index is used effectively."],
      ["Scenario", "A report needs a consistent snapshot while multiple writes continue. What database feature is relevant?", ["Transaction isolation / snapshot semantics", "A client-side sort", "A larger HTML table", "A text search in JavaScript"], "Transaction isolation / snapshot semantics", "Snapshot isolation gives a consistent view of concurrent data."],
    ],
  },
  React: {
    1: [
      ["Concept", "What causes a React component to render again after local state changes?", ["A state update", "A CSS hover only", "A comment change", "A file rename"], "A state update", "React schedules a render when state changes."],
      ["Concept", "Why should list items usually have stable keys?", ["So React can match items between renders", "To make text bold", "To encrypt the list", "To create an API route"], "So React can match items between renders", "Keys help React identify items as lists change."],
      ["Concept", "Which hook is intended for synchronizing with an external system?", ["useEffect", "useMemo", "useId", "useDebugValue"], "useEffect", "Effects synchronize with browser APIs, subscriptions, and other external systems."],
    ],
    2: [
      ["Debugging", "A component reads stale state inside a timer. What is a common safe fix?", ["Use a functional state update or keep a current ref", "Disable React StrictMode", "Move state into CSS", "Add a random key every render"], "Use a functional state update or keep a current ref", "Functional updates read the latest state value."],
      ["Practical", "A large derived list is expensive to recalculate on every render. What should you do first?", ["Measure, then memoize the derivation if it helps", "Memoize every value automatically", "Move it into localStorage", "Duplicate the component"], "Measure, then memoize the derivation if it helps", "Memoization is useful when a measured calculation is costly."],
      ["Scenario", "A child needs to notify its parent that a row was selected. What is the usual pattern?", ["Pass a callback prop to the child", "Mutate the parent DOM directly", "Use a CSS selector as state", "Reload the page"], "Pass a callback prop to the child", "Callbacks allow children to report events to their parent."],
    ],
    3: [
      ["Architecture", "A page has several routes and shared loading data. Where should shared state live?", ["At the narrowest common owner or a suitable shared store", "Inside every button", "Only in a DOM attribute", "In a random module variable"], "At the narrowest common owner or a suitable shared store", "State ownership should match which views need the data."],
      ["Performance", "A dashboard interaction causes many unrelated components to render. What is the best first move?", ["Profile the render path and reduce unnecessary state coupling", "Add more global state", "Disable all updates", "Replace React with static HTML"], "Profile the render path and reduce unnecessary state coupling", "Profiling identifies which state changes cause unnecessary work."],
      ["Debugging", "A fetch effect updates state after its component unmounts. What should the effect do?", ["Abort the request or ignore its result during cleanup", "Retry every millisecond", "Store the result in a DOM node", "Remove the dependency array without review"], "Abort the request or ignore its result during cleanup", "Cleanup can prevent stale asynchronous updates."],
    ],
  },
  Django: {
    1: [
      ["Concept", "What maps a Django URL pattern to a view?", ["URL configuration", "Model manager", "Template filter", "Static file manifest"], "URL configuration", "URL patterns route requests to views."],
      ["Concept", "Where is database structure described in a typical Django app?", ["Models", "Templates", "Middleware comments", "Static CSS"], "Models", "Django models define data fields and relationships."],
    ],
    2: [
      ["Practical", "A list view has an N+1 query problem for a foreign key. Which ORM method may help?", ["select_related", "reverse", "render", "path"], "select_related", "select_related joins related single-valued objects."],
      ["Security", "How should a Django template display user-provided text by default?", ["Use auto-escaping and avoid marking it safe", "Disable escaping globally", "Insert it as raw HTML", "Store it in a CSS class"], "Use auto-escaping and avoid marking it safe", "Auto-escaping reduces cross-site scripting risk."],
    ],
    3: [
      ["Architecture", "A long report generation blocks web requests. What design is usually more suitable?", ["Move it to a background task queue", "Increase template nesting", "Run it in every middleware", "Disable database transactions"], "Move it to a background task queue", "Background workers keep long tasks out of request handling."],
      ["Security", "A state-changing view should be protected from cross-site request forgery. What should remain enabled?", ["Django CSRF protection", "Debug mode in production", "Raw SQL string formatting", "Public admin access"], "Django CSRF protection", "CSRF middleware and tokens protect browser-originated state changes."],
    ],
  },
  Java: {
    1: [
      ["Concept", "Which Java type is immutable and represents text?", ["String", "StringBuilder", "char[]", "ByteBuffer"], "String", "Java String values are immutable."],
      ["Concept", "Which collection does not allow duplicate elements?", ["Set", "List", "ArrayList", "Queue"], "Set", "The Set interface models unique elements."],
    ],
    2: [
      ["Practical", "You build a string repeatedly inside a loop. Which type is usually appropriate?", ["StringBuilder", "String with repeated concatenation always", "Integer", "ThreadLocal"], "StringBuilder", "StringBuilder avoids creating many intermediate strings."],
      ["Debugging", "A resource must be closed even if an exception occurs. Which construct helps?", ["try-with-resources", "synchronized only", "assert", "switch"], "try-with-resources", "AutoCloseable resources are closed at the end of the statement."],
    ],
    3: [
      ["Concurrency", "Several threads update a shared counter. What makes the update safe?", ["A suitable atomic operation or synchronization", "A volatile read-modify-write alone", "A longer variable name", "A larger heap only"], "A suitable atomic operation or synchronization", "Compound updates need atomicity or locking."],
      ["Architecture", "A service creates many database connections per request. What should it use?", ["A managed connection pool", "One new connection per query", "A static global socket", "A longer timeout only"], "A managed connection pool", "Connection pools reuse and manage database connections."],
    ],
  },
  JavaScript: {
    1: [
      ["Code output", "What is `typeof null` in JavaScript?", ["object", "null", "undefined", "number"], "object", "This is a historical JavaScript behavior."],
      ["Concept", "Which declaration is block-scoped and can be reassigned?", ["let", "const", "class", "import"], "let", "let is block-scoped and can be reassigned."],
    ],
    2: [
      ["Async", "What does `await` do inside an async function?", ["Waits for a promise to settle and returns its value", "Starts a new thread", "Converts a value to HTML", "Makes an operation synchronous on the server"], "Waits for a promise to settle and returns its value", "await pauses that async function until the promise settles."],
      ["Debugging", "Why can `0.1 + 0.2 === 0.3` be false?", ["Binary floating-point precision", "Arrays are immutable", "Strict equality rounds values", "The event loop blocks numbers"], "Binary floating-point precision", "Some decimal fractions cannot be represented exactly in binary floating point."],
    ],
    3: [
      ["Architecture", "A browser request may fail or be cancelled. Which pattern is useful for reliable UI state?", ["Handle loading, success, failure, and cancellation", "Assume every promise succeeds", "Retry forever silently", "Change the DOM without state"], "Handle loading, success, failure, and cancellation", "Explicit async states make the interface resilient and understandable."],
      ["Security", "Where should a private API secret be placed in a browser application?", ["It should not be shipped to the browser", "In a hidden input", "In a minified JS constant", "In a localStorage key"], "It should not be shipped to the browser", "Client bundles are visible to users; secrets belong on a server."],
    ],
  },
  AWS: {
    1: [
      ["Cloud concept", "Which AWS service provides object storage?", ["Amazon S3", "Amazon EC2", "Amazon VPC", "Amazon Route 53"], "Amazon S3", "S3 stores objects in buckets."],
      ["Cloud concept", "What is an IAM role primarily used for?", ["Granting temporary permissions to an identity or service", "Storing relational rows", "Rendering web pages", "Creating DNS zones only"], "Granting temporary permissions to an identity or service", "Roles provide scoped credentials to authorized principals."],
    ],
    2: [
      ["Scenario", "An app needs to read an S3 bucket. What is safer than hard-coded access keys?", ["Attach a least-privilege IAM role", "Commit keys to Git", "Make the bucket public", "Share the root credentials"], "Attach a least-privilege IAM role", "Roles avoid embedded long-lived credentials and can be scoped."],
      ["Reliability", "An EC2 instance must survive a single host failure. What design is appropriate?", ["Use multiple Availability Zones behind a load balancer", "Use one larger instance", "Disable health checks", "Store state only on its disk"], "Use multiple Availability Zones behind a load balancer", "Multi-AZ deployments reduce dependence on one failure domain."],
    ],
    3: [
      ["Architecture", "A service has unpredictable traffic spikes. Which approach improves elasticity?", ["Use autoscaling with health checks and capacity limits", "Keep one fixed instance forever", "Disable metrics", "Put credentials in source code"], "Use autoscaling with health checks and capacity limits", "Autoscaling adjusts capacity while health checks guide replacement."],
      ["Security", "What should an S3 bucket policy generally follow?", ["Least privilege and explicit access needs", "Allow all principals by default", "Use public read for every object", "Store passwords in object names"], "Least privilege and explicit access needs", "Restrict bucket access to required identities and actions."],
    ],
  },
  Git: {
    1: [
      ["Concept", "Which command creates a new commit from staged changes?", ["git commit", "git clone", "git fetch", "git status"], "git commit", "A commit records staged changes in the repository history."],
      ["Concept", "What does a branch represent in Git?", ["A movable reference to a line of commits", "A second copy of the operating system", "A database index", "An encrypted file"], "A movable reference to a line of commits", "Branches are lightweight refs that move as commits are added."],
    ],
    2: [
      ["Practical", "You want to inspect changes without changing files. Which command helps?", ["git diff", "git reset --hard", "git clean -fd", "git push --force"], "git diff", "git diff displays changes between worktree, index, or commits."],
      ["Workflow", "A feature branch is behind the shared branch. What is a normal safe approach?", ["Fetch and merge or rebase according to team policy", "Force-push over the shared branch", "Delete the repository", "Ignore conflicts"], "Fetch and merge or rebase according to team policy", "Integrate upstream changes using the team's collaboration workflow."],
    ],
    3: [
      ["Recovery", "A commit is already shared and needs undoing without rewriting history. What is suitable?", ["git revert", "git reset --hard and force push", "Delete .git", "Rename HEAD"], "git revert", "git revert creates a new commit that reverses a prior commit."],
      ["Debugging", "A regression appeared somewhere in recent commits. Which tool can narrow it down?", ["git bisect", "git stash clear", "git remote prune", "git tag -d"], "git bisect", "git bisect uses binary search over history to identify a bad commit."],
    ],
  },
  Docker: {
    1: [
      ["Concept", "What is a Docker image?", ["A template used to create containers", "A running process only", "A virtual machine monitor", "A Git branch"], "A template used to create containers", "Images package filesystem layers and metadata for containers."],
      ["Concept", "Which file commonly defines image build instructions?", ["Dockerfile", "package-lock.json", "README only", ".gitignore"], "Dockerfile", "Docker builds an image using instructions in a Dockerfile."],
    ],
    2: [
      ["Practical", "How should a container receive a database password?", ["Inject it from a secret manager or runtime environment", "Bake it into the image", "Commit it in the Dockerfile", "Print it in build logs"], "Inject it from a secret manager or runtime environment", "Secrets should be supplied securely at runtime, not baked into images."],
      ["Debugging", "A container exits immediately. What is a useful first step?", ["Inspect its logs and exit code", "Rebuild the host OS", "Delete all volumes", "Expose every port"], "Inspect its logs and exit code", "Logs and exit codes reveal why the main process stopped."],
    ],
    3: [
      ["Architecture", "A containerized app stores important data. Where should persistent data live?", ["A managed volume or external durable data service", "Only in the writable container layer", "In image build cache", "In stdout"], "A managed volume or external durable data service", "Container filesystems are replaceable; persistent data needs durable storage."],
      ["Security", "What reduces a container's attack surface?", ["Use a small trusted image and run as a non-root user", "Install every debugging package", "Run privileged by default", "Copy cloud credentials into the image"], "Use a small trusted image and run as a non-root user", "Minimal images and least privilege reduce risk."],
    ],
  },
  PostgreSQL: {
    1: [
      ["Database concept", "Which PostgreSQL feature uniquely identifies each row in a table?", ["A primary key", "A view", "A comment", "A schema search path"], "A primary key", "A primary key enforces a unique, non-null row identifier."],
      ["Database concept", "Which data type stores a calendar date without a time?", ["date", "interval", "bytea", "jsonb"], "date", "PostgreSQL date stores a calendar date."],
    ],
    2: [
      ["Practical", "A query filters by an exact email frequently. Which structure may improve lookup speed?", ["An index on the normalized email column", "A larger text column", "A duplicate table", "A client-side timeout"], "An index on the normalized email column", "An index can speed frequent equality lookups."],
      ["Transactions", "What does a transaction provide when committed successfully?", ["Atomic application of its changes", "Automatic email delivery", "A larger connection pool", "A frontend route"], "Atomic application of its changes", "Transactions group changes so they commit or roll back together."],
    ],
    3: [
      ["Concurrency", "A transaction should lock only matching rows. Which approach is usually preferable?", ["Use a selective predicate and row-level locking where needed", "Lock every table for every request", "Disable constraints", "Use random sleeps"], "Use a selective predicate and row-level locking where needed", "Narrow locks limit contention while protecting the required rows."],
      ["Performance", "A table is bloated and query latency rises. What should guide remediation?", ["Measure table/index statistics and maintenance needs", "Drop all indexes immediately", "Increase every column width", "Turn off autovacuum without analysis"], "Measure table/index statistics and maintenance needs", "Statistics and vacuum behavior help diagnose bloat and query costs."],
    ],
  },
};

const LEVEL_NAMES = { 1: "Basic", 2: "Intermediate", 3: "Advanced" };
const LEVEL_DETAILS = {
  1: "Check fundamentals and core concepts.",
  2: "Apply ideas to practical scenarios and debugging.",
  3: "Reason about trade-offs, architecture, and real-world problems.",
};
const randomId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const formatSeconds = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const levelStatus = (profile, level) => {
  const result = [...profile.assessments].reverse().find((item) => item.level === level);
  if (result?.passed) return "PASSED";
  if (result) return "RETRY AVAILABLE";
  if (level === 1 || profile.assessments.some((item) => item.level === level - 1 && item.passed)) return "READY";
  return "LOCKED";
};

function makeQuestion(skill, level, row, index) {
  const [type, prompt, choices, correctAnswer, explanation] = row;
  const options = shuffle(choices).map((label, optionIndex) => ({ id: `${index}-${optionIndex}-${randomId()}`, label }));
  return { id: randomId(), skill, level, type, prompt, options, correctAnswer, explanation, timeLimit: 60 };
}

function generateQuestions(skills, level, count) {
  const bankItems = [];
  skills.forEach((skill) => {
    const known = QUESTION_BANK[skill.name]?.[level] || [];
    known.forEach((row) => bankItems.push({ skill: skill.name, row }));
  });
  if (!bankItems.length) {
    skills.forEach((skill) => {
      const scenarios = [
        ["Concept", `Which approach best demonstrates a sound foundation in ${skill.name}?`, [`Explain its core purpose and a common use`, "Memorize a tool name without context", "Avoid testing changes", "Store credentials in source code"], "Explain its core purpose and a common use", `A good answer connects the concept to its use and trade-offs.`],
        ["Practical", `A ${skill.name} feature behaves unexpectedly in production. What should you do first?`, ["Reproduce the issue and inspect evidence", "Rewrite the whole application", "Disable monitoring", "Ignore user reports"], "Reproduce the issue and inspect evidence", "A reproducible issue and observed evidence make diagnosis measurable."],
        ["Scenario", `The ${skill.name} implementation is slow for larger inputs. What is the best next action?`, ["Profile the workload and identify the bottleneck", "Guess and rewrite unrelated code", "Remove validation", "Increase the timeout indefinitely"], "Profile the workload and identify the bottleneck", "Measure performance before choosing an optimization."],
      ];
      scenarios.forEach((row) => bankItems.push({ skill: skill.name, row }));
    });
  }
  const pool = shuffle(bankItems);
  const rows = [];
  for (let index = 0; index < count; index += 1) {
    const selected = pool[index % pool.length];
    rows.push(makeQuestion(selected.skill, level, selected.row, index));
  }
  return shuffle(rows);
}

function Heading({ eyebrow, title, description }) {
  return <div className="feature-page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><span className="demo-mode-badge"><ShieldAlert size={14}/> Frontend demo · browser data</span></div>;
}

function Notice() {
  return <div className="skill-demo-notice"><ShieldAlert size={17}/><div><b>Demo assessment, not a secure AI verification.</b><span>Resume matching, answers, and scores run in this browser and can be inspected or changed. Do not use these results as recruiter-verified credentials.</span></div></div>;
}

export default function SkillVerification({ page, role, student, onResumeAnalyzed, flash, onNavigate }) {
  const [profile, setProfile] = useState(() => loadSkillProfile(student));
  const [settings, setSettings] = useState(loadSkillSettings);
  const [resumeText, setResumeText] = useState(() => loadSkillProfile(student).resume.text || "");
  const [resumeError, setResumeError] = useState("");
  const [manualSkill, setManualSkill] = useState("");
  const [certificateDraft, setCertificateDraft] = useState({ name: "", skill: "", organization: "", issueDate: "", certificateId: "" });
  const [certificateFile, setCertificateFile] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [minimumScore, setMinimumScore] = useState(0);
  const [minimumLevel, setMinimumLevel] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [clock, setClock] = useState(0);
  const committedQuestion = useRef("");

  useEffect(() => {
    saveSkillProfile(student, profile);
  }, [student, profile]);

  const resumeSkills = profile.resume.claimedSkills || [];
  const verifiedSkills = getVerifiedSkillScores(profile);
  const overallScore = verifiedSkills.length ? Math.round(verifiedSkills.reduce((sum, skill) => sum + skill.score, 0) / verifiedSkills.length) : 0;
  const active = profile.activeAssessment;
  const currentQuestion = active?.questions?.[active.questionIndex];
  const elapsed = active?.questionStartedAt ? Math.floor((clock - active.questionStartedAt) / 1000) : 0;
  const timeLeft = currentQuestion ? Math.max(0, currentQuestion.timeLimit - elapsed) : 0;

  const saveProfilePatch = (patch) => setProfile((current) => ({ ...current, ...patch }));

  useEffect(() => {
    if (!active || !currentQuestion) return undefined;
    const interval = window.setInterval(() => setClock(Date.now()), 200);
    return () => window.clearInterval(interval);
  }, [active, currentQuestion]);

  const submitAnswerRef = useRef(null);
  const submitAnswer = (timedOut = false) => {
    const current = profile.activeAssessment;
    if (!current) return;
    const question = current.questions[current.questionIndex];
    if (!question) return;
    const uniqueQuestion = `${current.id}:${question.id}`;
    if (committedQuestion.current === uniqueQuestion) return;
    committedQuestion.current = uniqueQuestion;
    const chosen = timedOut ? "" : selectedOption;
    const now = Date.now();
    const responseSeconds = Math.min(question.timeLimit, Math.max(0, Math.ceil((now - current.questionStartedAt) / 1000)));
    const answer = { questionId: question.id, skill: question.skill, selectedOption: chosen, correct: Boolean(chosen) && chosen === question.correctAnswer, responseSeconds, timedOut };
    const answers = [...current.answers, answer];
    if (current.questionIndex + 1 < current.questions.length) {
      setProfile((existing) => ({ ...existing, activeAssessment: { ...current, answers, questionIndex: current.questionIndex + 1, questionStartedAt: now } }));
      setSelectedOption("");
      setClock(now);
      return;
    }
    const correctAnswers = answers.filter((item) => item.correct).length;
    const percentage = Math.round((correctAnswers / current.questions.length) * 100);
    const perSkill = new Map();
    answers.forEach((item) => {
      const group = perSkill.get(item.skill) || { total: 0, correct: 0 };
      group.total += 1;
      if (item.correct) group.correct += 1;
      perSkill.set(item.skill, group);
    });
    const result = {
      id: current.id,
      level: current.level,
      levelName: LEVEL_NAMES[current.level],
      totalQuestions: current.questions.length,
      correctAnswers,
      incorrectAnswers: current.questions.length - correctAnswers,
      percentage,
      passed: percentage >= settings.passingThreshold,
      passingThreshold: settings.passingThreshold,
      timeTakenSeconds: answers.reduce((sum, item) => sum + item.responseSeconds, 0),
      averageResponseSeconds: Math.round(answers.reduce((sum, item) => sum + item.responseSeconds, 0) / Math.max(1, answers.length)),
      skillScores: [...perSkill.entries()].map(([skill, value]) => ({ skill, score: Math.round((value.correct / value.total) * 100), correct: value.correct, total: value.total })),
      answers,
      completedAt: new Date().toISOString(),
    };
    setProfile((existing) => ({ ...existing, activeAssessment: null, assessments: [...existing.assessments, result] }));
    setSelectedOption("");
    flash?.(`Level ${current.level} ${result.passed ? "passed" : "not cleared"} · ${percentage}%`);
  };
  useEffect(() => { submitAnswerRef.current = submitAnswer; });

  useEffect(() => {
    if (active && timeLeft <= 0) submitAnswerRef.current?.(true);
  }, [active?.id, active?.questionIndex, timeLeft, active]);

  const startLevel = (level) => {
    if (!resumeSkills.length) {
      flash?.("Analyze a resume first to create an assessment from the detected skills.");
      return;
    }
    if (level > 1 && !profile.assessments.some((item) => item.level === level - 1 && item.passed)) return;
    committedQuestion.current = "";
    const now = Date.now();
    const questions = generateQuestions(resumeSkills, level, Math.min(10, Math.max(3, Number(settings.questionsPerLevel) || 5)));
    saveProfilePatch({ activeAssessment: { id: randomId(), sessionId: randomId(), level, questions, answers: [], questionIndex: 0, startedAt: now, questionStartedAt: now } });
    setSelectedOption("");
    setClock(now);
  };

  const analyzeResume = () => {
    const analysis = extractResumeProfile(resumeText);
    if (!analysis.claimedSkills.length) {
      setResumeError("No recognized skills found yet. Add the resume text or list the skills clearly, then analyze again.");
      return;
    }
    setResumeError("");
    saveProfilePatch({ resume: { ...profile.resume, text: resumeText, claimedSkills: analysis.claimedSkills, sections: analysis.sections, analyzedAt: new Date().toISOString() } });
    onResumeAnalyzed?.({ resumeName: profile.resume.fileName, skills: analysis.claimedSkills.map((item) => item.name).join(", ") });
    flash?.(`${analysis.claimedSkills.length} resume-claimed skills found. They are not verified until assessed.`);
  };

  const uploadResume = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setResumeError("Resume must be 8 MB or smaller.");
      return;
    }
    try {
      const fileId = await storeSkillDocument(file);
      let text = resumeText;
      if (/\.(txt|md)$/i.test(file.name)) text = await file.text();
      setResumeText(text);
      saveProfilePatch({ resume: { ...profile.resume, fileName: file.name, fileId, text } });
      setResumeError("");
    } catch (error) {
      setResumeError(error.message || "Could not store this resume in browser storage.");
    }
  };

  const addAdditionalSkill = () => {
    const name = manualSkill.trim();
    if (!name || profile.additionalSkills.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    saveProfilePatch({ additionalSkills: [...profile.additionalSkills, { id: randomId(), name, type: "Additional skill", createdAt: new Date().toISOString() }] });
    setManualSkill("");
  };

  const addCertificate = async (event) => {
    event.preventDefault();
    if (!certificateDraft.name.trim()) return;
    let fileId = "";
    if (certificateFile) {
      const validType = ["application/pdf", "image/jpeg", "image/png"].includes(certificateFile.type) || /\.(pdf|jpe?g|png)$/i.test(certificateFile.name);
      if (!validType) { flash?.("Certificate must be PDF, JPG, JPEG, or PNG."); return; }
      if (certificateFile.size > 5 * 1024 * 1024) { flash?.("Certificate must be 5 MB or smaller."); return; }
      try { fileId = await storeSkillDocument(certificateFile); } catch (error) { flash?.(error.message || "Could not store the certificate file."); return; }
    }
    const certificate = { id: randomId(), ...certificateDraft, fileName: certificateFile?.name || "", fileId, source: "STUDENT_UPLOADED", status: "PENDING", uploadedAt: new Date().toISOString() };
    saveProfilePatch({ certificates: [certificate, ...profile.certificates] });
    setCertificateDraft({ name: "", skill: "", organization: "", issueDate: "", certificateId: "" });
    setCertificateFile(null);
    const input = document.getElementById("skill-certificate-file");
    if (input) input.value = "";
    flash?.("Certificate saved as student-uploaded and pending review.");
  };

  const openDocument = async (fileId) => {
    if (!fileId) return flash?.("No document was attached.");
    try {
      const file = await loadSkillDocument(fileId);
      if (!file) return flash?.("This file is not available in this browser.");
      const url = URL.createObjectURL(file);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) { flash?.(error.message || "Could not open the document."); }
  };

  const changeCertificateStatus = (ownerEmail, certificateId, status) => {
    const owner = String(ownerEmail || "").toLowerCase();
    const ownerProfile = loadSkillProfile({ email: owner });
    const updated = { ...ownerProfile, certificates: ownerProfile.certificates.map((item) => item.id === certificateId ? { ...item, status, reviewedAt: new Date().toISOString() } : item) };
    saveSkillProfile(updated.student, updated);
    if (owner === String(student.email || "").toLowerCase()) setProfile(updated);
    flash?.(`Certificate marked ${status.toLowerCase()}.`);
  };

  const candidateDirectory = Object.values(readSkillDirectory());
  const filteredCandidates = candidateDirectory.filter((candidate) => {
    const hasSkill = filterSkill ? candidate.skillScores?.some((item) => item.skill.toLowerCase() === filterSkill.toLowerCase() && item.score >= Number(minimumScore)) : candidate.overallScore >= Number(minimumScore);
    const hasLevel = Number(minimumLevel) === 0 || (candidate.passedLevels || []).some((level) => level >= Number(minimumLevel));
    return hasSkill && hasLevel;
  });
  const candidate = candidateDirectory.find((item) => item.student.email === selectedCandidate) || filteredCandidates[0];

  const saveSettings = (next) => {
    const safe = {
      passingThreshold: Math.max(0, Math.min(100, Number(next.passingThreshold) || 0)),
      strongThreshold: Math.max(0, Math.min(100, Number(next.strongThreshold) || 0)),
      developingThreshold: Math.max(0, Math.min(100, Number(next.developingThreshold) || 0)),
      questionsPerLevel: Math.max(3, Math.min(10, Number(next.questionsPerLevel) || 5)),
    };
    setSettings(safe);
    saveSkillSettings(safe);
    flash?.("Assessment settings saved in this browser.");
  };

  const allAttempts = profile.assessments;
  const totalQuestions = allAttempts.reduce((sum, item) => sum + item.totalQuestions, 0);
  const totalCorrect = allAttempts.reduce((sum, item) => sum + item.correctAnswers, 0);
  const strongSkills = verifiedSkills.filter((item) => item.score >= settings.strongThreshold);
  const developingSkills = verifiedSkills.filter((item) => item.score >= settings.developingThreshold && item.score < settings.strongThreshold);
  const improvementSkills = verifiedSkills.filter((item) => item.score < settings.developingThreshold);

  if (page === "Resume & skills") return <>
    <Heading eyebrow="RESUME → CLAIMED SKILLS" title="Resume analysis" description="Upload a resume, review the detected claims, and choose which claims to demonstrate."/><Notice/>
    <section className="workflow-card skill-upload-card"><div className="skill-card-heading"><span className="skill-icon purple"><FileText size={18}/></span><div><h2>Upload your resume</h2><p>Files stay in this browser demo. Plain-text resumes can be analyzed directly; for PDF/DOCX, paste the extracted text below.</p></div></div>
      <label className="skill-file-picker"><Upload size={16}/><span>{profile.resume.fileName || "Choose resume (PDF, DOCX, TXT, or MD)"}</span><input type="file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" onChange={uploadResume}/></label>
      <label className="workflow-field full-field">Resume text for local keyword matching<textarea rows="8" value={resumeText} onChange={(event) => setResumeText(event.target.value)} placeholder="Paste resume text here: skills, projects, internships, education, experience, and certifications…"/></label>
      {resumeError && <p className="skill-inline-error" role="alert">{resumeError}</p>}
      <div className="inline-actions"><button className="primary-button" onClick={analyzeResume}><Sparkles size={15}/> Analyze resume claims</button>{profile.resume.analyzedAt && <span className="skill-muted">Analyzed {new Date(profile.resume.analyzedAt).toLocaleString()}</span>}</div>
    </section>
    {profile.resume.analyzedAt && <section className="workflow-card"><div className="skill-card-heading"><span className="skill-icon violet"><BrainCircuit size={18}/></span><div><h2>Resume-claimed skills</h2><p>These were found in text. They are not verified skills.</p></div></div><div className="skill-badge-list">{resumeSkills.map((item) => <span className="skill-claim-badge" key={item.name}>{item.name}<small>{item.category} · CLAIMED</small></span>)}</div>
      <div className="skill-section-grid">{Object.entries(profile.resume.sections || {}).map(([label, values]) => <article className="skill-fact-card" key={label}><b>{label}</b>{values.length ? <ul>{values.map((value, index) => <li key={`${label}-${index}`}>{value}</li>)}</ul> : <small>No {label} section detected from the pasted text.</small>}</article>)}</div>
      <button className="soft-button" onClick={() => onNavigate?.("Verify skills")}>Verify your skills <ArrowRight size={15}/></button>
    </section>}
  </>;

  if (page === "Verify skills") return <>
    <Heading eyebrow="TIMED SKILL ASSESSMENT" title="Verify your skills" description="Questions are selected from the skills detected in your resume and randomized for this attempt."/><Notice/>
    {active ? <AssessmentSession key={active.id} active={active} question={currentQuestion} timeLeft={timeLeft} selectedOption={selectedOption} setSelectedOption={setSelectedOption} submit={() => submitAnswer(false)} onExit={() => { saveProfilePatch({ activeAssessment: null }); setSelectedOption(""); }}/>
      : <><section className="skill-levels-grid">{[1, 2, 3].map((level) => { const status = levelStatus(profile, level); const locked = status === "LOCKED"; const last = [...profile.assessments].reverse().find((item) => item.level === level); return <article className={`skill-level-card ${locked ? "locked" : ""}`} key={level}><div className="skill-level-top"><span>LEVEL {level}</span><b className={last?.passed ? "passed" : status === "LOCKED" ? "locked-label" : "ready"}>{last?.passed ? <><CheckCircle2 size={13}/> PASSED</> : status}</b></div><h2>{LEVEL_NAMES[level]}</h2><p>{LEVEL_DETAILS[level]}</p><small><Clock3 size={13}/> {settings.questionsPerLevel} questions · 1 minute each</small>{last && <div className="skill-last-result">Latest: <b>{last.percentage}%</b> · {last.correctAnswers}/{last.totalQuestions} correct</div>}<button className={locked ? "soft-button" : "primary-button"} disabled={locked || !resumeSkills.length} onClick={() => startLevel(level)}>{locked ? <><LockKeyhole size={14}/> Complete prior level</> : last && !last.passed ? <><RotateCcw size={14}/> Retry level</> : last?.passed ? <><Check size={14}/> Passed</> : <>Start level <ArrowRight size={14}/></>}</button></article>; })}</section>
      {!resumeSkills.length && <section className="empty-state"><FileText size={25}/><h2>Analyze a resume to begin</h2><p>Your assessment should use skills you claim on your resume. Upload and analyze one first.</p><button className="primary-button" onClick={() => onNavigate?.("Resume & skills")}>Go to resume analysis <ArrowRight size={14}/></button></section>}
      {allAttempts.length > 0 && <ResultReport profile={profile} settings={settings} overallScore={overallScore} totalQuestions={totalQuestions} totalCorrect={totalCorrect} strongSkills={strongSkills} developingSkills={developingSkills} improvementSkills={improvementSkills}/>}
      </>}
  </>;

  if (page === "Additional qualifications") return <>
    <Heading eyebrow="SKILLS & CERTIFICATES" title="Additional qualifications" description="Add skills not listed on your resume and upload certificates for review."/><Notice/>
    <section className="workflow-card"><div className="skill-card-heading"><span className="skill-icon green"><Plus size={18}/></span><div><h2>Add an additional skill</h2><p>Manually added skills stay separate from resume claims and assessed skills.</p></div></div><div className="scan-input-row"><input value={manualSkill} onChange={(event) => setManualSkill(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAdditionalSkill(); } }} placeholder="e.g. Kubernetes, public speaking"/><button className="primary-button" onClick={addAdditionalSkill}><Plus size={15}/> Add skill</button></div><div className="skill-badge-list">{profile.additionalSkills.map((item) => <span className="skill-claim-badge extra" key={item.id}>{item.name}<small>STUDENT ADDED</small><button aria-label={`Remove ${item.name}`} onClick={() => saveProfilePatch({ additionalSkills: profile.additionalSkills.filter((skill) => skill.id !== item.id) })}><X size={12}/></button></span>)}</div></section>
    <section className="workflow-card"><div className="skill-card-heading"><span className="skill-icon gold"><Award size={18}/></span><div><h2>Upload a course or skill certificate</h2><p>Every upload is labeled student-submitted until a reviewer checks it.</p></div></div><form onSubmit={addCertificate}><div className="workflow-grid">
      <label className="workflow-field">Certificate name<input required value={certificateDraft.name} onChange={(event) => setCertificateDraft((current) => ({ ...current, name: event.target.value }))} placeholder="AWS Cloud Practitioner"/></label>
      <label className="workflow-field">Skill / course<input value={certificateDraft.skill} onChange={(event) => setCertificateDraft((current) => ({ ...current, skill: event.target.value }))} placeholder="AWS"/></label>
      <label className="workflow-field">Issuing organization<input value={certificateDraft.organization} onChange={(event) => setCertificateDraft((current) => ({ ...current, organization: event.target.value }))} placeholder="Amazon Web Services"/></label>
      <label className="workflow-field">Issue date<input type="date" value={certificateDraft.issueDate} onChange={(event) => setCertificateDraft((current) => ({ ...current, issueDate: event.target.value }))}/></label>
      <label className="workflow-field">Certificate ID (optional)<input value={certificateDraft.certificateId} onChange={(event) => setCertificateDraft((current) => ({ ...current, certificateId: event.target.value }))} placeholder="Certificate number"/></label>
      <label className="workflow-field">Document · PDF, JPG, JPEG, PNG<input id="skill-certificate-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setCertificateFile(event.target.files?.[0] || null)}/></label>
    </div><button className="primary-button" type="submit"><Upload size={15}/> Save certificate for review</button></form></section>
    <CertificateList certificates={profile.certificates} onOpen={openDocument}/>
  </>;

  if (page === "Verified skill profile" || page === "Candidate skill profiles") return <>
    <Heading eyebrow={role === "Student" ? "STUDENT SKILL PROFILE" : "RECRUITER CANDIDATE VIEW"} title={role === "Student" ? "AI-assisted skill profile" : "Candidate skill profiles"} description={role === "Student" ? "Compare resume claims with scores earned in the timed assessment." : "Filter candidates using claimed skills, demonstrated scores, and passed levels."}/><Notice/>
    {role !== "Student" && <section className="workflow-card skill-filter-card"><label className="workflow-field">Assessed skill<select value={filterSkill} onChange={(event) => setFilterSkill(event.target.value)}><option value="">All skills</option>{SKILL_CATALOG.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label className="workflow-field">Minimum assessed score <div className="filter-score-row"><input type="range" min="0" max="100" value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value))}/><b>{minimumScore}%</b></div></label><label className="workflow-field">Assessment progression<select value={minimumLevel} onChange={(event) => setMinimumLevel(Number(event.target.value))}><option value="0">Any level</option><option value="1">Passed Level 1+</option><option value="2">Passed Level 2+</option><option value="3">Passed Level 3</option></select></label><p className="skill-filter-note">Matches show the measurable filters used. No unexplained AI ranking is applied.</p></section>}
    {role !== "Student" && <div className="candidate-list">{filteredCandidates.length ? filteredCandidates.map((item) => <button className={`candidate-row ${candidate?.student.email === item.student.email ? "selected" : ""}`} key={item.student.email} onClick={() => setSelectedCandidate(item.student.email)}><span className="candidate-avatar">{(item.student.fullName || "S").split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><span><b>{item.student.fullName}</b><small>{item.student.branch || "Branch not entered"} · {item.skillScores?.length || 0} assessed skills</small></span><strong>{item.overallScore ? `${item.overallScore}%` : "No score"}</strong></button>) : <div className="empty-state"><Users size={25}/><h2>No local candidate records match</h2><p>This demo only lists skill profiles saved in this browser.</p></div>}</div>}
    {role === "Student" ? <StudentSkillProfile profile={profile} settings={settings} overallScore={overallScore} onOpen={openDocument}/> : candidate && <CandidateSkillProfile candidate={candidate} settings={settings} onOpen={openDocument}/>}
  </>;

  if (page === "Skill analytics" || page === "Assessment analytics") {
    const directory = candidateDirectory;
    const averages = SKILL_CATALOG.map(({ name }) => {
      const values = directory.flatMap((item) => item.skillScores || []).filter((score) => score.skill === name).map((score) => score.score);
      return values.length ? { name, score: Math.round(values.reduce((sum, score) => sum + score, 0) / values.length), count: values.length } : null;
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    return <><Heading eyebrow="SKILL ANALYTICS" title="Assessment performance" description="Aggregate results from skill profiles saved in this browser demo."/><Notice/><div className="metrics-grid"><Metric label="LOCAL CANDIDATES" value={directory.length} icon={Users}/><Metric label="ASSESSMENTS" value={directory.reduce((sum, item) => sum + (item.assessments?.length || 0), 0)} icon={Activity}/><Metric label="QUESTIONS ATTEMPTED" value={directory.reduce((sum, item) => sum + item.questionsAttempted, 0)} icon={Target}/><Metric label="AVERAGE VERIFIED SCORE" value={directory.length ? `${Math.round(directory.reduce((sum, item) => sum + item.overallScore, 0) / directory.length)}%` : "—"} icon={BarChart3}/></div><section className="workflow-card"><div className="skill-card-heading"><span className="skill-icon purple"><BarChart3 size={18}/></span><div><h2>Average score by skill</h2><p>Only completed assessment scores are included.</p></div></div><ScoreBars items={averages} settings={settings}/></section><section className="workflow-card"><h2>Level progression</h2><div className="skill-level-summary">{[1, 2, 3].map((level) => { const count = directory.filter((item) => item.passedLevels?.includes(level)).length; return <article key={level}><span>LEVEL {level}</span><b>{count}</b><small>candidates passed</small></article>; })}</div></section></>;
  }

  if (page === "Skill settings" || page === "Certificate review") {
    if (page === "Skill settings") return <><Heading eyebrow="ADMIN ASSESSMENT CONTROLS" title="Skill assessment settings" description="Set the pass mark, skill bands, and assessment length used by this browser demo."/><Notice/><section className="workflow-card skill-settings-form"><h2>Assessment thresholds</h2><label className="workflow-field">Passing percentage<input type="number" min="0" max="100" value={settings.passingThreshold} onChange={(event) => setSettings((current) => ({ ...current, passingThreshold: event.target.value }))}/><small>Required to unlock the next level.</small></label><label className="workflow-field">Strong skill threshold<input type="number" min="0" max="100" value={settings.strongThreshold} onChange={(event) => setSettings((current) => ({ ...current, strongThreshold: event.target.value }))}/></label><label className="workflow-field">Developing skill threshold<input type="number" min="0" max="100" value={settings.developingThreshold} onChange={(event) => setSettings((current) => ({ ...current, developingThreshold: event.target.value }))}/></label><label className="workflow-field">Questions per level<input type="number" min="3" max="10" value={settings.questionsPerLevel} onChange={(event) => setSettings((current) => ({ ...current, questionsPerLevel: event.target.value }))}/></label><button className="primary-button" onClick={() => saveSettings(settings)}>Save settings</button></section><p className="skill-filter-note">In this frontend demo, settings are browser-local and can be changed by anyone with browser access. Production settings need authenticated server-side admin authorization.</p></>;
    const allCertificates = candidateDirectory.flatMap((item) => (item.certificates || []).map((certificate) => ({ ...certificate, owner: item.student })));
    return <><Heading eyebrow="CERTIFICATE REVIEW" title="Review uploaded certificates" description="Student uploads remain unverified until a reviewer explicitly updates their status."/><Notice/><section className="workflow-table">{allCertificates.length ? allCertificates.map((certificate) => <article key={certificate.id}><div><b>{certificate.name}</b><small>{certificate.owner.fullName} · {certificate.skill || "Skill not specified"} · {certificate.organization || "Issuer not specified"}</small></div><span className={`status-pill ${certificate.status === "VERIFIED" ? "good" : certificate.status === "REJECTED" ? "bad" : ""}`}>{certificate.status === "PENDING" ? "STUDENT-UPLOADED · PENDING" : certificate.status}</span>{certificate.fileId && <button className="soft-button" onClick={() => openDocument(certificate.fileId)}>Open document</button>}<button className="soft-button" onClick={() => changeCertificateStatus(certificate.owner.email, certificate.id, "VERIFIED")}>Verify</button><button className="soft-button" onClick={() => changeCertificateStatus(certificate.owner.email, certificate.id, "REJECTED")}>Reject</button></article>) : <div className="empty-state"><Award size={25}/><h2>No certificates to review</h2><p>Student uploads from this browser will appear here as pending.</p></div>}</section></>;
  }

  return <><Heading eyebrow="SKILL VERIFICATION" title="Skill workflow" description="Choose a step to continue your skill evidence and assessment journey."/><section className="workflow-card"><div className="pipeline-list">{[["Resume & skills",FileText],["Verify skills",BrainCircuit],["Additional qualifications",Award],["Verified skill profile",ShieldCheck],["Skill analytics",BarChart3]].map(([name, Icon]) => <button className="pipeline-row" key={name} onClick={() => onNavigate?.(name)}><Icon size={16}/>{name}<ArrowRight size={14}/></button>)}</div></section></>;
}

function AssessmentSession({ active, question, timeLeft, selectedOption, setSelectedOption, submit, onExit }) {
  if (!question) return null;
  const selectedLabel = question.options.find((option) => option.label === selectedOption)?.label;
  return <section className="workflow-card skill-assessment-session"><div className="assessment-session-top"><div><span className="skill-session-chip">LEVEL {active.level} · {LEVEL_NAMES[active.level].toUpperCase()}</span><h2>Question {active.questionIndex + 1} of {active.questions.length}</h2><p>{question.skill} · {question.type}</p></div><div className={`assessment-timer ${timeLeft <= 10 ? "urgent" : ""}`}><Clock3 size={18}/><b>00:{String(timeLeft).padStart(2, "0")}</b></div></div><div className="progress-track"><span style={{ width: `${((active.questionIndex + 1) / active.questions.length) * 100}%` }}/></div><div className="assessment-question"><span>{question.skill} · {question.type}</span><h3>{question.prompt}</h3><div className="assessment-options">{question.options.map((option, index) => <button type="button" className={selectedLabel === option.label ? "chosen" : ""} key={option.id} onClick={() => setSelectedOption(option.label)}><i>{String.fromCharCode(65 + index)}</i>{option.label}</button>)}</div></div><div className="assessment-session-footer"><small><LockKeyhole size={13}/> Previous answers cannot be changed in this demo</small><div><button className="soft-button" onClick={onExit}>Exit assessment</button><button className="primary-button" onClick={submit} disabled={!selectedOption}>Submit answer <ArrowRight size={14}/></button></div></div></section>;
}

function ResultReport({ profile, settings, overallScore, totalQuestions, totalCorrect, strongSkills, developingSkills, improvementSkills }) {
  const latest = [...profile.assessments].reverse()[0];
  return <section className="workflow-card skill-report"><div className="skill-card-heading"><span className="skill-icon violet"><BarChart3 size={18}/></span><div><h2>Assessment report</h2><p>Assessment summary · browser demo results</p></div><span className={`status-pill ${latest?.passed ? "good" : "bad"}`}>Level {latest?.level} {latest?.passed ? "passed" : "not cleared"}</span></div><div className="skill-result-metrics"><article><small>OVERALL SKILL SCORE</small><b>{overallScore}%</b></article><article><small>QUESTIONS ATTEMPTED</small><b>{totalQuestions}</b></article><article><small>CORRECT ANSWERS</small><b>{totalCorrect}/{totalQuestions}</b></article><article><small>AVG RESPONSE TIME</small><b>{latest?.averageResponseSeconds || 0}s</b></article><article><small>TIME THIS LEVEL</small><b>{formatSeconds(latest?.timeTakenSeconds || 0)}</b></article><article><small>PASS THRESHOLD</small><b>{settings.passingThreshold}%</b></article></div><ScoreBars items={getVerifiedSkillScores(profile)} settings={settings}/><div className="skill-bands"><Band title="Strong skills" skills={strongSkills} tone="strong"/><Band title="Developing skills" skills={developingSkills} tone="developing"/><Band title="Needs more practice" skills={improvementSkills} tone="practice"/></div><p className="skill-summary-copy">{descriptiveSummary(getVerifiedSkillScores(profile))}</p></section>;
}

function StudentSkillProfile({ profile, settings, overallScore, onOpen }) {
  const scores = getVerifiedSkillScores(profile);
  const passed = [1, 2, 3].filter((level) => profile.assessments.some((item) => item.level === level && item.passed));
  const last = [...profile.assessments].reverse()[0];
  return <><section className="skill-profile-hero"><span className="skill-profile-avatar">{(profile.student.fullName || "S").split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><div><small>AI-ASSISTED SKILL PROFILE · DEMO</small><h2>{profile.student.fullName}</h2><p>{profile.student.branch || "Branch not entered"} · {profile.student.graduationYear || "Graduation year not entered"} · CGPA {profile.student.cgpa || "—"}</p></div><div className="skill-overall-score"><b>{overallScore}%</b><small>Overall assessed</small></div></section><div className="skill-profile-columns"><section className="workflow-card"><div className="skill-card-heading"><span className="skill-icon purple"><Target size={18}/></span><div><h2>Resume claims and assessed skills</h2><p>Claims and scores are shown separately.</p></div></div><h3>Resume-claimed skills</h3><div className="skill-badge-list">{profile.resume.claimedSkills.length ? profile.resume.claimedSkills.map((skill) => <span className="skill-claim-badge" key={skill.name}>{skill.name}<small>CLAIMED</small></span>) : <small>No resume skill claims analyzed.</small>}</div><h3>Assessment score by skill</h3><ScoreBars items={scores} settings={settings}/><h3>Additional skills</h3><div className="skill-badge-list">{profile.additionalSkills.length ? profile.additionalSkills.map((item) => <span className="skill-claim-badge extra" key={item.id}>{item.name}<small>STUDENT ADDED · NOT ASSESSED</small></span>) : <small>No additional skills added.</small>}</div></section><section className="workflow-card"><div className="skill-card-heading"><span className="skill-icon gold"><Award size={18}/></span><div><h2>Certificates</h2><p>Uploads are not automatically treated as genuine.</p></div></div><CertificateList certificates={profile.certificates} onOpen={onOpen}/><h3>Level progression</h3><div className="profile-level-list">{[1, 2, 3].map((level) => <div key={level}><span className={passed.includes(level) ? "done" : ""}>{passed.includes(level) ? <Check size={13}/> : level}</span><b>Level {level} · {LEVEL_NAMES[level]}</b><small>{levelStatus(profile, level)}</small></div>)}</div><div className="profile-last-result"><span>Latest assessment</span><b>{last ? `${last.percentage}% · ${last.passed ? "Passed" : "Retry available"}` : "Not started"}</b></div></section></div></>;
}

function CandidateSkillProfile({ candidate, settings, onOpen }) {
  const { student, resumeSkills, additionalSkills, certificates, skillScores, passedLevels, overallScore, assessments, questionsAttempted, correctAnswers, averageResponseSeconds } = candidate;
  const latest = [...(assessments || [])].reverse()[0];
  return <><section className="skill-profile-hero"><span className="skill-profile-avatar">{(student.fullName || "S").split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><div><small>RECRUITER CANDIDATE VIEW · LOCAL DEMO</small><h2>{student.fullName}</h2><p>{student.branch || "Branch not entered"} · {student.graduationYear || "Graduation year not entered"} · CGPA {student.cgpa || "—"}</p></div><div className="skill-overall-score"><b>{overallScore}%</b><small>Assessment average</small></div></section><div className="skill-profile-columns"><section className="workflow-card"><h2>Claimed vs assessed skills</h2><h3>Resume claims</h3><div className="skill-badge-list">{resumeSkills.length ? resumeSkills.map((skill) => <span className="skill-claim-badge" key={skill.name}>{skill.name}<small>CLAIMED ON RESUME</small></span>) : <small>No resume claims.</small>}</div><h3>Assessment-verified skills · demo</h3><ScoreBars items={skillScores} settings={settings}/><div className="skill-result-metrics"><article><small>HIGHEST LEVEL PASSED</small><b>{passedLevels.length ? `Level ${Math.max(...passedLevels)}` : "None"}</b></article><article><small>QUESTIONS</small><b>{questionsAttempted}</b></article><article><small>CORRECT</small><b>{correctAnswers}/{questionsAttempted}</b></article><article><small>AVG RESPONSE</small><b>{averageResponseSeconds}s</b></article></div><p className="skill-filter-note">The assessment level shown below is the highest sequential level passed in this demo. Scores are client-side and are not independently verifiable.</p></section><section className="workflow-card"><h2>Additional qualifications</h2><div className="skill-badge-list">{additionalSkills.length ? additionalSkills.map((item) => <span className="skill-claim-badge extra" key={item.id}>{item.name}<small>STUDENT ADDED</small></span>) : <small>None added.</small>}</div><h3>Certificates</h3><CertificateList certificates={certificates} onOpen={onOpen}/><h3>Recent assessment</h3>{latest ? <p>Level {latest.level} · {latest.percentage}% · {latest.passed ? "Passed" : "Not cleared"}</p> : <p>No assessment results.</p>}</section></div></>;
}

function CertificateList({ certificates = [], onOpen }) {
  if (!certificates.length) return <p className="skill-muted">No certificates uploaded.</p>;
  return <div className="skill-certificate-list">{certificates.map((item) => <article key={item.id}><span className="skill-icon gold"><Award size={16}/></span><div><b>{item.name}</b><small>{item.skill || "Skill not listed"} · {item.organization || "Issuer not listed"}</small><small>{item.fileName || "No file attached"} · {item.source === "PLATFORM_VERIFIED" ? "Platform verified" : "Student uploaded"}</small></div><span className={`status-pill ${item.status === "VERIFIED" ? "good" : item.status === "REJECTED" ? "bad" : ""}`}>{item.status}</span>{item.fileId && <button className="soft-button" onClick={() => onOpen(item.fileId)}>View</button>}</article>)}</div>;
}

function ScoreBars({ items = [], settings }) {
  if (!items.length) return <p className="skill-muted">No assessment score yet. Complete an assessment to show demonstrated performance.</p>;
  return <div className="skill-score-bars">{items.map((item) => <div className="skill-score-row" key={item.skill}><span><b>{item.skill}</b><small>{item.score >= settings.strongThreshold ? "Strong" : item.score >= settings.developingThreshold ? "Developing" : "Needs practice"}</small></span><div className="progress-track"><span style={{ width: `${item.score}%` }}/></div><strong>{item.score}%</strong></div>)}</div>;
}

function Band({ title, skills, tone }) {
  return <article className={`skill-band ${tone}`}><b>{title}</b><span>{skills.length ? skills.map((item) => `${item.skill} ${item.score}%`).join(" · ") : "No skills in this band yet."}</span></article>;
}

function descriptiveSummary(skills) {
  if (!skills.length) return "Complete an assessment to create a summary from measured answers.";
  const sorted = [...skills].sort((a, b) => b.score - a.score);
  const strong = sorted.filter((item) => item.score >= 80).map((item) => item.skill);
  const improve = sorted.filter((item) => item.score < 80).map((item) => item.skill);
  if (!improve.length) return `Assessment answers were strongest in ${strong.join(", ")}. All shown scores met or exceeded 80%.`;
  if (!strong.length) return `The current answers indicate more practice may help in ${improve.join(", ")}.`;
  return `Assessment answers were strongest in ${strong.join(", ")}. Additional practice may help in ${improve.join(", ")}.`;
}

function Metric({ label, value, icon: Icon }) {
  return <article className="metric-card"><span className="metric-icon lavender"><Icon size={18}/></span><p>{label}</p><strong>{value}</strong><small>Browser demo records</small></article>;
}

