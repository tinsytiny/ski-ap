export const SKI_TYPES = Object.freeze(['all-mountain', 'powder', 'carving', 'park']);
export const ABILITIES = Object.freeze(['beginner', 'intermediate', 'advanced', 'expert']);
// Rules of thumb for waist width in mm, not product claims.
export const WAIST_RANGES_MM = Object.freeze({ carving: [65, 85], 'all-mountain': [85, 105], powder: [105, 130], park: [85, 100] });

export function conditionProfile(report) {
  const n = report?.newSnowCm, t = report?.temperatureC;
  if (n == null || t == null) return 'unknown';
  if (n >= 10) return 'fresh-powder';
  if (t <= -8 && n < 2) return 'firm';
  if (t > 2) return 'soft-spring';
  return 'groomed';
}

const BEST = { 'fresh-powder': ['powder', 'all-mountain'], firm: ['carving', 'all-mountain'], groomed: ['carving', 'all-mountain'], 'soft-spring': ['all-mountain', 'park'], unknown: ['all-mountain'] };

export function recommend({ ability, type, report } = {}) {
  if (ability && !ABILITIES.includes(ability) && ability !== 'any') throw new RangeError(`unknown ability: ${ability}`);
  if (type && !SKI_TYPES.includes(type)) throw new RangeError(`unknown type: ${type}`);
  const profile = conditionProfile(report);
  const types = type ? [type] : BEST[profile];
  const notes = [];
  if (ability === 'beginner' && types.includes('powder')) notes.push('Very wide skis can be harder to turn on groomed runs.');
  return { profile, types, waistRangesMm: Object.fromEntries(types.map((x) => [x, WAIST_RANGES_MM[x]])), notes };
}
