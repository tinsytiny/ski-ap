import { activeMountains, MOUNTAINS } from './mountains.js';

export function monthIn(timezone, date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'numeric' }).format(date));
}

export function inSeason(mountain, date = new Date()) {
  const [a, b] = mountain.season;
  const mo = monthIn(mountain.timezone, date);
  return a <= b ? mo >= a && mo <= b : mo >= a || mo <= b;
}

export function visibleMountains(date = new Date(), phase = 1) {
  const base = activeMountains(phase);
  const nzOpen = base.filter((x) => x.country === 'NZ').some((x) => inSeason(x, date));
  const nzClosedForSummer = !nzOpen;
  const pool = nzClosedForSummer
    ? [...base, ...MOUNTAINS.filter((x) => x.country !== 'NZ' && !base.includes(x) && inSeason(x, date))]
    : base;
  return {
    inSeason: pool.filter((x) => inSeason(x, date)),
    offSeason: pool.filter((x) => !inSeason(x, date)),
    nzClosedForSummer,
  };
}
