import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createConsentManager } from '../core/consent';
import { BanManager, ModerationStore, RateLimiter, ReviewQueue, StrikeTracker, submitComment } from '../core/moderation';
import { visibleMountains } from '../core/season';
import { MOUNTAINS } from '../core/mountains';
import { getPostingPosition } from '../native/locationGate';
import { COMMENT_POOL } from '../data/sample';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// DEV ONLY: never set for a release build.
const SKIP_LOCATION = process.env.EXPO_PUBLIC_SKIP_LOCATION_CHECK === '1';
const PHASE = Number(process.env.EXPO_PUBLIC_CURRENT_PHASE || 1);
const NZ_SUMMER_DEMO = new Date('2027-01-15T00:00:00Z');

function seedComments() {
  const out = [];
  const day = 24 * 3600e3, t = Date.now();
  MOUNTAINS.forEach((m, mi) => {
    for (let d = 0; d < 3; d++) for (let k = 0; k < 2; k++) {
      out.push({ id: `seed-${m.id}-${d}-${k}`, mountainId: m.id, authorId: `sample-${(mi + d + k) % 5}`, author: `Sample user ${(mi + d + k) % 5 + 1}`,
        text: COMMENT_POOL[(mi + d * 2 + k) % COMMENT_POOL.length], at: new Date(t - d * day - (k + 1) * 3600e3).toISOString(), sample: true });
    }
  });
  return out;
}

export function AppProvider({ children }) {
  const consent = useRef(createConsentManager(AsyncStorage)).current;
  const [consentSnap, setConsentSnap] = useState(consent.snapshot());
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null); // local stub: replace with real auth
  const [mountainId, setMountainId] = useState(null);
  const [comments, setComments] = useState(seedComments);
  const [summerDemo, setSummerDemo] = useState(false);
  const [version, setVersion] = useState(0); // bump to re-render after moderation changes

  const mod = useRef(null);
  if (!mod.current) {
    const bans = new BanManager();
    mod.current = { limiter: new RateLimiter(), strikes: new StrikeTracker(), queue: new ReviewQueue(), bans,
      store: new ModerationStore({ hideAt: 3, onHide: (_cid, authorId) => bans.ban(authorId) }) };
  }

  useEffect(() => {
    const off = consent.subscribe(setConsentSnap);
    consent.load().finally(() => setReady(true));
    return off;
  }, [consent]);

  const date = summerDemo ? NZ_SUMMER_DEMO : new Date();
  const seasons = useMemo(() => visibleMountains(date, PHASE), [summerDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = useCallback(() => setUser({ id: 'me', name: 'You' }), []);
  const signOut = useCallback(() => setUser(null), []);
  const deleteAccount = useCallback(async () => {
    // TODO: call your backend to delete the account and its data. Required by Apple.
    setComments((c) => c.filter((x) => x.authorId !== 'me'));
    setUser(null);
  }, []);

  const post = useCallback(async (mountain, text) => {
    if (!user) return { status: 'blocked', reasons: ['SIGN_IN'], message: 'Sign in to post.' };
    let geo;
    if (!SKIP_LOCATION) {
      const g = await getPostingPosition();
      geo = { permission: g.permission, position: g.position, mountain };
    }
    const recent = comments.filter((c) => c.authorId === user.id).map((c) => c.text);
    const res = submitComment({ id: `c-${Date.now()}`, userId: user.id, text, recent, ...mod.current, geo, requireLocation: !SKIP_LOCATION, holdAll: false });
    if (res.status === 'posted') {
      setComments((c) => [{ id: `c-${Date.now()}`, mountainId: mountain.id, authorId: user.id, author: user.name, text: res.text, at: new Date().toISOString() }, ...c]);
    }
    setVersion((v) => v + 1);
    return res;
  }, [user, comments]);

  const report = useCallback((commentId, authorId) => { mod.current.store.report(commentId, user?.id ?? 'guest', authorId); setVersion((v) => v + 1); }, [user]);
  const block = useCallback((authorId) => { mod.current.store.block(user?.id ?? 'guest', authorId); setVersion((v) => v + 1); }, [user]);
  const simulateRemoval = useCallback(() => { if (user) { mod.current.bans.ban(user.id); setVersion((v) => v + 1); } }, [user]);
  const resetBans = useCallback(() => { mod.current.bans.lift(user?.id ?? 'me'); setVersion((v) => v + 1); }, [user]);
  const banStatus = user ? mod.current.bans.status(user.id) : { state: 'ok' };
  const visibleComments = (mid) => mod.current.store.visibleFor(user?.id ?? 'guest', comments.filter((c) => c.mountainId === mid));

  const value = { consent, consentSnap, ready, user, signIn, signOut, deleteAccount, mountainId, setMountainId, comments, visibleComments,
    summerDemo, setSummerDemo, seasons, post, report, block, simulateRemoval, resetBans, banStatus, version, SKIP_LOCATION, PHASE };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
