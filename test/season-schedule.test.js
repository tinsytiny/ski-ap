import test from 'node:test';
import assert from 'node:assert/strict';
import { MOUNTAINS, getMountain } from '../src/core/mountains.js';
import { inSeason, visibleMountains, monthIn } from '../src/core/season.js';
import { haveTodaysReport, nextCheckAt, DEFAULT_SCHEDULE } from '../src/core/schedule.js';

const D = (s) => new Date(s);
test('NZ winter in season, NZ summer out', () => {
  assert.equal(inSeason(getMountain('cardrona'), D('2026-07-15T00:00:00Z')), true);
  assert.equal(inSeason(getMountain('cardrona'), D('2026-01-15T00:00:00Z')), false);
});
test('Whistler season wraps the new year', () => {
  const w = getMountain('whistler');
  assert.equal(inSeason(w, D('2026-12-20T12:00:00Z')), true); assert.equal(inSeason(w, D('2026-02-10T12:00:00Z')), true);
  assert.equal(inSeason(w, D('2026-07-10T12:00:00Z')), false);
});
test('month is evaluated in the mountain timezone', () => {
  assert.equal(monthIn('Pacific/Auckland', D('2026-05-31T13:00:00Z')), 6);
  assert.equal(monthIn('America/Vancouver', D('2026-05-31T13:00:00Z')), 5);
});
test('NZ summer shows overseas even at phase 1', () => {
  const v = visibleMountains(D('2027-01-15T00:00:00Z'), 1);
  assert.equal(v.nzClosedForSummer, true);
  const ids = v.inSeason.map((x) => x.id);
  assert.ok(ids.includes('whistler') && ids.includes('niseko'));
  assert.ok(v.offSeason.some((x) => x.id === 'cardrona'));
});
test('NZ winter at phase 1 shows only NZ', () => {
  const v = visibleMountains(D('2026-07-15T00:00:00Z'), 1);
  assert.equal(v.nzClosedForSummer, false); assert.deepEqual(v.inSeason.map((x) => x.id), ['remarkables', 'coronet-peak', 'cardrona']);
});
const TZ = 'Pacific/Auckland';
// 2026-07-10 06:30 NZST = 2026-07-09T18:30Z
test('schedule: before window waits for window start', () => {
  const now = D('2026-07-09T16:00:00Z'); // 04:00 NZST
  const n = nextCheckAt({ now, lastPublishedAt: null, timeZone: TZ });
  assert.equal(n.toISOString(), '2026-07-09T18:00:00.000Z');
});
test('schedule: in window without report polls every 15 min', () => {
  const now = D('2026-07-09T18:30:00Z');
  assert.equal(nextCheckAt({ now, lastPublishedAt: null, timeZone: TZ }).getTime() - now.getTime(), 15 * 60000);
});
test('schedule: with today\'s report waits for tomorrow window start; after window retries in 3h', () => {
  const now = D('2026-07-09T19:00:00Z'); // 07:00 NZST on the 10th
  assert.equal(haveTodaysReport('2026-07-09T18:45:00Z', now, TZ), true);
  assert.equal(nextCheckAt({ now, lastPublishedAt: '2026-07-09T18:45:00Z', timeZone: TZ }).toISOString(), '2026-07-10T18:00:00.000Z');
  const late = D('2026-07-09T23:00:00Z'); // 11:00 NZST
  assert.equal(nextCheckAt({ now: late, lastPublishedAt: null, timeZone: TZ }).getTime() - late.getTime(), DEFAULT_SCHEDULE.slowPollMinutes * 60000);
});
test('schedule: never more than a day ahead', () => {
  const now = D('2026-07-09T19:00:00Z');
  assert.ok(nextCheckAt({ now, lastPublishedAt: '2026-07-09T18:45:00Z', timeZone: TZ }).getTime() - now.getTime() <= 24 * 3600e3);
  assert.equal(MOUNTAINS.length, 8);
});
