// Ski references. Each model is "described as / listed for" by the cited
// publication, never "best". Third-party, not endorsements, NOT affiliate links.
// Re-verify these sources each season before shipping.
export const SOURCES = {
  powder: { name: 'Powder (via AOL)', url: 'https://www.aol.com/articles/best-mountain-skis-2026-according-125800385.html' },
  skimag: { name: 'SKI Magazine', url: 'https://www.skimag.com/gear/ski-reviews/' },
  snowmag: { name: 'Snow Magazine', url: 'https://www.snowmagazine.com/ski-gear/10-best-all-mountain-skis' },
  buckmans: { name: "Buckman's", url: 'https://buckmans.com/blog/478/best-skis' },
  bluetomato: { name: 'Blue Tomato', url: 'https://www.blue-tomato.com/nl-NL/blue-world/freeski/best-freeski-products' },
};

export const TYPE_INFO = {
  'all-mountain': 'One ski for most of the mountain: groomers, mixed snow and some powder.',
  powder: 'Wider skis that float in fresh snow; less precise on hard, groomed snow.',
  carving: 'Narrower, edge-focused skis for groomed runs and firm snow.',
  park: 'Twin-tip skis for jumps, rails and riding switch.',
};

export const MODELS = {
  'all-mountain': [
    { name: 'Nordica Enforcer 99', source: 'powder', why: 'Listed by Powder among all-mountain skis.' },
    { name: 'Blizzard Rustler 10', source: 'powder', why: 'Listed by Powder among all-mountain skis.' },
    { name: 'Rossignol Arcade 94', source: 'snowmag', why: 'Listed by Snow Magazine among all-mountain skis.' },
  ],
  powder: [
    { name: 'Bode Peak 110', source: 'skimag', why: 'Described by SKI Magazine as its best powder ski of 2025.' },
    { name: 'Atomic Bent 100', source: 'bluetomato', why: 'Listed by Blue Tomato for freeski use.' },
  ],
  carving: [
    { name: 'Salomon Addikt Pro 76', source: 'buckmans', why: "Listed by Buckman's among frontside skis." },
    { name: 'Blizzard Phoenix R13 CA', source: 'buckmans', why: "Listed by Buckman's as a women's frontside ski." },
    { name: 'Black Crows Sato', source: 'snowmag', why: 'Listed by Snow Magazine.' },
  ],
  park: [
    { name: 'Atomic Bent 85', source: 'bluetomato', why: 'Listed by Blue Tomato for park use.' },
    { name: 'Armada ARV 84', source: 'bluetomato', why: 'Listed by Blue Tomato for park use.' },
    { name: 'Line Honey Badger', source: 'bluetomato', why: 'Listed by Blue Tomato for park use.' },
  ],
};

const q = (s) => `https://www.google.com/search?q=${encodeURIComponent(s)}`;
export const searchBuy = (m) => q(`${m} skis buy New Zealand`);
export const searchRent = (m, town = 'Queenstown') => q(`${m} ski rental ${town}`);
export const searchSpecs = (m) => q(`${m} ski specs`);
export const searchShops = (town) => q(`ski rental shops ${town}`);
export const RENTAL_GUIDE = 'https://cardrona-treblecone.com/blog/ski-hire-in-queenstown-and-wanaka';
