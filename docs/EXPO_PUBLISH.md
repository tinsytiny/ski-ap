# Publishing with Expo (EAS)
**One-time:** install Node; run `bash expo-app/setup.sh`; `cd ../ski-app`; `npm i -g eas-cli`; `eas login`; `eas init` (fills `projectId`); edit `app.json` names and IDs; push the project to GitHub.
**Expo connector:** it cannot create projects; it can build and submit existing projects linked to GitHub: `build_run`, `build_info`, `build_submit` (`ascAppIdentifier` for iOS, `track` for Android). First iOS credentials step is done interactively by you (`eas build -p ios`).
**Quick test:** `EXPO_PUBLIC_SKIP_LOCATION_CHECK=1 npx expo start`, scan with Expo Go. Note: push notifications and some native features need a development build, not Expo Go.
**Then:** run the "Test builds" workflow, install the preview build, then TestFlight / Play internal track. Only run "Publish to stores" after PRELAUNCH_CHECKLIST.md is done. Workflows are unvalidated.
