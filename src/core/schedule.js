// Resort publish times are UNKNOWN: set per mountain once verified.
export const DEFAULT_SCHEDULE = Object.freeze({ windowStartHour: 6, windowEndHour: 10, fastPollMinutes: 15, slowPollMinutes: 180 });
const STEP = 5 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

function parts(date, tz) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const o = Object.fromEntries(f.formatToParts(date).map((p) => [p.type, p.value]));
  return { ymd: `${o.year}-${o.month}-${o.day}`, hour: Number(o.hour) % 24, minute: Number(o.minute) };
}

export function haveTodaysReport(lastPublishedAt, now, tz) {
  if (!lastPublishedAt) return false;
  const t = new Date(lastPublishedAt);
  if (Number.isNaN(t.getTime())) return false;
  return parts(t, tz).ymd === parts(new Date(now), tz).ymd;
}

export function nextCheckAt({ now, lastPublishedAt, timeZone, cfg = DEFAULT_SCHEDULE }) {
  const n = new Date(now).getTime();
  const p = parts(new Date(n), timeZone);
  const have = haveTodaysReport(lastPublishedAt, n, timeZone);
  const stepTo = (pred) => {
    let t = Math.ceil((n + 1) / STEP) * STEP;
    for (let i = 0; i < 24 * 12 + 2; i++, t += STEP) if (pred(parts(new Date(t), timeZone))) return t;
    return n + DAY;
  };
  const windowStart = (q) => q.hour === cfg.windowStartHour && q.minute === 0;
  let next;
  if (have || p.hour < cfg.windowStartHour) next = stepTo(windowStart);
  else if (p.hour < cfg.windowEndHour) next = n + cfg.fastPollMinutes * 60000;
  else next = n + cfg.slowPollMinutes * 60000;
  return new Date(Math.min(next, n + DAY));
}
