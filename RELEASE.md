# Release Process

RestWolf releases are driven by a release PR. Running `npm run release` interactively bumps the version, creates a `release/vX.Y.Z` branch, and opens a PR. When the PR is merged into `main`, the [Release workflow](.github/workflows/release.yml) tags, builds, and publishes installers for Windows / macOS / Linux to GitHub Releases — including the `latest.yml` metadata that powers in-app auto-updates via [`electron-updater`](https://www.electron.build/auto-update).

## One-time setup

- **Branch protection (recommended):** require PR + green checks before merging into `main`.
- **GitHub CLI:** `gh auth login` so the release script can open PRs on your behalf.
- **`release` label:** the release script applies the `release` label. Create it once in the repo (Issues → Labels → New label).
- **(Optional) macOS code signing & notarization:** required for macOS auto-update. Add `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_ID_PASSWORD` repo secrets, set `notarize: true` in `electron-builder-config.js`, and update `appBundleId` / signing identity to RightCrowd's.
- **(Optional) Windows code signing:** add `CSC_LINK` / `CSC_KEY_PASSWORD` secrets to skip SmartScreen warnings.

## Cutting a release

```powershell
npm run release
```

The script will:

1. Verify the working tree is clean.
2. Show the current version and let you pick `patch` / `minor` / `major` / `prerelease`.
3. Create branch `release/vX.Y.Z`, bump `packages/bruno-electron/package.json`, commit, push.
4. Open a PR into `main` via `gh`.

Review and merge the PR. On merge:

1. The workflow tags `vX.Y.Z` on `main`.
2. A matrix job builds installers on `windows-latest`, `macos-latest`, `ubuntu-latest` and publishes them (plus `latest.yml`, `latest-mac.yml`, `latest-linux.yml`) to a draft GitHub release.
3. A final job un-drafts the release.

Once published, running RestWolf installs check for updates at startup and every 6 hours, download in the background, and prompt the user to restart.

## Manual local builds

If you just want a local installer (no publish):

```powershell
npm run build:web
npm run build:electron        # current OS
# or one of:
npm run build:electron:win
npm run build:electron:mac
npm run build:electron:linux
```

Output: `packages/bruno-electron/out/`.

## Troubleshooting

- **Auto-update doesn't trigger:** confirm the published release contains `latest.yml` (Win), `latest-mac.yml`, `latest-linux.yml`. Without these, `electron-updater` has nothing to compare against.
- **Workflow didn't run on merge:** the trigger requires the PR's head branch to start with `release/`. Manually-renamed branches won't fire it.
- **Mac job fails on signing:** without secrets the build will succeed but app won't be notarized; users get Gatekeeper warnings and macOS auto-update will refuse to apply unsigned updates.
