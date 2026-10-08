import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, checkLocation, GEO_MESSAGES } from '../src/core/geofence.js';
import { BanManager, ModerationStore, submitComment, StrikeTracker, RateLimiter, ReviewQueue } from '../src/core/moderation.js';

const mt = { location: { lat: -45.0, lng: 168.8 } };
const now = 1_000_000_000_000;
const pos = (dLat, extra = {}) => ({ lat: mt.location.lat + dLat, lng: mt.location.lng, accuracyM: 20, timestamp: now - 1000, mocked: false, ...extra });
const ok = (extra = {}) => ({ permission: 'granted', position: pos(0.04), mountain: mt, ...extra });

test('haversine ~111.19 km per degree', () => {
  assert.ok(Math.abs(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) - 111.19) < 0.05);
});
test('geofence: 4.4 km allowed, 5.6 km denied', () => {
  assert.equal(checkLocation({ ...ok(), position: pos(4.4 / 111.19), now }).allowed, true);
  const far = checkLocation({ ...ok(), position: pos(5.6 / 111.19), now });
  assert.equal(far.allowed, false); assert.equal(far.reason, 'TOO_FAR'); assert.equal(far.message, GEO_MESSAGES.TOO_FAR);
});
test('geofence fails closed for every reason', () => {
  const r = (o) => checkLocation({ ...ok(), now, ...o }).reason;
  assert.equal(r({ permission: 'denied' }), 'NO_PERMISSION');
  assert.equal(r({ mountain: { location: null } }), 'NO_MOUNTAIN_COORDS');
  assert.equal(r({ position: null }), 'NO_FIX');
  assert.equal(r({ position: pos(0, { mocked: true }) }), 'MOCKED');
  assert.equal(r({ position: pos(0, { timestamp: now - 130000 }) }), 'STALE');
  assert.equal(r({ position: pos(0, { timestamp: now + 6000 }) }), 'STALE');
  assert.equal(r({ position: pos(0, { accuracyM: 900 }) }), 'INACCURATE');
  assert.equal(r({ position: pos(0, { accuracyM: undefined }) }), 'INACCURATE');
});
test('posting requires location by default', () => {
  const res = submitComment({ id: 'c1', userId: 'u', text: 'hello', now });
  assert.equal(res.status, 'location'); assert.equal(res.reasons[0], 'NO_PERMISSION');
});
test('posting works with a valid location and requireLocation can be disabled for dev', () => {
  assert.equal(submitComment({ id: 'c', userId: 'u', text: 'great day', geo: { ...ok(), position: pos(0.01) }, now }).status, 'posted');
  assert.equal(submitComment({ id: 'c', userId: 'u', text: 'great day', requireLocation: false, now }).status, 'posted');
});
test('ban pipeline: 24h, repeat permanent, lift, no double ban', () => {
  const b = new BanManager(); const t = 5e12;
  assert.equal(b.ban('u', t).state, 'banned'); assert.equal(b.ban('u', t + 1000).state, 'banned');
  assert.equal(b.status('u', t + 25 * 3600e3).state, 'ok');
  assert.equal(b.ban('u', t + 25 * 3600e3).state, 'banned_permanent');
  assert.equal(b.status('u', t + 1e12).state, 'banned_permanent');
  b.lift('u'); assert.equal(b.status('u').state, 'ok');
});
test('report threshold hides once and bans author; remove also bans; block and visibility', () => {
  const bans = new BanManager(); const calls = [];
  const s = new ModerationStore({ hideAt: 3, onHide: (c, a) => { calls.push(c); bans.ban(a); } });
  s.report('c1', 'r1', 'author'); s.report('c1', 'r1', 'author'); assert.equal(s.isHidden('c1'), false);
  s.report('c1', 'r2', 'author'); s.report('c1', 'r3', 'author'); s.report('c1', 'r4', 'author');
  assert.equal(s.isHidden('c1'), true); assert.deepEqual(calls, ['c1']); assert.equal(bans.status('author').state, 'banned');
  s.remove('c2', 'author2'); assert.deepEqual(calls, ['c1', 'c2']);
  s.block('me', 'troll');
  const vis = s.visibleFor('me', [{ id: 'c1', authorId: 'a' }, { id: 'c3', authorId: 'troll' }, { id: 'c4', authorId: 'ok' }]);
  assert.deepEqual(vis.map((c) => c.id), ['c4']); s.unblock('me', 'troll');
  assert.equal(s.visibleFor('me', [{ id: 'c3', authorId: 'troll' }]).length, 1);
});
test('submitComment order: ban, suspended/muted, location, rate limit, moderation', () => {
  const bans = new BanManager(), strikes = new StrikeTracker(), limiter = new RateLimiter({ max: 1, windowMs: 60000 }), queue = new ReviewQueue();
  const base = { userId: 'u', limiter, strikes, queue, bans, requireLocation: false, now };
  assert.equal(submitComment({ ...base, id: 1, text: 'fine' }).status, 'posted');
  assert.equal(submitComment({ ...base, id: 2, text: 'fine two' }).status, 'rate_limited');
  bans.ban('u', now); assert.equal(submitComment({ ...base, id: 3, text: 'x' }).status, 'banned');
  const b2 = { ...base, userId: 'v', bans: new BanManager(), limiter: new RateLimiter({ max: 99 }) };
  for (let i = 0; i < 3; i++) assert.equal(submitComment({ ...b2, id: i, text: 'shit' }).status, 'blocked');
  assert.equal(submitComment({ ...b2, id: 9, text: 'clean' }).status, 'muted');
  const held = submitComment({ ...b2, userId: 'w', id: 10, text: 'you idiot' });
  assert.equal(held.status, 'held'); assert.equal(queue.pending().length, 1);
  assert.match(submitComment({ ...b2, userId: 'z', id: 11, text: '100% safe' }).message, /official resort and avalanche advice/);
});
