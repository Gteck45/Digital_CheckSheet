function parseHHMM(timeStr) {
  // timeStr can be "HH:MM:SS" or "HH:MM"
  const [hh, mm] = String(timeStr).split(":");
  return (Number(hh) * 60) + Number(mm);
}

function buildWindow(now, slot) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const startMin = parseHHMM(slot.start_time);
  const endMinRaw = parseHHMM(slot.end_time);

  // If end <= start => crosses midnight (e.g. 22:00 -> 00:00)
  const crossesMidnight = endMinRaw <= startMin;
  const endMin = crossesMidnight ? endMinRaw + 1440 : endMinRaw;

  // Candidate start is "today at start"
  let start = new Date(today);
  start.setMinutes(startMin);

  let end = new Date(today);
  end.setMinutes(endMin);

  // If crosses midnight and we are after midnight (time < end_time),
  // then the active window started yesterday.
  if (crossesMidnight) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const endClockMin = endMinRaw; // e.g. 00:00 => 0, 02:00 => 120
    if (nowMin <= endClockMin) {
      // shift start to yesterday
      start = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      end = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  return { start, end };
}

function getSlotStatus(slot) {
  const now = new Date();
  const { start, end } = buildWindow(now, slot);

  const graceMin = Number(slot.grace_period || 0);
  const graceEnd = new Date(end.getTime() + graceMin * 60000);

  if (now < start) return "UPCOMING";
  if (now >= start && now <= end) return "OPEN";
  if (now > end && now <= graceEnd) return "GRACE";
  if (now > graceEnd) return "LOCKED";
  return "UNKNOWN";
}

module.exports = { getSlotStatus, parseHHMM, buildWindow };