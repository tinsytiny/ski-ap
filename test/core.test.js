import test from 'node:test';
import assert from 'node:assert/strict';
import { MOUNTAINS, activeMountains, getMountain } from '../src/core/mountains.js';
import { normaliseReport, staleness, fetchMountain, refreshAll, STALE_AFTER_MS } from '../src/core/conditions.js';
import { createConsentManager, loadIfConsented, CONSENT_VERSION } from '../src/core/consent.js';
import { recommend, conditionProfile } from '../src/core/skis.js';

const memStore = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m }; };
const granted = { ...MOUNTAINS[0], source: { type: 'fake', url: 'x', permission: 'granted' } };
const quiet = { warn() {} };

test('registry: phase 1 is the three NZ mountains', () => {
  assert.deepEqual(activeMountains(1).map((x) => x.id), ['remarkables', 'coronet-peak', 'cardrona']);
  assert.equal(activeMountains(3).length, 8);
  assert.equal(getMountain('nope'), null);
});
test('registry: nothing ships as permission granted, no invented coordinates', () => {
  for (const x of MOUNTAINS) { assert.notEqual(x.source.permission, 'granted'); assert.equal(x.location, null); }
});
test('normalise: unknowns stay null, never invented', () => {
  const r = normaliseReport({ baseDepthCm: '62', newSnowCm: null }, 'x');
  assert.equal(r.baseDepthCm, 62); assert.equal(r.newSnowCm, null); assert.equal(r.windKph, null);
});
test('normalise: errors', () => {
  assert.throws(() => normaliseReport(null, 'x'), TypeError);
  assert.throws(() => normaliseReport({ publishedAt: 'nope' }, 'x'), RangeError);
  assert.equal(normaliseReport({ weather: 'a'.repeat(300) }, 'x').weather.length, 120);
});
test('staleness: fresh, old, missing, future', () => {
  const now = Date.parse('2026-07-10T12:00:00Z');
  assert.equal(staleness({ publishedAt: new Date(now - 3600e3).toISOString() }, now).stale, false);
  assert.equal(staleness({ publishedAt: new Date(now - STALE_AFTER_MS - 1).toISOString() }, now).stale, true);
  assert.equal(staleness({ publishedAt: null }, now).stale, true);
  assert.equal(staleness({ publishedAt: new Date(now + 3600e3).toISOString() }, now).stale, true);
});
test('fetch: unpermitted and unadapted sources return explicit errors', async () => {
  assert.equal((await fetchMountain(MOUNTAINS[0], {}, { logger: quiet })).error, 'SOURCE_NOT_PERMITTED');
  assert.equal((await fetchMountain(granted, {}, { logger: quiet })).error, 'NO_ADAPTER');
});
test('fetch: retries with exponential backoff then succeeds', async () => {
  let n = 0; const sleeps = [];
  const res = await fetchMountain(granted, { fake: async () => { if (++n < 3) throw new Error('boom'); return { baseDepthCm: 10 }; } }, { sleep: async (ms) => sleeps.push(ms), logger: quiet });
  assert.equal(res.status, 'ok'); assert.deepEqual(sleeps, [500, 1000]);
});
test('fetch: exhaustion does not throw', async () => {
  const res = await fetchMountain(granted, { fake: async () => { throw new Error('x'); } }, { sleep: async () => {}, logger: quiet });
  assert.deepEqual(res, { status: 'error', error: 'FETCH_FAILED' });
});
test('refreshAll keeps last good report and flags it stale', async () => {
  const now = Date.parse('2026-07-10T12:00:00Z');
  const old = normaliseReport({ publishedAt: new Date(now - 30 * 3600e3).toISOString(), baseDepthCm: 50 }, granted.id);
  const out = await refreshAll([granted], { fake: async () => { throw new Error('x'); } }, { [granted.id]: { report: old } }, { now, sleep: async () => {}, logger: quiet });
  assert.equal(out[granted.id].status, 'error'); assert.equal(out[granted.id].report.baseDepthCm, 50); assert.equal(out[granted.id].stale, true);
});
test('consent: defaults deny, accept, reject, granular, reset', async () => {
  const c = createConsentManager(memStore());
  assert.equal(c.hasDecided(), false); assert.equal(c.allowed('analytics'), false); assert.equal(c.allowed('bogus'), false);
  await c.acceptAll(); assert.equal(c.allowed('embeds'), true);
  await c.rejectAll(); assert.equal(c.allowed('embeds'), false); assert.equal(c.hasDecided(), true);
  await c.set({ analytics: true }); assert.equal(c.allowed('analytics'), true); assert.equal(c.allowed('marketing'), false);
  await c.reset(); assert.equal(c.hasDecided(), false);
});
test('consent: persists, version bump re-prompts, broken storage fails closed', async () => {
  const s = memStore(); const a = createConsentManager(s); await a.acceptAll();
  const b = createConsentManager(s); await b.load(); assert.equal(b.allowed('analytics'), true);
  s.setItem('consent.v', JSON.stringify({ v: CONSENT_VERSION + 1, choices: { analytics: true } }));
  const c = createConsentManager(s); await c.load(); assert.equal(c.hasDecided(), false);
  const broken = createConsentManager({ getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } });
  await broken.load(); assert.equal(broken.allowed('analytics'), false); await broken.acceptAll(); await broken.reset();
});
test('loadIfConsented only runs when allowed', async () => {
  const c = createConsentManager(memStore()); let ran = 0;
  await loadIfConsented(c, 'analytics', () => ran++); assert.equal(ran, 0);
  await c.set({ analytics: true }); await loadIfConsented(c, 'analytics', () => ran++); assert.equal(ran, 1);
});
test('skis: profiles and recommendations incl. Expert', () => {
  assert.equal(conditionProfile({ newSnowCm: 14, temperatureC: -3 }), 'fresh-powder');
  assert.equal(conditionProfile({ newSnowCm: 0, temperatureC: -9 }), 'firm');
  assert.equal(conditionProfile({ newSnowCm: 3, temperatureC: 1 }), 'groomed');
  assert.equal(conditionProfile({ newSnowCm: 0, temperatureC: 4 }), 'soft-spring');
  assert.equal(conditionProfile({}), 'unknown');
  assert.deepEqual(recommend({ ability: 'expert', report: { newSnowCm: 20, temperatureC: -5 } }).types, ['powder', 'all-mountain']);
  assert.match(recommend({ ability: 'beginner', type: 'powder' }).notes[0], /harder to turn/);
  assert.throws(() => recommend({ ability: 'god' }), RangeError);
  assert.throws(() => recommend({ type: 'snowboard' }), RangeError);
});
