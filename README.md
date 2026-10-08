# NZ Ski Conditions (Expo app)
Expo Router app for iPhone and Android: NZ and Overseas conditions, ski finder, location-gated chat, privacy controls.
**Status: starter with sample data.** No real feeds, backend, accounts or mountain coordinates yet. Legal files in `legal/` are drafts for a New Zealand lawyer. See `docs/PLACEHOLDERS.md`, `docs/PRELAUNCH_CHECKLIST.md` and `docs/EXPO_PUBLISH.md`.
- Run: `npm install` then `npx expo start` (dev only: `EXPO_PUBLIC_SKIP_LOCATION_CHECK=1` bypasses the 5 km check)
- Core tests: `npm test` (plain Node, no install needed)
- `src/core` holds the tested logic; `app/` holds the screens.
