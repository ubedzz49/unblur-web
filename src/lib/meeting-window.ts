// A booking's meeting link stays valid through its scheduled slot plus a grace buffer, mirroring
// how a normal calendar meeting shows as "ended" once its time has passed -- not tied to whether
// anyone actually joined.
const EXPIRY_BUFFER_MINS = 15;

export function isMeetingWindowOver(slotAt: string, durationMins: number, now: number = Date.now()): boolean {
  const endTime = new Date(slotAt).getTime() + durationMins * 60_000;
  return now > endTime + EXPIRY_BUFFER_MINS * 60_000;
}
