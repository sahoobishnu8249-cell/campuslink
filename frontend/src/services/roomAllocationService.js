const STORAGE_KEY = "campuslink:room-allocation-workspace:v1";

export const initialRoomAllocationState = {
  rooms: [
    { id: "hall-1", name: "Seminar Hall 1", capacity: 120 },
    { id: "hall-2", name: "Seminar Hall 2", capacity: 80 },
    { id: "auditorium", name: "Main Auditorium", capacity: 300 },
    { id: "room-101", name: "Room 101", capacity: 60 },
  ],
  academicEvents: [],
  activities: [],
  notifications: [],
};

export function loadRoomAllocationState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored) return initialRoomAllocationState;
    return {
      ...initialRoomAllocationState,
      ...stored,
      rooms: stored.rooms || initialRoomAllocationState.rooms,
      academicEvents: stored.academicEvents || [],
      activities: stored.activities || [],
      notifications: stored.notifications || [],
    };
  } catch {
    return initialRoomAllocationState;
  }
}

export function saveRoomAllocationState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The room workflow remains usable in memory if browser storage is blocked.
  }
}

export function getRegisteredStudents(jobId, applications = []) {
  if (!jobId) return [];
  const unique = new Map();
  applications
    .filter((application) => application.jobId === jobId && application.email)
    .forEach((application) => unique.set(application.email.toLowerCase(), application.email));
  return [...unique.values()];
}

export function slotsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function roomConflicts(state, { roomId, date, startTime, endTime, activityId, requiredCapacity }) {
  if (!roomId) return [{ type: "room", label: "No placement room is assigned", kind: "room" }];
  if (!date || !startTime || !endTime) return [];
  const conflicts = [];
  const room = state.rooms.find((candidate) => candidate.id === roomId);
  const activity = state.activities.find((candidate) => candidate.id === activityId);
  if (!room) conflicts.push({ type: "room", label: "The selected room is no longer in the room inventory", kind: "room" });
  else if (Number(room.capacity) < Number(requiredCapacity ?? activity?.requiredCapacity ?? 0)) conflicts.push({ type: "capacity", label: "the selected room is smaller than the required capacity", kind: "capacity" });
  state.academicEvents
    .filter((event) => event.roomId === roomId && event.date === date && slotsOverlap(startTime, endTime, event.startTime, event.endTime))
    .forEach((event) => conflicts.push({ type: "academic", id: event.id, label: event.title, kind: event.kind }));
  state.activities
    .filter((activity) => activity.id !== activityId && activity.roomId === roomId && activity.date === date && activity.status !== "CANCELLED" && slotsOverlap(startTime, endTime, activity.startTime, activity.endTime))
    .forEach((activity) => conflicts.push({ type: "placement", id: activity.id, label: `${activity.company} placement`, kind: "placement" }));
  return conflicts;
}

export function suggestRoom(state, details) {
  const suitable = state.rooms
    .filter((room) => Number(room.capacity) >= Number(details.requiredCapacity || details.registeredCount || 1))
    .sort((a, b) => Number(a.capacity) - Number(b.capacity));
  const checked = suitable.map((room) => ({ room, conflicts: roomConflicts(state, { ...details, roomId: room.id }) }));
  return checked.find((candidate) => candidate.conflicts.length === 0)
    || checked[0]
    || { room: null, conflicts: [{ type: "capacity", label: "No room has enough seats for this activity", kind: "capacity" }] };
}

export function roomConflictMessage(activity, room, conflict) {
  const roomName = room?.name || "an available room";
  const match = String(activity.startTime || "").match(/^(\d{2}):(\d{2})$/);
  const when = match ? `${Number(match[1]) % 12 || 12}:${match[2]} ${Number(match[1]) >= 12 ? "PM" : "AM"}` : "the scheduled time";
  const other = conflict.label || "another activity";
  if (conflict.type === "academic") {
    return `Room Conflict Detected: ${roomName} is allocated for ${activity.company} placement at ${when}, but ${conflict.kind.toLowerCase()} “${other}” is scheduled in the same room. Please change the classroom or reschedule the placement activity.`;
  }
  if (conflict.type === "capacity") return `Room Conflict Detected: ${roomName} is not available because ${other.toLowerCase()}. Please add a suitable room or adjust the student capacity.`;
  if (conflict.type === "room") return `Room Conflict Detected: ${activity.company} does not have a valid placement room. ${other}. Please choose an available room before confirming the placement.`;
  return `Room Conflict Detected: ${roomName} is allocated for ${activity.company} placement at ${when}, but ${other} is booked for the same time. Please change the room or reschedule the activity.`;
}

export function notificationForStudent(activity, room, email, updated = false) {
  return {
    id: crypto.randomUUID(),
    email,
    activityId: activity.id,
    company: activity.company,
    round: activity.round,
    date: activity.date,
    time: activity.startTime,
    room: room?.name || activity.roomName || "Room to be confirmed",
    reportingTime: activity.reportingTime,
    instructions: activity.instructions,
    updated,
    sentAt: new Date().toISOString(),
  };
}

export function allocateRoom(state, activity) {
  const suggestion = suggestRoom(state, activity);
  const room = suggestion.room;
  const conflicts = suggestion.conflicts;
  return {
    ...activity,
    roomId: room?.id || "",
    roomName: room?.name || "Not allocated",
    roomCapacity: room ? Number(room.capacity) : 0,
    status: conflicts.length ? "NEEDS_RESOLUTION" : "PENDING_CONFIRMATION",
    conflictStatus: conflicts.length ? "CONFLICT" : "CLEAR",
    conflictMessages: conflicts.length ? conflicts.map((conflict) => roomConflictMessage(activity, room, conflict)) : [],
    notificationStatus: "Not sent",
  };
}
