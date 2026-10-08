// Frozen mountain registry. Nothing here is verified: coordinates, feeds and
// seasons are placeholders until the owner confirms them with each resort.
export const PHASES = Object.freeze({ NZ: 1, CANADA: 2, JAPAN: 3 });

const m = (id, name, region, country, phase, season, timezone) =>
  Object.freeze({
    id, name, region, country, phase,
    location: null, // {lat,lng} [VERIFY] - geofence fails closed until set
    season, // approximate [firstMonth,lastMonth]; confirm with resort
    timezone,
    source: Object.freeze({ type: 'unconfigured', url: '[VERIFY OFFICIAL FEED URL]', permission: 'unknown' }),
    cams: Object.freeze([]),
  });

export const MOUNTAINS = Object.freeze([
  m('remarkables', 'The Remarkables', 'Queenstown', 'NZ', 1, [6, 10], 'Pacific/Auckland'),
  m('coronet-peak', 'Coronet Peak', 'Queenstown', 'NZ', 1, [6, 10], 'Pacific/Auckland'),
  m('cardrona', 'Cardrona', 'Wanaka', 'NZ', 1, [6, 10], 'Pacific/Auckland'),
  m('whistler', 'Whistler Blackcomb', 'British Columbia', 'CA', 2, [11, 4], 'America/Vancouver'),
  m('niseko', 'Niseko', 'Hokkaido', 'JP', 3, [12, 4], 'Asia/Tokyo'),
  m('hakuba', 'Hakuba', 'Nagano', 'JP', 3, [12, 4], 'Asia/Tokyo'),
  m('rusutsu', 'Rusutsu', 'Hokkaido', 'JP', 3, [12, 4], 'Asia/Tokyo'),
  m('myoko', 'Myoko', 'Niigata', 'JP', 3, [12, 4], 'Asia/Tokyo'),
]);

export const activeMountains = (phase = 1) => MOUNTAINS.filter((x) => x.phase <= phase);
export const getMountain = (id) => MOUNTAINS.find((x) => x.id === id) ?? null;
