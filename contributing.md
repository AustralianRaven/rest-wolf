
# Running Locally

## How to Run Locally

```bash
# install dependencies and setup
npm i --legacy-peer-deps
npm run setup
```

```bash
# run react app (terminal 1)
npm run dev:web

# run electron app (terminal 2)
npm run dev:electron
```

## Making an .exe

This option is for creating an unpacked version.

```bash
npm run build:web
# You should find the exe and other required files in <the repos dir>\packages\bruno-electron\out\win-unpacked
```

This option is for creating a portable exe version.

```bash
# Run this in a powershell terminal as a admin.
node ./scripts/build-electron.js
# You should find the exe in <the repos dir>\packages\bruno-electron\out
```
