# Placeholder checklist (fill in before launch)
**Business identity:** [YOUR LEGAL BUSINESS NAME], [REGISTERED ADDRESS], NZBN/company number, [PRIVACY EMAIL], [SUPPORT EMAIL], [TAKEDOWN EMAIL], [APPEALS EMAIL].
**Policy decisions:** minimum age; retention periods; providers list; whether anything is paid; refund terms; liability clause; review/response times; EU/UK representative; CCPA sale/sharing; whether coordinates are stored (policy assumes not).
**Location/posting:** `location {lat,lng}` for every mountain in `src/core/mountains.js` (then copy core to expo-app). Posting stays blocked until set.
**Feeds and cams:** official feed URL + written permission per resort; cam page URLs.
**Expo/Apple/Google:** `[APP NAME]`, `[app-slug]`, bundle ID and Android package (`com.replaceme.nzsnow`), `projectId` (from `eas init`), `[APP STORE CONNECT APP ID]`, Google Play service-account JSON path, confirm `ITSAppUsesNonExemptEncryption:false`.
**Hosting:** public URLs for each legal page (set the `EXPO_PUBLIC_*_URL` vars).
**Data:** backend for conditions, auth, comments, push and account deletion.
