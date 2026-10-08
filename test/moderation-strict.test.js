import test from 'node:test';
import assert from 'node:assert/strict';
import { moderateComment as mod, normalise, RateLimiter, StrikeTracker, ReviewQueue, checkComment } from '../src/core/moderation.js';

const act = (t, o) => mod(t, o).action;
test('allows normal text incl. "mishit"', () => {
  for (const t of ['Great base today!', 'Mishit on the T-bar lol', 'Lifts running well, 20cm overnight']) assert.equal(act(t), 'allow', t);
});
test('catches obfuscation forms', () => {
  for (const t of ['f u c k', 'fuuuck', 'sh1t', 'FÜCK', 'f.u.c.k', 'a$$hole']) assert.equal(act(t), 'block', t);
});
test('threats, personal info, links, solicitation', () => {
  assert.ok(mod('I will find you').reasons.includes('THREAT'));
  assert.ok(mod('go die').reasons.includes('THREAT'));
  assert.ok(mod('email me bob@example.com').reasons.includes('PERSONAL_INFO'));
  assert.ok(mod('call 021 555 1234').reasons.includes('PERSONAL_INFO'));
  assert.ok(mod('see www.deals.com').reasons.includes('LINKS'));
  assert.ok(mod('https://x.io/a').reasons.includes('LINKS'));
  assert.ok(mod('whatsapp me').reasons.includes('SOLICITATION'));
});
test('spam, shouting, unsafe claims, duplicates', () => {
  assert.ok(mod('aaaaaaaaaaaa').reasons.includes('SPAM_REPEAT'));
  assert.ok(mod('THIS IS ABSOLUTELY AMAZING').reasons.includes('SHOUTING'));
  assert.ok(mod('Short caps OK').action === 'allow');
  assert.ok(mod('it is 100% safe up there').reasons.includes('UNSAFE_CLAIM'));
  assert.ok(mod('safe to ski off-piste today').reasons.includes('UNSAFE_CLAIM'));
  assert.ok(mod('nice day', { recent: ['Nice day'] }).reasons.includes('DUPLICATE'));
});
test('mild insults held, new users held, extra blocklist', () => {
  assert.equal(act('you idiot'), 'review');
  assert.equal(act('fine comment', { holdAll: true }), 'review');
  assert.equal(act('badword here', { extraBlocked: ['badword'] }), 'block');
});
test('weird input', () => {
  assert.deepEqual(mod(null).reasons, ['INVALID']); assert.deepEqual(mod('   ').reasons, ['EMPTY']);
  assert.deepEqual(mod('x'.repeat(281)).reasons, ['TOO_LONG']); assert.equal(act({}), 'block');
  assert.equal(normalise('H3LL0'), 'hello'); assert.equal(checkComment('hi').ok, true);
});
test('rate limiter recovers', () => {
  const l = new RateLimiter({ max: 2, windowMs: 1000 });
  assert.ok(l.check('u', 0).allowed); assert.ok(l.check('u', 1).allowed);
  const r = l.check('u', 2); assert.equal(r.allowed, false); assert.ok(r.retryAfterMs > 0);
  assert.ok(l.check('u', 1500).allowed);
});
test('strikes: 3 -> mute, second mute -> suspended until reinstated; user errors never strike', () => {
  const s = new StrikeTracker(); const t0 = 1e9;
  s.strike('u', ['EMPTY', 'TOO_LONG', 'DUPLICATE'], t0); assert.equal(s.status('u', t0).state, 'ok');
  for (let i = 0; i < 3; i++) s.strike('u', ['PROFANITY'], t0 + i);
  assert.equal(s.status('u', t0 + 5).state, 'muted');
  const later = t0 + 2 * 3600e3;
  assert.equal(s.status('u', later).state, 'ok');
  for (let i = 0; i < 3; i++) s.strike('u', ['LINKS'], later + i);
  assert.equal(s.status('u', later + 10).state, 'suspended');
  s.reinstate('u'); assert.equal(s.status('u', later + 10).state, 'ok');
});
test('review queue approve/reject and unknown id', () => {
  const q = new ReviewQueue(); const a = q.add({ text: 'a' }); const b = q.add({ text: 'b' });
  assert.equal(q.pending().length, 2); assert.equal(q.approve(a).text, 'a'); assert.equal(q.reject(b).text, 'b');
  assert.equal(q.pending().length, 0); assert.throws(() => q.approve('zzz'), RangeError);
});
