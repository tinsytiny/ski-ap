export const CATEGORIES = Object.freeze(['analytics', 'marketing', 'embeds']);
export const CONSENT_VERSION = 1;
const KEY = 'consent.v';

// storage: {getItem(k), setItem(k,v), removeItem(k)} (sync or async)
export function createConsentManager(storage, now = () => Date.now()) {
  let state = { decided: false, choices: {} };
  const subs = new Set();
  const snapshot = () => ({ decided: state.decided, choices: { ...state.choices } });
  const emit = () => subs.forEach((f) => { try { f(snapshot()); } catch { /* ignore */ } });
  const persist = async () => {
    try { await storage.setItem(KEY, JSON.stringify({ v: CONSENT_VERSION, at: now(), choices: state.choices })); }
    catch { /* fail closed: in-memory only */ }
  };
  const apply = async (choices) => {
    state = { decided: true, choices: Object.fromEntries(CATEGORIES.map((c) => [c, choices[c] === true])) };
    await persist(); emit();
  };
  return {
    async load() {
      try {
        const raw = await storage.getItem(KEY);
        const d = raw ? JSON.parse(raw) : null;
        if (d && d.v === CONSENT_VERSION && d.choices) state = { decided: true, choices: d.choices };
      } catch { state = { decided: false, choices: {} }; }
      emit();
    },
    hasDecided: () => state.decided,
    allowed: (cat) => CATEGORIES.includes(cat) && state.choices[cat] === true,
    acceptAll: () => apply(Object.fromEntries(CATEGORIES.map((c) => [c, true]))),
    rejectAll: () => apply({}),
    set: (partial) => apply({ ...state.choices, ...partial }),
    async reset() { state = { decided: false, choices: {} }; try { await storage.removeItem(KEY); } catch { /* ignore */ } emit(); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    snapshot,
  };
}

export async function loadIfConsented(manager, category, fn) {
  return manager.allowed(category) ? fn() : undefined;
}
