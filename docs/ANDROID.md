# Android app (APK)

**Bettin'** ships as a native Android shell (Capacitor) that loads your live Cloudflare app. Most updates hit your phone instantly without reinstalling the APK.

## What you get

- Full-screen app icon on your home screen
- Dark status bar + splash screen
- Loads `https://benjamin-bettin.brivera2005.workers.dev`
- **In-app updater** checks GitHub Releases for a newer APK shell
- Tap running total to toggle **$ / units** (same as web)

## Build the APK on your PC (first install)

### Requirements

- [Android Studio](https://developer.android.com/studio) (includes SDK + Java)
- Node 22+

### Steps

```bash
npm install
npm run mobile:sync
npm run mobile:open
```

In Android Studio:

1. Wait for Gradle sync.
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)** (debug is fine for personal sideload).
3. APK path: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Copy to your phone (USB, Google Drive, etc.) and open it to install.
5. Allow **Install unknown apps** for Files/Chrome when prompted.

## GitHub auto-build (recommended)

Every tagged release builds an APK in GitHub Actions.

1. Bump `mobile/release.json`:

```json
{
  "versionName": "1.0.1",
  "versionCode": 2
}
```

2. Commit and tag:

```bash
git add mobile/release.json
git commit -m "Android shell v1.0.1"
git tag android-v1.0.1-build2
git push origin main --tags
```

3. Open **GitHub → Releases** and download `bettin-release.apk`.

4. Open the app on your phone — if a newer release exists later, you'll see an **Install update** banner.

### Tag naming

Use `android-v1.0.0-build{N}` where `{N}` is `versionCode`. The updater parses `-build2` from the tag.

## Two update channels (important)

| Change type | How it updates |
|-------------|----------------|
| Bet UI, stats, auto-grade, parsing | `npm run deploy` → instant in app |
| Native shell, ads SDK, premium billing | New GitHub Release APK |

## Signing for production (optional)

Debug APKs are fine for personal use. For a polished sideload build:

1. Generate a keystore locally.
2. Add GitHub Actions secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
3. Switch the workflow from `assembleDebug` to a signed `assembleRelease` step.

## Troubleshooting

- **White screen** — confirm the Cloudflare URL loads in Chrome on your phone.
- **Update won't install** — Settings → Apps → Bettin' → Install unknown apps → Allow.
- **Plugin errors after pull** — run `npm run mobile:sync` again.
