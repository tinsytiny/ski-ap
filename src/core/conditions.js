export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const str = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export function normaliseReport(raw, mountainId) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('report must be an object');
  let publishedAt = null;
  if (raw.publishedAt !== undefined && raw.publishedAt !== null) {
    const d = new Date(raw.publishedAt);
    if (Number.isNaN(d.getTime())) throw new RangeError('invalid publishedAt');
    publishedAt = d.toISOString();
  }
  return {
    mountainId, publishedAt,
    baseDepthCm: num(raw.baseDepthCm), newSnowCm: num(raw.newSnowCm),
    temperatureC: num(raw.temperatureC), windKph: num(raw.windKph),
    weather: str(raw.weather, 120),
    liftsOpen: num(raw.liftsOpen), liftsTotal: num(raw.liftsTotal),
    runsOpen: num(raw.runsOpen), runsTotal: num(raw.runsTotal),
    accessRoad: str(raw.accessRoad, 160), sourceName: str(raw.sourceName, 80),
  };
}

export function staleness(report, now = Date.now()) {
  const t = report?.publishedAt ? new Date(report.publishedAt).getTime() : NaN;
  if (Number.isNaN(t)) return { stale: true, ageMs: null };
  const ageMs = now - t;
  if (ageMs < 0) return { stale: true, ageMs };
  return { stale: ageMs > STALE_AFTER_MS, ageMs };
}

const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchMountain(mountain, adapters = {}, opts = {}) {
  const { retries = 2, baseDelayMs = 500, sleep = defaultSleep, logger = console } = opts;
  if (mountain.source?.permission !== 'granted') return { status: 'error', error: 'SOURCE_NOT_PERMITTED' };
  const adapter = adapters[mountain.source.type];
  if (!adapter) return { status: 'error', error: 'NO_ADAPTER' };
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const raw = await adapter(mountain);
      return { status: 'ok', report: normaliseReport(raw, mountain.id) };
    } catch (err) {
      logger?.warn?.(`fetch ${mountain.id} attempt ${attempt + 1} failed: ${err?.message}`);
      if (attempt < retries) await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  return { status: 'error', error: 'FETCH_FAILED' };
}

export async function refreshAll(mountains, adapters, previous = {}, opts = {}) {
  const now = opts.now ?? Date.now();
  const out = {};
  for (const mt of mountains) {
    const res = await fetchMountain(mt, adapters, opts);
    const report = res.status === 'ok' ? res.report : previous[mt.id]?.report ?? null;
    out[mt.id] = { status: res.status, error: res.error ?? null, report, ...staleness(report, now) };
  }
  return out;
}
