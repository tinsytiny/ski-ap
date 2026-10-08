// Location gate for posting. Fails closed. GPS can be spoofed: re-verify on a
// server and never store coordinates (keep only the pass/fail result).
export const POST_RADIUS_KM = 5;
export const MAX_ACCURACY_M = 500;
export const MAX_FIX_AGE_MS = 120000;
const R = 6371.0088;

export const GEO_MESSAGES = Object.freeze({
  NO_PERMISSION: 'Share your location to post. You can still read comments.',
  NO_MOUNTAIN_COORDS: 'Posting is not available for this mountain yet.',
  NO_FIX: "We couldn't get your location. Try again.",
  MOCKED: "Your location looks simulated, so you can't post.",
  STALE: 'Your location is out of date. Try again.',
  INACCURATE: 'Your location is not accurate enough. Try again outdoors.',
  TOO_FAR: 'You need to be within 5 km of the mountain to post. You can still read comments.',
});

const rad = (d) => (d * Math.PI) / 180;
export function haversineKm(a, b) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const deny = (reason) => ({ allowed: false, reason, message: GEO_MESSAGES[reason] });

export function checkLocation({ permission, position, mountain, now = Date.now(), radiusKm = POST_RADIUS_KM,
  maxAccuracyM = MAX_ACCURACY_M, maxAgeMs = MAX_FIX_AGE_MS } = {}) {
  if (permission !== 'granted') return deny('NO_PERMISSION');
  const loc = mountain?.location;
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return deny('NO_MOUNTAIN_COORDS');
  if (!position || !Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return deny('NO_FIX');
  if (position.mocked === true) return deny('MOCKED');
  const age = now - position.timestamp;
  if (!Number.isFinite(age) || age > maxAgeMs || age < -5000) return deny('STALE');
  if (!Number.isFinite(position.accuracyM) || position.accuracyM > maxAccuracyM) return deny('INACCURATE');
  const distanceKm = haversineKm(position, loc);
  if (distanceKm > radiusKm) return { ...deny('TOO_FAR'), distanceKm };
  return { allowed: true, distanceKm };
}
