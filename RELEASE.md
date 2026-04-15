# Release Process

## Prerequisites

- Node.js installed
- Run `npm i --legacy-peer-deps` from the repo root if you haven't already

## Steps

### 1. Bump the version

Update the version number in `packages/bruno-electron/package.json`:

```json
{
  "version": "x.x.x"
}
```

### 2. Build the web app

From the repo root:

```powershell
npm run build:web
```

### 3. Build the installer

```powershell
npm run build:electron:win
```

### 4. Find the output

The installer will be at:

```
packages\bruno-electron\out\Bruno_x.x.x_x64_win.exe
```

### 5. Publish to GitHub

1. Go to the repo on GitHub and click **Releases > Draft a new release**
2. Create a new tag matching the version (e.g. `v2.1.0`)
3. Upload the `.exe` from step 4
4. Add release notes and publish
