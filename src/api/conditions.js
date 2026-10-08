// Conditions API. SAMPLE_MODE returns labelled sample data. TODO: replace with
// calls to YOUR backend (EXPO_PUBLIC_API_BASE_URL) once resort permission exists.
import { normaliseReport } from '../core/conditions';
import { SAMPLE, SAMPLE_REPORT_TEXT } from '../data/sample';

export const SAMPLE_MODE = true;
const API = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function loadConditions(mountain, { now = Date.now(), signal } = {}) {
  if (SAMPLE_MODE) {
    await new Promise((r) => setTimeout(r, 400));
    if (signal?.aborted) throw new Error('aborted');
    const x = SAMPLE[mountain.id];
    if (!x) throw new Error('No sample data for this mountain');
    const report = normaliseReport({
      publishedAt: new Date(now - x.hoursOld * 3600e3).toISOString(),
      baseDepthCm: x.base, newSnowCm: x.snow, temperatureC: x.temp, windKph: x.wind, weather: x.weather,
      liftsOpen: x.lifts[0], liftsTotal: x.lifts[1], runsOpen: x.runs[0], runsTotal: x.runs[1], accessRoad: x.road, sourceName: 'Sample data',
    }, mountain.id);
    return { sample: true, report };
  }
  if (!API) throw new Error('Backend not configured (EXPO_PUBLIC_API_BASE_URL)');
  const res = await fetch(`${API}/conditions/${mountain.id}`, { signal });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return { sample: false, report: normaliseReport(await res.json(), mountain.id) };
}

export const sampleDayReport = (daysAgo) => SAMPLE_REPORT_TEXT[Math.min(daysAgo, SAMPLE_REPORT_TEXT.length - 1)];
