import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Activity, AlertTriangle, ArrowRight, BadgeCheck, BellRing, CalendarDays, Camera, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, Download, FileCheck2, KeyRound, MapPin, Play, Radio, RefreshCw, ScanLine, Scale, Send, Share2, ShieldCheck, SkipForward, Volume2, X } from "lucide-react";
import { createPassportUrl, readPublicPassport } from "../../services/placementDemoService";
import "../../styles/placement-features.css";

const STAGES = ["Gate Check-in", "Online Test", "Technical Round", "System Design", "HR / Offer"];
const APPROVED = ["TPO", "Admin"];
const CONTROL_ROLES = ["TPO", "Recruiter", "Admin"];

const initials = (name = "Student") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const masked = (value = "") => value.length > 4 ? `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : value || "Not provided";
const money = (value) => Number.isFinite(Number(value)) && value !== "" ? `₹${Number(value).toLocaleString("en-IN")} LPA` : "Not set";
const packageNumber = (value = "") => {
  const match = String(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};
const classForStatus = (status) => status === "VERIFIED" || status === "COMPLETED" || status === "IN_PROGRESS" ? "good" : status === "REVOKED" || status === "EXPIRED" || status === "ABSENT" || status === "SKIPPED" ? "bad" : "pending";
const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.22);
    oscillator.onended = () => context.close();
  } catch {
    // Sound is optional; token and visual updates work without it.
  }
};

export function PlacementHighlights({ featureState, onOpen, role = "Student" }) {
  const { passport, drive, policy } = featureState;
  const passportPage = role === "Student" ? "Placement Passport" : "Passport Verification";
  const drivePage = "Live Drive War-Room";
  const policyPage = role === "Student" ? "Placement Policy" : "Placement Policy Engine";
  const active = drive.status === "ACTIVE";
  const myQueueItem = drive.queue.find((item) => item.isStudent || item.token === drive.ownToken);
  const policySummary = policy.active ? `TPO policy · ${policy.name || policy.category || "Configured"}` : "TPO policy setup required";
  return (
    <section className="placement-highlight" aria-label="Placement features">
      <div className="placement-highlight-main">
        <div className="placement-highlight-copy">
          <span className="demo-label"><SparklesIcon /> CAMPUSLINK SIGNATURE FEATURES</span>
          <h2>Placement Passport™ &amp; Live Drive War-Room</h2>
          <p>A verified placement identity, organized drive check-in, and transparent policy decisions in one student workspace.</p>
        </div>
        <div className="highlight-token"><small>LIVE DRIVE TOKEN</small><b>{myQueueItem?.token || drive.ownToken || "—"}</b></div>
        <button className="highlight-open" onClick={() => onOpen(drivePage)}>Open War-Room <ChevronRight size={17}/></button>
      </div>
      <div className="placement-highlight-cards">
        <button className="feature-mini-card" onClick={() => onOpen(passportPage)}>
          <span className="feature-mini-icon passport"><ShieldCheck size={19}/></span><span><small>PLACEMENT PASSPORT</small><b>{passport.status.replaceAll("_", " ")}</b></span><ArrowRight size={16}/>
        </button>
        <button className="feature-mini-card" onClick={() => onOpen(drivePage)}>
          <span className="feature-mini-icon drive"><Radio size={19}/></span><span><small>{active ? drive.company.toUpperCase() : "LIVE DRIVE"}</small><b>{active ? `${drive.nowServing} now serving · ${drive.room}` : "No active drive"}</b></span><ArrowRight size={16}/>
        </button>
        <button className="feature-mini-card" onClick={() => onOpen(policyPage)}>
          <span className="feature-mini-icon policy"><Scale size={19}/></span><span><small>PLACEMENT POLICY</small><b>{policySummary}</b></span><ArrowRight size={16}/>
        </button>
      </div>
    </section>
  );
}

function DemoBadge() {
  return <span className="demo-mode-badge"><CircleHelp size={13}/> DEMO VERIFICATION MODE</span>;
}

function PublicPassportVerification({ passportId }) {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const record = useMemo(() => readPublicPassport(decodeURIComponent(passportId), token), [passportId, token]);
  return (
    <main className="public-passport-page">
      <article className="public-passport-card">
        <div className="public-passport-brand"><span><ShieldCheck size={22}/></span><div><b>CAMPUSLINK</b><small>PASSPORT VERIFICATION</small></div></div>
        {record ? <>
          <div className={`public-validity ${classForStatus(record.status)}`}>{record.status === "VERIFIED" ? <CheckCircle2 size={21}/> : <AlertTriangle size={21}/>}<span>{record.status === "VERIFIED" ? "VALID · VERIFIED" : `RECORD FOUND · ${record.status.replaceAll("_", " ")}`}</span></div>
          <h1>Campus placement credential</h1>
          <dl><div><dt>Student</dt><dd>{record.name}</dd></div><div><dt>College ID</dt><dd>{masked(record.collegeId)}</dd></div><div><dt>Branch</dt><dd>{record.branch || "Not provided"}</dd></div><div><dt>Placement eligible</dt><dd>{record.eligibility}</dd></div><div><dt>Verified</dt><dd>{record.verifiedAt ? new Date(record.verifiedAt).toLocaleString() : "Pending review"}</dd></div></dl>
          <p className="public-demo-note"><DemoBadge/> This is a local prototype check. Final verification requires a trusted server.</p>
        </> : <div className="public-invalid"><AlertTriangle size={27}/><h1>Passport could not be verified</h1><p>This demo link is invalid or its local browser record is unavailable. Ask the student or TPO to reopen the passport on the same demo workspace.</p></div>}
      </article>
    </main>
  );
}

function PassportPage({ role, student, state, setState, flash }) {
  const [scanValue, setScanValue] = useState("");
  const [scanRecord, setScanRecord] = useState(null);
  const [openedAt] = useState(() => Date.now());
  const passport = state.passport;
  const passportStatus = passport.expiresAt && Date.parse(passport.expiresAt) < openedAt ? "EXPIRED" : passport.status;
  const checks = passport.checks;
  const url = createPassportUrl(passport);
  const isTpo = APPROVED.includes(role);
  const isRecruiter = role === "Recruiter";
  const patchPassport = (patch) => setState((current) => ({ ...current, passport: { ...current.passport, ...patch } }));
  const setCheck = (id, status, note) => patchPassport({ checks: checks.map((check) => check.id === id ? { ...check, status, note } : check) });
  const snapshot = () => ({ fullName: student.fullName || "", email: student.email || "", phone: student.phone || "", collegeId: student.collegeId || "", branch: student.branch || "", cgpa: student.cgpa || "", skills: student.skills || "", projects: student.projects || "", certificates: student.certificates || "", resumeName: student.resumeName || "", aptitude: student.aptitude || "", mockInterview: student.mockInterview || "" });
  const approve = () => {
    const now = new Date();
    patchPassport({ status: "VERIFIED", expiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(), verifiedAt: now.toISOString(), profileSnapshot: snapshot(), checks: checks.map((check) => ({ ...check, status: "VERIFIED", note: "Approved in local demo verification mode" })) });
    flash("Passport approved in local demo mode. No external records were checked.");
  };
  const recheck = () => {
    patchPassport({ status: "UNDER_REVIEW", verifiedAt: null, profileSnapshot: snapshot(), checks: checks.map((check) => ({ ...check, status: "PENDING", note: "Recheck requested in demo mode" })) });
    flash("Passport moved to review. Verification items need TPO approval.");
  };
  const reject = () => {
    patchPassport({ status: "REVOKED", verifiedAt: null });
    flash("Passport marked revoked in the local demo record.");
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "CAMPUSLINK Placement Passport", url });
      else { await navigator.clipboard.writeText(url); flash("Passport verification link copied."); }
    } catch { flash("Share was cancelled or unavailable."); }
  };
  const uploadPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2_000_000) { flash("Choose an image under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => patchPassport({ photo: String(reader.result || "") });
    reader.readAsDataURL(file);
  };
  const scan = () => {
    const candidateUrl = scanValue.trim();
    try {
      const parsed = new URL(candidateUrl, window.location.origin);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = parts.at(-1);
      const token = parsed.searchParams.get("token") || scanValue.trim();
      const result = readPublicPassport(id, token);
      setScanRecord(result);
      if (!result) flash("Passport QR could not be validated in this browser demo.");
    } catch { setScanRecord(null); flash("Paste a passport verification URL or token."); }
  };
  const markPresent = () => {
    if (!scanRecord || scanRecord.status !== "VERIFIED" || scanRecord.eligibility !== "YES") { flash("Candidate needs a verified passport and eligibility clearance before check-in."); return; }
    setState((current) => {
      const existing = current.drive.queue.find((candidate) => candidate.isStudent && candidate.candidate === scanRecord.name);
      const nextNumber = Math.max(0, ...current.drive.queue.map((candidate) => Number(candidate.token.split("-").at(-1)) || 0)) + 1;
      const token = existing?.token || `B-${String(nextNumber).padStart(2, "0")}`;
      const queue = existing
        ? current.drive.queue.map((candidate) => candidate.token === token ? { ...candidate, status: "WAITING" } : candidate)
        : [...current.drive.queue, { token, candidate: scanRecord.name, status: "WAITING", room: current.drive.room, round: current.drive.currentStage, isStudent: scanRecord.name === student.fullName }];
      return { ...current, drive: { ...current.drive, ownToken: scanRecord.name === student.fullName ? token : current.drive.ownToken, queue }, passport: { ...current.passport, checks: current.passport.checks.map((check) => check.id === "attendance" && scanRecord.name === student.fullName ? { ...check, status: "VERIFIED", note: "Drive check-in recorded in demo mode" } : check) } };
    });
    flash("Candidate marked present and added to the demo queue.");
  };
  return (
    <>
      <div className="feature-page-heading"><div><p className="eyebrow">DIGITAL PLACEMENT CREDENTIAL</p><h1>Placement Passport</h1><p>One reviewable credential for campus placement drives.</p></div><DemoBadge/></div>
      <section className="passport-layout">
        <article className="passport-card">
          <div className="passport-card-top"><span className="passport-mark"><ShieldCheck size={22}/></span><div><b>CAMPUSLINK</b><small>PLACEMENT PASSPORT</small></div><span className={`passport-status ${classForStatus(passportStatus)}`}>{passportStatus === "VERIFIED" ? <CheckCircle2 size={14}/> : <Clock3 size={14}/>} {passportStatus.replaceAll("_", " ")}</span></div>
          <div className="passport-person"><label className="passport-photo" title="Profile photo">
            {passport.photo ? <img src={passport.photo} alt="Student profile"/> : <span>{initials(student.fullName)}</span>}
            {role === "Student" && <><input type="file" accept="image/*" onChange={uploadPhoto}/><Camera size={15}/></>}
          </label><div className="passport-student"><small>STUDENT CREDENTIAL</small><h2>{student.fullName || "Student"}</h2><p>{student.branch || "Branch pending"}</p><div className="passport-tags"><span>College ID · {masked(student.collegeId)}</span><span>ID · {passport.passportId}</span></div></div><div className="passport-qr"><QRCodeSVG value={url} size={132} level="M" includeMargin/><small>SCAN TO VERIFY</small></div></div>
          <div className="passport-card-foot"><span><KeyRound size={14}/> Opaque verification token</span><span>Demo-only · local browser record</span></div>
        </article>
        <aside className="passport-checks-card"><div className="passport-checks-heading"><div><h2>Verification seals</h2><p>Mock review layer · no ERP or external registry connection</p></div><span>{checks.filter((check) => check.status === "VERIFIED").length}/{checks.length}</span></div>
          <div className="passport-check-list">{checks.map((check) => <article className="passport-check" key={check.id}><span className={`check-dot ${classForStatus(check.status)}`}>{check.status === "VERIFIED" ? <Check size={12}/> : <Clock3 size={12}/>}</span><div><b>{check.label}</b><small>{check.note}</small></div><span className={`check-state ${classForStatus(check.status)}`}>{check.status === "VERIFIED" ? "VERIFIED · DEMO" : "PENDING"}</span>{isTpo && <button aria-label={`Toggle ${check.label}`} title="Toggle demo check" onClick={() => setCheck(check.id, check.status === "VERIFIED" ? "PENDING" : "VERIFIED", "Updated by TPO in demo mode")}>{check.status === "VERIFIED" ? "Undo" : "Review"}</button>}</article>)}</div>
          <div className="passport-action-row">
            {role === "Student" && <button className="soft-button" onClick={recheck}><Send size={15}/> Request review</button>}
            {isTpo && <><button className="soft-button" onClick={recheck}><RefreshCw size={15}/> Recheck</button><button className="soft-button danger-soft" onClick={reject}><X size={15}/> Reject</button><button className="primary-button" onClick={approve}><BadgeCheck size={15}/> Approve demo passport</button></>}
            {role !== "Student" && !isTpo && <span className="muted-copy">TPO controls are not available to recruiters.</span>}
          </div>
        </aside>
      </section>
      <section className="passport-tools-panel"><div><h2>Passport actions</h2><p>QR contains only a passport reference and random token. Public view masks the college ID.</p></div><div className="passport-action-row"><button className="soft-button" onClick={() => window.print()}><Download size={15}/> Download / print PDF</button><button className="soft-button" onClick={share}><Share2 size={15}/> Share verification</button><a className="primary-button link-button" href={url} target="_blank" rel="noreferrer"><ScanLine size={15}/> Open public verification</a></div></section>
      {isRecruiter && <section className="workflow-card passport-scan-panel"><div><h2>Recruiter passport scan</h2><p>Scan the QR with a device camera, or paste its verification URL to validate it in this local demo.</p></div><div className="scan-input-row"><input value={scanValue} onChange={(event) => setScanValue(event.target.value)} placeholder="Paste passport verification URL"/><button className="primary-button" onClick={scan}><ScanLine size={15}/> Validate</button></div>{scanRecord && <div className="scan-result"><CheckCircle2 size={18}/><span><b>{scanRecord.name}</b><small>{scanRecord.branch} · {scanRecord.eligibility} · {scanRecord.status}</small></span><button className="soft-button" onClick={markPresent}>Mark present</button></div>}</section>}
    </>
  );
}

function Pipeline({ stageIndex }) {
  return <div className="drive-pipeline">{STAGES.map((stage, index) => <div className={`drive-stage ${index < stageIndex ? "done" : index === stageIndex ? "active" : ""}`} key={stage}><span>{index < stageIndex ? <Check size={13}/> : index + 1}</span><b>{stage}</b></div>)}</div>;
}

function WarRoomPage({ role, student, state, setState, flash, jobs }) {
  const drive = state.drive;
  const canControl = CONTROL_ROLES.includes(role);
  const [moveToken, setMoveToken] = useState("");
  const [moveRoom, setMoveRoom] = useState(drive.room);
  const myItem = drive.queue.find((item) => item.isStudent || item.token === drive.ownToken);
  const activeItem = drive.queue.find((item) => item.token === drive.nowServing);
  const ahead = myItem ? drive.queue.filter((item) => item.token !== myItem.token && ["WAITING", "CALLED", "IN_PROGRESS"].includes(item.status) && Number(item.token.split("-").at(-1)) < Number(myItem.token.split("-").at(-1))).length : 0;
  const isTurn = myItem && ["CALLED", "IN_PROGRESS"].includes(myItem.status);
  const patchDrive = (patch) => setState((current) => ({ ...current, drive: { ...current.drive, ...patch } }));
  const callToken = (token) => {
    patchDrive({ nowServing: token, queue: drive.queue.map((item) => item.token === token ? { ...item, status: "CALLED" } : item.status === "IN_PROGRESS" ? { ...item, status: "COMPLETED" } : item) });
    if (drive.audioEnabled) playChime();
    flash(`${token} called to ${drive.room}.`);
  };
  const callNext = () => {
    const next = drive.queue.find((item) => item.status === "WAITING");
    if (!next) { flash("No waiting candidates remain in the demo queue."); return; }
    callToken(next.token);
  };
  const simulateNext = () => { callNext(); flash("DEMO SIMULATION: queue advanced to the next waiting token."); };
  const startInterview = () => {
    const item = drive.queue.find((candidate) => candidate.token === drive.nowServing);
    if (!item || item.status !== "CALLED") { flash("Call a candidate before starting an interview."); return; }
    patchDrive({ queue: drive.queue.map((candidate) => candidate.token === item.token ? { ...candidate, status: "IN_PROGRESS" } : candidate) });
    flash(`${item.token} interview started.`);
  };
  const completeRound = () => {
    const item = drive.queue.find((candidate) => candidate.token === drive.nowServing);
    if (!item) { flash("There is no active token to complete."); return; }
    const nextIndex = Math.min(STAGES.length - 1, drive.stageIndex + 1);
    patchDrive({ stageIndex: nextIndex, currentStage: STAGES[nextIndex], queue: drive.queue.map((candidate) => candidate.token === item.token ? { ...candidate, status: "COMPLETED", round: drive.currentStage } : candidate) });
    flash(`${item.token} completed ${drive.currentStage}. Stage updated to ${STAGES[nextIndex]}.`);
  };
  const setCandidateStatus = (token, status) => patchDrive({ queue: drive.queue.map((item) => item.token === token ? { ...item, status } : item) });
  const moveCandidate = () => {
    if (!moveToken.trim() || !moveRoom.trim()) { flash("Enter a token and a room before moving a candidate."); return; }
    patchDrive({ queue: drive.queue.map((item) => item.token === moveToken ? { ...item, room: moveRoom } : item) });
    if (moveToken === drive.nowServing) patchDrive({ room: moveRoom });
    flash(`${moveToken} moved to ${moveRoom}.`);
  };
  const stats = ["WAITING", "IN_PROGRESS", "COMPLETED", "SKIPPED", "ABSENT"].map((status) => [status, drive.queue.filter((item) => item.status === status).length]);
  return <>
    <div className="feature-page-heading"><div><p className="eyebrow">ACTIVE PLACEMENT DRIVE</p><h1>Live Drive War-Room</h1><p>Coordinate check-in, interview rooms, and candidate calls from one queue.</p></div><DemoBadge/></div>
    <section className="warroom-hero"><div className="warroom-company"><span className="warroom-live"><i/> {drive.status === "ACTIVE" ? "LIVE DRIVE · DEMO SIMULATION" : "DRIVE PAUSED"}</span><h2>{drive.company}</h2><p>{drive.title}</p><div className="warroom-meta"><span><CalendarDays size={15}/>{new Date(`${drive.date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span><span><MapPin size={15}/>{drive.venue}</span><span><Activity size={15}/>{drive.currentStage}</span></div></div><div className="warroom-current"><small>NOW SERVING</small><b>{activeItem?.token || drive.nowServing || "—"}</b><span>{drive.room}</span></div></section>
    <Pipeline stageIndex={drive.stageIndex}/>
    {!canControl ? <>
      <section className={`student-token-card ${isTurn ? "your-turn" : ""}`}>
        <div className="student-token-top"><span><Radio size={17}/> YOUR LIVE DRIVE TOKEN</span><span className={`status-pill ${isTurn ? "good" : ""}`}>{isTurn ? "YOUR TURN" : myItem?.status || "WAITING"}</span></div>
        <strong>{myItem?.token || drive.ownToken || "—"}</strong>
        <p>{isTurn ? `Please proceed to ${myItem?.room || drive.room}` : `${drive.company} · ${drive.currentStage}`}</p>
        <div className="token-stats"><div><small>NOW SERVING</small><b>{drive.nowServing || "—"}</b></div><div><small>ROOM</small><b>{myItem?.room || drive.room}</b></div><div><small>CANDIDATES AHEAD</small><b>{isTurn ? 0 : ahead}</b></div><div><small>ESTIMATED WAIT</small><b>{isTurn ? "Now" : `${ahead * 6} min`}</b></div></div>
        {isTurn && <div className="turn-alert" role="status"><BellRing size={18}/> Your interview is being called. Please proceed to {myItem?.room || drive.room}.</div>}
      </section>
      <section className="workflow-card student-drive-controls"><label><input type="checkbox" checked={drive.audioEnabled} onChange={(event) => patchDrive({ audioEnabled: event.target.checked })}/> Enable optional audio chime</label><button className="soft-button" onClick={playChime}><Volume2 size={15}/> Test sound</button><p className="muted-copy">Visual queue updates work without audio. Queue changes are local demo data and are not synchronized to other devices.</p></section>
    </> : <>
      <section className="queue-summary">{stats.map(([label, count]) => <article key={label}><small>{label.replaceAll("_", " ")}</small><b>{count}</b></article>)}<article><small>CHECKED IN</small><b>{drive.queue.length}</b></article></section>
      <section className="workflow-card queue-panel"><div className="queue-panel-heading"><div><h2>Interview token queue</h2><p>Candidate identities and actions are sample data for local demonstration.</p></div><label className="audio-switch"><input type="checkbox" checked={drive.audioEnabled} onChange={(event) => patchDrive({ audioEnabled: event.target.checked })}/> <Volume2 size={15}/> Audio chime</label></div>
        <div className="queue-table"><div className="queue-table-head"><span>Token</span><span>Candidate</span><span>Status</span><span>Room</span><span>Round</span><span>Actions</span></div>
          {drive.queue.map((item) => <article className={item.token === drive.nowServing ? "current-row" : ""} key={item.token}><b>{item.token}</b><span>{item.isStudent ? student.fullName || item.candidate : item.candidate}</span><span className={`queue-status ${classForStatus(item.status)}`}>{item.status.replaceAll("_", " ")}</span><span>{item.room}</span><span>{item.round}</span><span className="queue-row-actions">{item.status === "WAITING" && <button onClick={() => callToken(item.token)}>Call</button>}{item.status === "SKIPPED" && <button onClick={() => setCandidateStatus(item.token, "WAITING")}>Recall</button>}{["WAITING", "CALLED"].includes(item.status) && <><button className="danger-text" onClick={() => setCandidateStatus(item.token, "SKIPPED")}>Skip</button><button className="danger-text" onClick={() => setCandidateStatus(item.token, "ABSENT")}>Absent</button></>}</span></article>)}
        </div>
        <div className="queue-controls"><button className="primary-button" onClick={callNext}><SkipForward size={15}/> Call next</button><button className="soft-button" onClick={startInterview}><Play size={15}/> Start interview</button><button className="soft-button" onClick={completeRound}><Check size={15}/> Complete round</button><button className="demo-sim-button" onClick={simulateNext}><Radio size={15}/> Simulate next candidate · DEMO</button></div>
      </section>
      <section className="workflow-card queue-move-panel"><div><h2>Room and drive controls</h2><p>Changes stay in this browser demo; no WebSocket service is connected.</p></div><label className="workflow-field drive-job-control">Link a published role to this drive<select value={drive.jobId || ""} onChange={(event) => { const job = jobs.find((item) => item.id === event.target.value); patchDrive(job ? { jobId: job.id, company: job.company, title: `${job.title} · Campus Drive`, date: job.interviewDate || job.deadline || drive.date, venue: job.location || drive.venue } : { jobId: "" }); }}><option value="">{jobs.length ? "Keep demo drive" : "No published roles yet"}</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.company} · {job.title}</option>)}</select></label><div className="scan-input-row"><select value={moveToken} onChange={(event) => setMoveToken(event.target.value)} aria-label="Candidate token"><option value="">Select token</option>{drive.queue.map((item) => <option key={item.token} value={item.token}>{item.token} · {item.candidate}</option>)}</select><input value={moveRoom} onChange={(event) => setMoveRoom(event.target.value)} placeholder="Room"/><button className="soft-button" onClick={moveCandidate}>Move room</button></div><div className="inline-actions"><button className="soft-button" onClick={() => patchDrive({ status: drive.status === "ACTIVE" ? "PAUSED" : "ACTIVE" })}>{drive.status === "ACTIVE" ? "Pause demo drive" : "Resume demo drive"}</button><label className="workflow-field stage-control">Current stage<select value={drive.stageIndex} onChange={(event) => patchDrive({ stageIndex: Number(event.target.value), currentStage: STAGES[Number(event.target.value)] })}>{STAGES.map((stage, index) => <option key={stage} value={index}>{stage}</option>)}</select></label></div></section>
    </>}
  </>;
}

function evaluatePolicy(policy, currentOffer, newPackage) {
  if (!policy.active) return { decision: "REVIEW REQUIRED", rule: "NO_ACTIVE_POLICY", reason: "The TPO has not configured an active placement policy.", eligible: null };
  if (!policy.allowAnotherDrive) return { decision: "NOT ELIGIBLE", rule: "ADDITIONAL_DRIVE_RULE", reason: "The active TPO policy does not allow applications to another drive.", eligible: false };
  if (!Number.isFinite(newPackage) || newPackage <= 0) return { decision: "NEEDS PACKAGE", rule: "PACKAGE_REQUIRED", reason: "Enter the opportunity package to evaluate the configured rules.", eligible: null };
  if (policy.minPackage !== "" && newPackage < Number(policy.minPackage)) return { decision: "NOT ELIGIBLE", rule: "MINIMUM_PACKAGE_RULE", reason: `The opportunity is below the configured minimum package of ${money(policy.minPackage)}.`, eligible: false };
  if (policy.maxPackage !== "" && newPackage > Number(policy.maxPackage)) return { decision: "NOT ELIGIBLE", rule: "MAXIMUM_PACKAGE_RULE", reason: `The opportunity is above the configured maximum package of ${money(policy.maxPackage)}.`, eligible: false };
  if (currentOffer && policy.blockAfterOffer) {
    const requiredPackage = currentOffer.package * (1 + (Number(policy.minimumUpgradePercent) || 0) / 100);
    if (policy.minimumUpgradePercent !== "" && newPackage < requiredPackage) return { decision: "NOT ELIGIBLE", rule: "MINIMUM_UPGRADE_RULE", reason: `The configured rule requires at least ${policy.minimumUpgradePercent}% improvement over the current offer (${money(requiredPackage)}).`, eligible: false };
    if (policy.minimumUpgradePercent === "") return { decision: "NOT ELIGIBLE", rule: "OFFER_LOCK_RULE", reason: "Configured campus policy blocks additional drives after an offer.", eligible: false };
  }
  return { decision: "ELIGIBLE", rule: currentOffer && policy.blockAfterOffer ? "CONFIGURED_UPGRADE_RULE" : "CONFIGURED_POLICY_RULE", reason: "The opportunity meets the currently configured TPO policy.", eligible: true };
}

function PolicyPage({ role, student, state, setState, jobs, offers, flash }) {
  const canManage = APPROVED.includes(role);
  const [packageValue, setPackageValue] = useState("");
  const [opportunity, setOpportunity] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const policy = state.policy;
  const latestOffer = offers.find((offer) => ["Offered", "Accepted"].includes(offer.status));
  const offerJob = latestOffer ? jobs.find((job) => job.id === latestOffer.jobId) : null;
  const currentOffer = latestOffer ? { company: offerJob?.company || "Current company", package: packageNumber(offerJob?.salary || latestOffer.package), salary: offerJob?.salary || latestOffer.package || "Package not recorded", status: latestOffer.status } : null;
  const outcome = lastResult || evaluatePolicy(policy, currentOffer, Number(packageValue));
  const updatePolicy = (key, value) => setState((current) => ({ ...current, policy: { ...current.policy, [key]: value } }));
  const savePolicy = () => {
    if (!policy.name.trim()) { flash("Give this policy a name before activating it."); return; }
    if (policy.minPackage !== "" && policy.maxPackage !== "" && Number(policy.minPackage) > Number(policy.maxPackage)) { flash("The minimum package cannot be above the maximum package."); return; }
    updatePolicy("active", true);
    flash("Placement policy saved for this local demo workspace.");
  };
  const recordDecision = () => {
    const result = evaluatePolicy(policy, currentOffer, Number(packageValue));
    const row = { id: crypto.randomUUID(), student: student.fullName || "Student", collegeId: student.collegeId || "", drive: opportunity || "New placement drive", currentOffer: currentOffer ? `${currentOffer.company} · ${currentOffer.salary}` : "No current offer", newPackage: money(packageValue), offerCategory: policy.category || "Not configured", rule: result.rule, decision: result.decision, reason: result.reason, createdAt: new Date().toISOString(), source: "Configured local demo policy", overridden: false };
    setLastResult(result);
    setState((current) => ({ ...current, decisions: [row, ...current.decisions].slice(0, 100) }));
    flash(`Policy result: ${result.decision}.`);
  };
  const override = (decision) => {
    if (!overrideReason.trim()) { flash("Enter a reason before overriding a policy decision."); return; }
    setState((current) => ({ ...current, decisions: current.decisions.map((item, index) => index === 0 ? { ...item, decision: `OVERRIDDEN · ${decision}`, overridden: true, overrideReason: overrideReason.trim(), overriddenBy: role, overrideAt: new Date().toISOString() } : item) }));
    setLastResult({ ...outcome, decision: `OVERRIDDEN · ${decision}` });
    setOverrideReason("");
    flash(`Decision overridden by ${role}; reason added to the audit log.`);
  };
  return <>
    <div className="feature-page-heading"><div><p className="eyebrow">TRANSPARENT CAMPUS RULES</p><h1>Smart Placement Policy</h1><p>Show students how configured offer and drive rules affect their eligibility.</p></div><DemoBadge/></div>
    <div className="policy-layout">
      <section className="workflow-card policy-decision-card"><div className="policy-section-heading"><span className="policy-symbol"><Scale size={19}/></span><div><h2>Offer decision check</h2><p>Decision uses the rules configured in this browser demo.</p></div></div>
      <div className="policy-offer-comparison"><article><small>CURRENT OFFER</small>{currentOffer ? <><b>{currentOffer.company}</b><strong>{currentOffer.salary}</strong><span>{currentOffer.status}</span></> : <><b>No current offer</b><strong>—</strong><span>Offer details appear after a selection.</span></>}</article><ArrowRight size={19}/><article><small>NEW OPPORTUNITY</small><label>Drive / company<select value={opportunity} onChange={(event) => { const value = event.target.value; setOpportunity(value); const selected = jobs.find((job) => `${job.company} · ${job.title}` === value); if (selected?.salary) setPackageValue(String(packageNumber(selected.salary))); }}><option value="">Select a published role</option>{jobs.map((job) => <option key={job.id} value={`${job.company} · ${job.title}`}>{job.company} · {job.title}</option>)}</select></label><label>Package (LPA)<input type="number" min="0" step="0.1" value={packageValue} onChange={(event) => setPackageValue(event.target.value)} placeholder="Enter offer package"/></label><span>Configured category: {policy.category || "Not configured"}</span></article></div>
        <div className={`policy-result ${outcome.eligible === true ? "good" : outcome.eligible === false ? "bad" : "pending"}`}><div><small>POLICY RESULT</small><b>{outcome.decision}</b><p>{outcome.reason}</p></div><span><Scale size={22}/></span></div>
        <div className="policy-rule-applied"><b>Rule applied:</b> {outcome.rule} <span>· Policy: {policy.active ? policy.name : "Not configured"}</span></div>
        <button className="primary-button" onClick={recordDecision}><CheckCircle2 size={15}/> Check and record decision</button>
      </section>
      {canManage && <section className="workflow-card policy-config-card"><div className="policy-section-heading"><span className="policy-symbol"><ShieldCheck size={19}/></span><div><h2>TPO policy configuration</h2><p>Thresholds are blank until your institution configures them.</p></div></div>
        <div className="workflow-grid"><label className="workflow-field">Policy name<input value={policy.name} onChange={(event) => updatePolicy("name", event.target.value)} placeholder="e.g. 2026 campus placement policy"/></label><label className="workflow-field">Offer category<input value={policy.category} onChange={(event) => updatePolicy("category", event.target.value)} placeholder="Set your institution's category"/></label><label className="workflow-field">Minimum package (LPA)<input type="number" min="0" step="0.1" value={policy.minPackage} onChange={(event) => updatePolicy("minPackage", event.target.value)} placeholder="No minimum configured"/></label><label className="workflow-field">Maximum package (LPA)<input type="number" min="0" step="0.1" value={policy.maxPackage} onChange={(event) => updatePolicy("maxPackage", event.target.value)} placeholder="No maximum configured"/></label><label className="workflow-field">Minimum upgrade over current offer (%)<input type="number" min="0" step="1" value={policy.minimumUpgradePercent} onChange={(event) => updatePolicy("minimumUpgradePercent", event.target.value)} placeholder="No upgrade threshold"/></label></div>
        <label className="policy-checkbox"><input type="checkbox" checked={policy.allowAnotherDrive} onChange={(event) => updatePolicy("allowAnotherDrive", event.target.checked)}/> Allow students to apply to another drive under this policy</label>
        <label className="policy-checkbox"><input type="checkbox" checked={policy.blockAfterOffer} onChange={(event) => updatePolicy("blockAfterOffer", event.target.checked)}/> An existing offer blocks another drive unless the upgrade rule is met</label>
        <label className="policy-checkbox"><input type="checkbox" checked={policy.active} disabled={!policy.name.trim()} onChange={(event) => updatePolicy("active", event.target.checked)}/> Policy active</label>
        <div className="inline-actions"><button className="primary-button" onClick={savePolicy}><Check size={15}/> Save policy</button><button className="soft-button" onClick={() => updatePolicy("active", false)}>Deactivate</button></div>
      </section>}
      {!canManage && <section className="workflow-card policy-student-note"><LockKeyholeIcon/><div><h2>TPO-managed policy</h2><p>Students and recruiters can view policy results. Only TPOs and admins can edit rules or override decisions.</p></div></section>}
    </div>
    {canManage && state.decisions[0] && <section className="workflow-card policy-override-card"><div><h2>Policy override</h2><p>Overrides require a reason and are recorded with the actor and timestamp.</p></div><textarea value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Reason for override" rows="2"/><div className="inline-actions"><button className="soft-button" onClick={() => override("ELIGIBLE")}>Override to eligible</button><button className="soft-button danger-soft" onClick={() => override("NOT ELIGIBLE")}>Override to not eligible</button></div></section>}
    <section className="workflow-card policy-audit-card"><div className="policy-section-heading"><span className="policy-symbol"><FileCheck2 size={19}/></span><div><h2>Policy audit log</h2><p>Every recorded decision stays in this browser's local workspace.</p></div></div>{state.decisions.length ? <div className="policy-audit-list">{state.decisions.map((decision) => <article key={decision.id}><div><b>{decision.student} · {decision.collegeId || "College ID not set"}</b><small>{decision.drive} · {new Date(decision.createdAt).toLocaleString()}</small><small>Current: {decision.currentOffer} · New: {decision.newPackage}</small><small>Offer category: {decision.offerCategory || "Not configured"}</small><small>Rule: {decision.rule} · Source: {decision.source}</small>{decision.overrideReason && <small>Override by {decision.overriddenBy}: {decision.overrideReason} · {new Date(decision.overrideAt).toLocaleString()}</small>}</div><span className={`status-pill ${decision.decision.includes("ELIGIBLE") && !decision.decision.includes("NOT") ? "good" : decision.decision.includes("NOT") ? "bad" : ""}`}>{decision.decision}</span></article>)}</div> : <div className="empty-policy-audit"><FileCheck2 size={21}/><span>No policy decisions recorded yet. Select a new package and run a check.</span></div>}</section>
  </>;
}

function SparklesIcon() { return <BadgeCheck size={14}/>; }
function LockKeyholeIcon() { return <span className="policy-lock-icon"><ShieldCheck size={20}/></span>; }

export function PlacementFeatureView(props) {
  const { page, role, student, featureState, setFeatureState, jobs, offers, flash } = props;
  if (["Placement Passport", "Passport Verification", "Scan Passport"].includes(page)) return <PassportPage role={role} student={student} state={featureState} setState={setFeatureState} flash={flash}/>;
  if (["Live Drive War-Room", "My Drives", "Interview Queue", "Active Drive"].includes(page)) return <WarRoomPage role={role} student={student} state={featureState} setState={setFeatureState} flash={flash} jobs={jobs}/>;
  return <PolicyPage role={role} student={student} state={featureState} setState={setFeatureState} jobs={jobs} offers={offers} flash={flash}/>;
}

export { PublicPassportVerification };
