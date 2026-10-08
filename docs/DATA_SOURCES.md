# Data sources needing permission
Nothing was scraped or verified. Every mountain ships `permission: 'unknown'` and the ingestion code refuses to fetch (`SOURCE_NOT_PERMITTED`) until you set `'granted'`.
For each of The Remarkables, Coronet Peak, Cardrona (then Whistler, Niseko, Hakuba, Rusutsu, Myoko): get **written permission**, check terms and robots.txt, prefer an official feed/API, and confirm cam embedding rights and credit wording.
**Adding an adapter:** write `async (mountain) => rawObject`, register it under the mountain's `source.type`, pass it to `fetchMountain`/`refreshAll` on your server, then set permission to `granted` for that mountain only.
