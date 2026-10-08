// Layered comment moderation. Starter lists only: NO slurs are included on
// purpose. Plug a maintained list in via `extraBlocked`. Filters cannot catch
// everything; human moderation and report/block tools are required.
import { checkLocation, GEO_MESSAGES } from './geofence.js';

export const MAX_COMMENT_LENGTH = 280;
const HOUR = 3600000;

export function normalise(text) {
  let s = String(text).normalize('NFKD').replace(/[\u0300-\u036f\u200b-\u200d\u2060\ufeff]/g, '').toLowerCase();
  s = s.replace(/[01345@$]/g, (c) => ({ 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', '@': 'a', $: 's' }[c]));
  s = s.replace(/[^a-z]+/g, ' ');
  s = s.replace(/\b([a-z])(?: ([a-z])\b)+/g, (m) => m.replace(/ /g, ''));
  return s.replace(/\s+/g, ' ').trim();
}
const squeeze = (s) => s.replace(/([a-z])\1+/g, '$1');

const BLOCKED = ['fuck', 'shit', 'cunt', 'bitch', 'asshole'];
const MILD = ['idiot', 'stupid', 'dumb', 'moron', 'loser', 'shut up', 'hate you'];
const hasWord = (norm, sq, w) => {
  const re = new RegExp(`(^| )${w}`);
  return re.test(norm) || re.test(sq);
};

const THREAT = [
  /\b(kill|hurt|beat|stab|shoot|punch)\s+(you|yourself|him|her|them)\b/i,
  /\bkys\b/i, /\bgo (and )?die\b/i, /\bhope you (die|get hurt)\b/i,
  /\bi('| wi)?ll (find|get) you\b/i, /\bi will (find|get) you\b/i,
];
const SOLICIT = /\b(dm|text|whatsapp|telegram|snap|insta)\s+me\b|\badd me on\b|\bcontact me\b/i;
const UNSAFE = [
  /\bno avalanche risk\b/i,
  /\b(100%|totally|completely|perfectly)\s+safe\b/i,
  /\bsafe to ski (out of bounds|off[- ]?piste|backcountry)\b/i,
];
const LINKS = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|nz|me|ly|xyz|app)\b)/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export const STRIKE_REASONS = Object.freeze(['PROFANITY', 'THREAT', 'SOLICITATION', 'LINKS', 'SPAM_REPEAT']);
export const MESSAGES = Object.freeze({
  INVALID: "That doesn't look like a valid comment.",
  EMPTY: 'Please write something first.',
  TOO_LONG: `Comments can be up to ${MAX_COMMENT_LENGTH} characters.`,
  PROFANITY: 'Please keep the language clean.',
  THREAT: "Threats or wishing harm on people isn't allowed.",
  PERSONAL_INFO: "Please don't share personal contact details.",
  LINKS: "Links aren't allowed in comments.",
  SOLICITATION: "Please don't ask people to contact you elsewhere.",
  SPAM_REPEAT: "Please don't repeat characters to fill space.",
  SHOUTING: 'Please turn off caps lock.',
  UNSAFE_CLAIM: "Please don't make safety claims. Check the official resort and avalanche advice.",
  DUPLICATE: "You've already posted that.",
  MILD_INSULT: 'Your comment is waiting for review.',
  NEW_USER: 'Your comment is waiting for review.',
  RATE_LIMITED: "You're posting too fast. Try again shortly.",
  MUTED: 'Posting is paused for a while after repeated problems.',
  SUSPENDED: 'Posting is off until a moderator reviews your account.',
  BANNED: 'Chat is paused on your account for 24 hours.',
  BANNED_PERMANENT: 'Chat is off on your account until a moderator reviews it.',
});

export function moderateComment(text, { recent = [], holdAll = false, extraBlocked = [] } = {}) {
  if (typeof text !== 'string') return { action: 'block', reasons: ['INVALID'], text: '' };
  const t = text.trim();
  if (!t) return { action: 'block', reasons: ['EMPTY'], text: '' };
  if (t.length > MAX_COMMENT_LENGTH) return { action: 'block', reasons: ['TOO_LONG'], text: t };
  const hard = [], soft = [];
  const norm = normalise(t), sq = squeeze(norm);
  if ([...BLOCKED, ...extraBlocked.map((w) => normalise(w))].some((w) => w && hasWord(norm, sq, w))) hard.push('PROFANITY');
  if (THREAT.some((r) => r.test(t) || r.test(norm))) hard.push('THREAT');
  const digits = (t.match(/\d/g) || []).length;
  if (EMAIL.test(t) || (digits >= 9 && /\d[\d\s().+-]{7,}\d/.test(t))) hard.push('PERSONAL_INFO');
  if (LINKS.test(t) && !EMAIL.test(t)) hard.push('LINKS');
  if (SOLICIT.test(t)) hard.push('SOLICITATION');
  if (/(.)\1{9,}/.test(t)) hard.push('SPAM_REPEAT');
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 12 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.7) hard.push('SHOUTING');
  if (UNSAFE.some((r) => r.test(t))) hard.push('UNSAFE_CLAIM');
  if (recent.some((r) => String(r).trim().toLowerCase() === t.toLowerCase())) hard.push('DUPLICATE');
  if (hard.length) return { action: 'block', reasons: hard, text: t };
  if (MILD.some((w) => hasWord(norm, sq, w))) soft.push('MILD_INSULT');
  if (holdAll) soft.push('NEW_USER');
  return { action: soft.length ? 'review' : 'allow', reasons: soft, text: t };
}

export const checkComment = (text, opts) => {
  const r = moderateComment(text, opts);
  return { ok: r.action === 'allow', ...r };
};

export class RateLimiter {
  constructor({ max = 5, windowMs = 60000 } = {}) { this.max = max; this.windowMs = windowMs; this.hits = new Map(); }
  check(userId, now = Date.now()) {
    const arr = (this.hits.get(userId) ?? []).filter((t) => now - t < this.windowMs);
    if (arr.length >= this.max) { this.hits.set(userId, arr); return { allowed: false, retryAfterMs: this.windowMs - (now - arr[0]) }; }
    arr.push(now); this.hits.set(userId, arr);
    return { allowed: true, retryAfterMs: 0 };
  }
}

export class StrikeTracker {
  constructor({ max = 3, windowMs = 24 * HOUR, muteMs = HOUR, suspendAfterMutes = 2 } = {}) {
    Object.assign(this, { max, windowMs, muteMs, suspendAfterMutes }); this.s = new Map();
  }
  _get(id) { if (!this.s.has(id)) this.s.set(id, { strikes: [], mutedUntil: 0, mutes: 0, suspended: false }); return this.s.get(id); }
  strike(id, reasons, now = Date.now()) {
    if (!reasons.some((r) => STRIKE_REASONS.includes(r))) return this.status(id, now);
    const u = this._get(id);
    u.strikes = u.strikes.filter((t) => now - t < this.windowMs); u.strikes.push(now);
    if (u.strikes.length >= this.max) {
      u.strikes = []; u.mutes += 1;
      if (u.mutes >= this.suspendAfterMutes) u.suspended = true; else u.mutedUntil = now + this.muteMs;
    }
    return this.status(id, now);
  }
  status(id, now = Date.now()) {
    const u = this._get(id);
    if (u.suspended) return { state: 'suspended', retryAfterMs: null };
    if (u.mutedUntil > now) return { state: 'muted', retryAfterMs: u.mutedUntil - now };
    return { state: 'ok', retryAfterMs: 0 };
  }
  reinstate(id) { const u = this._get(id); u.suspended = false; u.mutes = 0; u.mutedUntil = 0; u.strikes = []; }
}

export class BanManager {
  constructor({ banMs = 24 * HOUR, permanentAfter = 2 } = {}) { Object.assign(this, { banMs, permanentAfter }); this.b = new Map(); }
  ban(id, now = Date.now()) {
    const u = this.b.get(id) ?? { count: 0, until: 0, permanent: false };
    if (u.permanent || u.until > now) return this.status(id, now); // no double ban
    u.count += 1;
    if (u.count >= this.permanentAfter) u.permanent = true; else u.until = now + this.banMs;
    this.b.set(id, u); return this.status(id, now);
  }
  status(id, now = Date.now()) {
    const u = this.b.get(id);
    if (!u) return { state: 'ok', retryAfterMs: 0 };
    if (u.permanent) return { state: 'banned_permanent', retryAfterMs: null };
    if (u.until > now) return { state: 'banned', retryAfterMs: u.until - now };
    return { state: 'ok', retryAfterMs: 0 };
  }
  lift(id) { this.b.delete(id); }
}

export class ReviewQueue {
  constructor() { this.items = new Map(); this.n = 0; }
  add(item) { const id = `r${++this.n}`; this.items.set(id, { id, ...item }); return id; }
  pending() { return [...this.items.values()]; }
  _take(id) { const it = this.items.get(id); if (!it) throw new RangeError(`unknown review id: ${id}`); this.items.delete(id); return it; }
  approve(id) { return this._take(id); }
  reject(id) { return this._take(id); }
}

export class ModerationStore {
  constructor({ hideAt = 3, onHide } = {}) { this.hideAt = hideAt; this.onHide = onHide; this.reports = new Map(); this.hidden = new Set(); this.blocks = new Map(); }
  _hide(commentId, authorId) {
    if (this.hidden.has(commentId)) return;
    this.hidden.add(commentId);
    try { this.onHide?.(commentId, authorId); } catch { /* never break moderation */ }
  }
  report(commentId, reporterId, authorId) {
    const set = this.reports.get(commentId) ?? new Set(); set.add(reporterId); this.reports.set(commentId, set);
    if (set.size >= this.hideAt) this._hide(commentId, authorId);
    return { count: set.size, hidden: this.hidden.has(commentId) };
  }
  remove(commentId, authorId) { this._hide(commentId, authorId); }
  block(userId, targetId) { const s = this.blocks.get(userId) ?? new Set(); s.add(targetId); this.blocks.set(userId, s); }
  unblock(userId, targetId) { this.blocks.get(userId)?.delete(targetId); }
  isHidden(commentId) { return this.hidden.has(commentId); }
  visibleFor(userId, comments) {
    const b = this.blocks.get(userId);
    return comments.filter((c) => !this.hidden.has(c.id) && !b?.has(c.authorId));
  }
}

export function submitComment({ id, userId, text, recent = [], limiter, strikes, queue, bans, geo, requireLocation = true,
  holdAll = false, extraBlocked = [], now = Date.now() } = {}) {
  const res = (status, reasons, message, extra = {}) => ({ status, reasons, message, ...extra });
  const b = bans?.status(userId, now);
  if (b && b.state !== 'ok') return res('banned', [b.state === 'banned' ? 'BANNED' : 'BANNED_PERMANENT'], b.state === 'banned' ? MESSAGES.BANNED : MESSAGES.BANNED_PERMANENT);
  const s = strikes?.status(userId, now);
  if (s?.state === 'suspended') return res('suspended', ['SUSPENDED'], MESSAGES.SUSPENDED);
  if (s?.state === 'muted') return res('muted', ['MUTED'], MESSAGES.MUTED);
  if (requireLocation) {
    const g = checkLocation({ ...geo, now });
    if (!g.allowed) return res('location', [g.reason], g.message ?? GEO_MESSAGES[g.reason], { distanceKm: g.distanceKm });
  }
  const rl = limiter?.check(userId, now);
  if (rl && !rl.allowed) return res('rate_limited', ['RATE_LIMITED'], MESSAGES.RATE_LIMITED, { retryAfterMs: rl.retryAfterMs });
  const m = moderateComment(text, { recent, holdAll, extraBlocked });
  if (m.action === 'block') {
    strikes?.strike(userId, m.reasons, now);
    return res('blocked', m.reasons, MESSAGES[m.reasons[0]] ?? MESSAGES.INVALID);
  }
  if (m.action === 'review') { queue?.add({ id, userId, text: m.text, reasons: m.reasons }); return res('held', m.reasons, MESSAGES[m.reasons[0]], { text: m.text }); }
  return res('posted', [], 'Posted.', { text: m.text });
}
