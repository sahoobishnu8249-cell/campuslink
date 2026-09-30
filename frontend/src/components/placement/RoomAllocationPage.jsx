import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, Building2, CalendarDays, Check, Clock3, MapPin, Users } from "lucide-react";
import {
  allocateRoom,
  getRegisteredStudents,
  loadRoomAllocationState,
  notificationForStudent,
  roomConflictMessage,
  roomConflicts,
  saveRoomAllocationState,
  suggestRoom,
} from "../../services/roomAllocationService";
import "../../styles/room-allocation.css";

const today = new Date().toISOString().slice(0, 10);
const makeId = () => crypto.randomUUID();
const formatDate = (date) => date ? new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Date not set";

export default function RoomAllocationPage({ role, jobs = [], applications = [], student = {}, onNavigate, flash }) {
  const [state, setState] = useState(loadRoomAllocationState);
  const [schedule, setSchedule] = useState({ jobId: "", round: "Online Assessment", date: today, startTime: "10:00", endTime: "12:00", reportingTime: "09:30", requiredCapacity: "" });
  const [classForm, setClassForm] = useState({ title: "", kind: "Class", date: today, startTime: "09:00", endTime: "11:00", roomId: "" });
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "" });
  const isAdmin = role === "Admin";
  const canManage = ["TPO", "Admin"].includes(role);
  const signedInEmail = String(student.email || "").toLowerCase();

  useEffect(() => saveRoomAllocationState(state), [state]);
  useEffect(() => {
    const sync = (event) => {
      if (event.key === "campuslink:room-allocation-workspace:v1") setState(loadRoomAllocationState());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const selectedJob = jobs.find((job) => job.id === schedule.jobId);
  const registeredStudents = useMemo(() => getRegisteredStudents(schedule.jobId, applications), [schedule.jobId, applications]);
  const notifications = useMemo(() => state.notifications.filter((item) => item.email?.toLowerCase() === signedInEmail), [state.notifications, signedInEmail]);
  const updateActivity = (activityId, patch) => setState((current) => ({
    ...current,
    activities: current.activities.map((activity) => {
      if (activity.id !== activityId) return activity;
      const next = { ...activity, ...patch };
      const conflicts = roomConflicts(current, { ...next, activityId });
      const room = current.rooms.find((item) => item.id === next.roomId);
      if (conflicts.length) {
        next.status = "NEEDS_RESOLUTION";
        next.conflictStatus = "CONFLICT";
        next.conflictMessages = conflicts.map((conflict) => roomConflictMessage(next, room, conflict));
      } else {
        next.conflictStatus = "CLEAR";
        next.conflictMessages = [];
        next.status = activity.status === "CONFIRMED" ? "CONFIRMED" : "PENDING_CONFIRMATION";
      }
      return next;
    }),
  }));

  const createPlacement = (event) => {
    event.preventDefault();
    if (!selectedJob) {
      flash("Choose a published company role before arranging its visit.");
      return;
    }
    if (!schedule.date || !schedule.startTime || !schedule.endTime || schedule.endTime <= schedule.startTime) {
      flash("Enter a valid placement date and time range.");
      return;
    }
    const activity = {
      id: makeId(), jobId: selectedJob.id, company: selectedJob.company, title: selectedJob.title,
      round: schedule.round, date: schedule.date, startTime: schedule.startTime, endTime: schedule.endTime,
      reportingTime: schedule.reportingTime, instructions: "Bring your college ID and updated resume. Follow campus placement cell instructions.",
      requiredCapacity: Math.max(1, Number(schedule.requiredCapacity) || registeredStudents.length || 1),
      registeredCount: registeredStudents.length, createdAt: new Date().toISOString(),
    };
    const allocated = allocateRoom(state, activity);
    setState((current) => ({ ...current, activities: [allocated, ...current.activities] }));
    flash(allocated.conflictStatus === "CONFLICT" ? "A room conflict was detected. Resolve it before confirming this activity." : `Suggested ${allocated.roomName}. Confirm the room to notify registered students.`);
  };

  const addAcademicEvent = (event) => {
    event.preventDefault();
    if (!classForm.title.trim() || !classForm.roomId || !classForm.date || !classForm.startTime || classForm.endTime <= classForm.startTime) {
      flash("Complete the academic room schedule with a valid time range.");
      return;
    }
    const item = { ...classForm, id: makeId(), title: classForm.title.trim(), createdAt: new Date().toISOString() };
    setState((current) => {
      const next = { ...current, academicEvents: [item, ...current.academicEvents] };
      next.activities = next.activities.map((activity) => {
        const conflicts = roomConflicts(next, { ...activity, activityId: activity.id });
        const room = next.rooms.find((candidate) => candidate.id === activity.roomId);
        if (!conflicts.length) return activity;
        return { ...activity, status: "NEEDS_RESOLUTION", conflictStatus: "CONFLICT", conflictMessages: conflicts.map((conflict) => roomConflictMessage(activity, room, conflict)) };
      });
      return next;
    });
    setClassForm((current) => ({ ...current, title: "" }));
    flash("Academic schedule saved. Any overlapping placement activity is flagged for resolution.");
  };

  const addRoom = (event) => {
    event.preventDefault();
    if (!newRoom.name.trim() || Number(newRoom.capacity) < 1) return;
    setState((current) => ({ ...current, rooms: [...current.rooms, { id: makeId(), name: newRoom.name.trim(), capacity: Number(newRoom.capacity) }] }));
    setNewRoom({ name: "", capacity: "" });
    flash("Room added to the allocation inventory.");
  };

  const confirmActivity = (activity) => {
    const room = state.rooms.find((item) => item.id === activity.roomId);
    const conflicts = roomConflicts(state, { ...activity, activityId: activity.id });
    if (!room || conflicts.length || Number(room.capacity) < Number(activity.requiredCapacity)) {
      updateActivity(activity.id, {});
      flash("This room cannot be confirmed until every capacity or schedule conflict is resolved.");
      return;
    }
    const recipients = getRegisteredStudents(activity.jobId, applications);
    const isUpdate = state.notifications.some((item) => item.activityId === activity.id);
    const newNotifications = recipients.map((email) => notificationForStudent(activity, room, email, isUpdate));
    setState((current) => ({
      ...current,
      activities: current.activities.map((item) => item.id === activity.id ? { ...item, status: "CONFIRMED", conflictStatus: "CLEAR", conflictMessages: [], registeredCount: recipients.length, notificationStatus: recipients.length ? `Sent to ${recipients.length} registered student${recipients.length === 1 ? "" : "s"}` : "No registered students to notify", confirmedAt: new Date().toISOString() } : item),
      notifications: [...newNotifications, ...current.notifications],
    }));
    flash(recipients.length ? `Room confirmed. In-app notification sent to ${recipients.length} registered student${recipients.length === 1 ? "" : "s"}.` : "Room confirmed. No students have registered for this company yet.");
  };

  const reallocate = (activity) => {
    const next = allocateRoom(state, activity);
    updateActivity(activity.id, { roomId: next.roomId, roomName: next.roomName, roomCapacity: next.roomCapacity, status: next.status, conflictStatus: next.conflictStatus, conflictMessages: next.conflictMessages });
  };

  const updateAcademicEvent = (eventId, patch) => setState((current) => {
    const next = { ...current, academicEvents: current.academicEvents.map((item) => item.id === eventId ? { ...item, ...patch } : item) };
    next.activities = next.activities.map((activity) => {
      const conflicts = roomConflicts(next, { ...activity, activityId: activity.id });
      const room = next.rooms.find((candidate) => candidate.id === activity.roomId);
      if (!conflicts.length) return { ...activity, conflictStatus: "CLEAR", conflictMessages: [], status: activity.status === "CONFIRMED" ? "CONFIRMED" : "PENDING_CONFIRMATION" };
      return { ...activity, status: "NEEDS_RESOLUTION", conflictStatus: "CONFLICT", conflictMessages: conflicts.map((conflict) => roomConflictMessage(activity, room, conflict)) };
    });
    return next;
  });

  if (!canManage) {
    return <div className="room-page">
      <div className="section-intro"><p className="eyebrow">PLACEMENT DAY</p><h1>Room notifications</h1><p>Confirmed reporting details for companies you have registered with.</p></div>
      {notifications.length ? <div className="room-notification-list">{notifications.map((item) => <article className="room-notification-card" key={item.id}><div className="room-notification-icon"><Bell size={20}/></div><div className="room-notification-content"><span className="room-notification-tag">{item.updated ? "UPDATED ROOM ALLOTMENT" : "ROOM ALLOTMENT CONFIRMED"}</span><h2>{item.company}</h2><p>{item.round}</p><div className="room-notification-details"><span><CalendarDays size={15}/>{formatDate(item.date)}</span><span><Clock3 size={15}/>{item.time} · Report by {item.reportingTime}</span><span><MapPin size={15}/>{item.room}</span></div><p className="room-instructions"><b>Important instructions:</b> {item.instructions}</p></div></article>)}</div> : <section className="empty-state"><Bell size={27}/><h2>No room notifications yet</h2><p>After you apply to a company and the TPO confirms its room, the reporting details will appear here.</p><button className="primary-button" onClick={() => onNavigate("Find jobs")}>Browse jobs</button></section>}
    </div>;
  }

  const unresolved = state.activities.filter((activity) => activity.conflictStatus === "CONFLICT");
  const notifyCount = state.notifications.length;
  return <div className="room-page">
    <div className="section-intro"><p className="eyebrow">TPO / ADMIN OPERATIONS</p><h1>Room allocation dashboard</h1><p>Schedule campus placement rounds, detect academic conflicts, and send confirmed details to registered students.</p></div>
    <div className="room-metrics"><article><Building2/><span>VISITING COMPANIES</span><b>{state.activities.length}</b></article><article><Users/><span>REGISTERED CANDIDATES</span><b>{state.activities.reduce((total, activity) => total + getRegisteredStudents(activity.jobId, applications).length, 0)}</b></article><article><AlertTriangle/><span>OPEN CONFLICTS</span><b>{unresolved.length}</b></article><article><Bell/><span>ROOM NOTIFICATIONS</span><b>{notifyCount}</b></article></div>

    <section className="workflow-card room-workflow-card"><div className="room-section-heading"><div><p className="eyebrow">STEP 1 · COMPANY VISIT</p><h2>Schedule a placement activity</h2><p>Candidate totals come from applications for the selected company role.</p></div></div>
      {!jobs.length ? <div className="room-no-jobs"><p>Publish a company role before scheduling its placement visit.</p><button className="primary-button" onClick={() => onNavigate("Companies & jobs")}>Go to company roles</button></div> : <form className="room-form-grid" onSubmit={createPlacement}>
        <label className="workflow-field">Company role<select required value={schedule.jobId} onChange={(event) => setSchedule({ ...schedule, jobId: event.target.value })}><option value="">Choose a published role</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.company} · {job.title}</option>)}</select></label>
        <label className="workflow-field">Placement round<select value={schedule.round} onChange={(event) => setSchedule({ ...schedule, round: event.target.value })}>{["Online Assessment", "Aptitude Test", "Technical Round", "Group Discussion", "HR Interview", "Final Interview", "Other"].map((round) => <option key={round}>{round}</option>)}</select></label>
        <label className="workflow-field">Placement date<input required type="date" min={today} value={schedule.date} onChange={(event) => setSchedule({ ...schedule, date: event.target.value })}/></label>
        <label className="workflow-field">Registered students<input readOnly value={registeredStudents.length} aria-describedby="room-registered-help"/><small id="room-registered-help">Only applicants for this role will receive the room notice.</small></label>
        <label className="workflow-field">Start time<input required type="time" value={schedule.startTime} onChange={(event) => setSchedule({ ...schedule, startTime: event.target.value })}/></label>
        <label className="workflow-field">End time<input required type="time" value={schedule.endTime} onChange={(event) => setSchedule({ ...schedule, endTime: event.target.value })}/></label>
        <label className="workflow-field">Reporting time<input required type="time" value={schedule.reportingTime} onChange={(event) => setSchedule({ ...schedule, reportingTime: event.target.value })}/></label>
        <label className="workflow-field">Minimum room capacity<input type="number" min="1" value={schedule.requiredCapacity} placeholder={String(Math.max(1, registeredStudents.length))} onChange={(event) => setSchedule({ ...schedule, requiredCapacity: event.target.value })}/></label>
        <div className="room-form-footer"><span>Suggested room is checked against room capacity, academic bookings, and other placement activities.</span><button className="primary-button" type="submit">Check availability & suggest room</button></div>
      </form>}
    </section>

    {unresolved.length > 0 && <section className="room-alerts"><div className="room-section-heading"><div><p className="eyebrow">ADMINISTRATION ALERTS</p><h2>Conflicts need resolution</h2></div><span className="room-conflict-count">{unresolved.length} open</span></div>{unresolved.map((activity) => <article className="room-alert-card" key={activity.id}><AlertTriangle/><div><b>{activity.company} · {activity.round}</b><p>{activity.conflictMessages?.[0] || "Room schedule conflict detected. Select a different room or time."}</p></div></article>)}</section>}

    <section className="workflow-card room-workflow-card"><div className="room-section-heading"><div><p className="eyebrow">STEP 2 · ACADEMIC AVAILABILITY</p><h2>Class, exam & workshop schedule</h2><p>Save existing room bookings before confirming placements.</p></div></div>
      <form className="room-form-grid room-academic-form" onSubmit={addAcademicEvent}><label className="workflow-field">Activity name<input required value={classForm.title} onChange={(event) => setClassForm({ ...classForm, title: event.target.value })} placeholder="Database Systems · Semester 5"/></label><label className="workflow-field">Schedule type<select value={classForm.kind} onChange={(event) => setClassForm({ ...classForm, kind: event.target.value })}>{["Class", "Examination", "Workshop", "Placement activity", "Other"].map((kind) => <option key={kind}>{kind}</option>)}</select></label><label className="workflow-field">Date<input required type="date" value={classForm.date} onChange={(event) => setClassForm({ ...classForm, date: event.target.value })}/></label><label className="workflow-field">Room<select required value={classForm.roomId} onChange={(event) => setClassForm({ ...classForm, roomId: event.target.value })}><option value="">Choose a room</option>{state.rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label><label className="workflow-field">Starts<input required type="time" value={classForm.startTime} onChange={(event) => setClassForm({ ...classForm, startTime: event.target.value })}/></label><label className="workflow-field">Ends<input required type="time" value={classForm.endTime} onChange={(event) => setClassForm({ ...classForm, endTime: event.target.value })}/></label><div className="room-form-footer"><span>Overlaps automatically raise an administration alert.</span><button className="soft-button" type="submit">Add academic booking</button></div></form>
      <div className="room-bookings-list">{state.academicEvents.map((item) => { const room = state.rooms.find((candidate) => candidate.id === item.roomId); return <article key={item.id}><div><b>{item.title}</b><small>{item.kind} · {formatDate(item.date)} · {item.startTime}–{item.endTime}</small></div><label>Classroom<select aria-label={`Change classroom for ${item.title}`} value={item.roomId} onChange={(event) => updateAcademicEvent(item.id, { roomId: event.target.value })}>{state.rooms.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label><label>Date<input aria-label={`Reschedule date for ${item.title}`} type="date" value={item.date} onChange={(event) => updateAcademicEvent(item.id, { date: event.target.value })}/></label><label>Starts<input aria-label={`Reschedule start time for ${item.title}`} type="time" value={item.startTime} onChange={(event) => updateAcademicEvent(item.id, { startTime: event.target.value })}/></label><label>Ends<input aria-label={`Reschedule end time for ${item.title}`} type="time" value={item.endTime} onChange={(event) => updateAcademicEvent(item.id, { endTime: event.target.value })}/></label>{room && <span className="room-booking-location">{room.name}</span>}</article>; })}{!state.academicEvents.length && <p className="room-empty-note">No classes, examinations, or workshops recorded yet.</p>}</div>
    </section>

    <section className="workflow-card room-workflow-card"><div className="room-section-heading"><div><p className="eyebrow">ROOM INVENTORY</p><h2>Available college rooms</h2></div></div><div className="room-inventory-grid">{state.rooms.map((room) => <article key={room.id}><MapPin/><b>{room.name}</b><span>Capacity · {room.capacity}</span></article>)}</div><form className="room-add-form" onSubmit={addRoom}><label className="workflow-field">Room / hall<input required value={newRoom.name} onChange={(event) => setNewRoom({ ...newRoom, name: event.target.value })} placeholder="e.g. Seminar Hall 3"/></label><label className="workflow-field">Room capacity<input required type="number" min="1" value={newRoom.capacity} onChange={(event) => setNewRoom({ ...newRoom, capacity: event.target.value })} placeholder="Seats"/></label><button className="soft-button" type="submit">Add room</button></form></section>

    <section className="workflow-card room-workflow-card"><div className="room-section-heading"><div><p className="eyebrow">STEP 3 · ALLOCATION & NOTIFICATION</p><h2>Placement room allocations</h2><p>Final confirmation sends or updates in-app notices for registered applicants only.</p></div></div>{state.activities.length ? <div className="room-allocation-list">{state.activities.map((activity) => { const room = state.rooms.find((candidate) => candidate.id === activity.roomId); const recipients = getRegisteredStudents(activity.jobId, applications); const needsResolution = activity.conflictStatus === "CONFLICT"; return <article className={`room-allocation-card ${needsResolution ? "has-conflict" : ""}`} key={activity.id}>
        <div className="room-allocation-heading"><div><span className="room-status-tag">{activity.status.replaceAll("_", " ")}</span><h3>{activity.company}</h3><p>{activity.title} · {activity.round}</p></div><strong>{formatDate(activity.date)}</strong></div>
        <div className="room-allocation-facts"><span><Clock3/>{activity.startTime}–{activity.endTime} · Report {activity.reportingTime}</span><span><Users/>{recipients.length} registered</span><span><Building2/>{room?.name || "No room assigned"} · Capacity {room?.capacity || 0}</span><span><Bell/>{activity.notificationStatus || "Not sent"}</span><span className={needsResolution ? "text-conflict" : "text-clear"}><AlertTriangle/>{needsResolution ? "Conflict detected" : "No class conflict"}</span></div>
        {needsResolution && <div className="room-alert-inline">{activity.conflictMessages?.map((message, index) => <p key={index}><AlertTriangle size={15}/>{message}</p>)}</div>}
        {activity.status !== "CONFIRMED" && <div className="room-resolution-controls"><label className="workflow-field">Change placement room<select value={activity.roomId} onChange={(event) => { const room = state.rooms.find((candidate) => candidate.id === event.target.value); updateActivity(activity.id, { roomId: room?.id || "", roomName: room?.name || "Not allocated", roomCapacity: Number(room?.capacity || 0) }); }}><option value="">No room assigned</option>{state.rooms.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.capacity} seats</option>)}</select></label><label className="workflow-field">Reschedule date<input type="date" value={activity.date} onChange={(event) => updateActivity(activity.id, { date: event.target.value })}/></label><label className="workflow-field">New start time<input type="time" value={activity.startTime} onChange={(event) => updateActivity(activity.id, { startTime: event.target.value })}/></label><label className="workflow-field">New end time<input type="time" value={activity.endTime} onChange={(event) => updateActivity(activity.id, { endTime: event.target.value })}/></label><button className="soft-button" type="button" onClick={() => reallocate(activity)}>Find another room</button><button className="primary-button" type="button" disabled={needsResolution || !room || Number(room.capacity) < Number(activity.requiredCapacity)} onClick={() => confirmActivity(activity)}>{needsResolution ? "Resolve conflicts first" : "Confirm & notify students"}</button></div>}
        {activity.status === "CONFIRMED" && <div className="room-confirmed-footer"><Check size={17}/><span>Final confirmation complete · {activity.notificationStatus}</span><button className="soft-button" onClick={() => confirmActivity(activity)}>Send updated room notice</button></div>}
      </article>; })}</div> : <div className="room-empty-note">No placement rooms allocated yet. Schedule a company visit above.</div>}</section>
  </div>;
}
