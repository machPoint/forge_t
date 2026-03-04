# Quick Start Guide

## Prerequisites

Before running Forge, install:

- Node.js 18+
- Rust (latest stable via `rustup`)
- npm (bundled with Node.js)
- WebView2 runtime (Windows; usually already installed)

## Install Dependencies

From the repo root:

```powershell
npm install
cd opal
npm install
cd ..
```

## Optional: Create OPAL `.env`

Desktop (Tauri) mode injects most runtime config automatically, so this is mainly needed for running OPAL directly.

```powershell
Copy-Item opal/env.sample opal/.env
```

If you plan to run frontend + OPAL manually, set `MCP_PORT=3000` in `opal/.env` so defaults line up.

## Run the App

### Option A: Desktop Mode (Recommended)

Use either command from the repo root:

```powershell
start.bat
```

or

```powershell
npm run tauri:dev
```

In this mode, Tauri starts the OPAL server process for you.

### Option B: Web Dev Mode (Frontend + OPAL separately)

Terminal 1:

```powershell
cd opal
npm start
```

Terminal 2:

```powershell
npm run dev
```

Then open `http://localhost:1420`.

## First-Time Setup In App

1. Sign in (or create an account) when prompted.
2. Open `Admin` to configure personas, prompts, and connection settings.
3. Open `Customizations` to choose a theme.
4. Open `Profile` to add identity data used for personalized AI responses.

## Basic Usage

### Create a Journal Entry

1. Go to `Journal`.
2. Create or select an entry.
3. Write content and save.

### Request AI Feedback

1. Select a saved entry.
2. Trigger AI feedback.
3. Feedback appears in the flyout and is saved with the entry.

### Use Guided Modules

1. Go to `Modules`.
2. Choose a module.
3. Complete steps; progress is tracked and can be saved to Core.

### Manage Core Entries

1. Go to `Core`.
2. Add, edit, star, archive, and analyze memories.
3. Use the Insights tab to generate AI insights on demand.

## Common Fixes

### Port Already In Use

Find and stop the process:

```powershell
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### Reset OPAL Development Database (Destructive)

```powershell
cd opal
if (Test-Path .\dev.sqlite3) { Remove-Item .\dev.sqlite3 -Force }
npx knex migrate:latest
npx knex seed:run
npm start
```

### Tauri Build Issues

```powershell
rustup update
cd src-tauri
cargo clean
cargo build
```

## Development Workflow

### Frontend Changes

- Edit `src/` files.
- Vite hot-reloads in dev mode.

### OPAL Backend Changes

- Edit `opal/src/` files.
- Restart OPAL (`Ctrl+C`, then `npm start`) when running web/manual mode.
- In Tauri mode, restart `npm run tauri:dev` after backend-only changes if needed.

### Production Build

```powershell
npm run build
npm run tauri:build
```

Output bundles are under `src-tauri/target/release/bundle/`.

## Next

- Project overview: `docs/README.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`
- Changelog: `docs/CHANGELOG.md`
