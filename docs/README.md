# Forge - AI-Powered Therapeutic Journal

## Overview

Forge is a cross-platform desktop journaling application built with Tauri. It combines structured writing, persona-driven AI feedback, and core memory analysis in a local-first workflow with OPAL as the app backend.

## Architecture

## Frontend

- React 18 + TypeScript + Vite
- React Router (`HashRouter`) for Tauri compatibility
- Zustand for app state (`useJournal`, modules, auth integration)
- Tailwind + Radix UI + custom theme provider

## Desktop Host

- Tauri 2.x + Rust
- Starts OPAL server process on app startup in desktop mode
- Exposes runtime connection info (API/WS URLs and port) to frontend

## Backend (OPAL)

- Node.js + Express + WebSocket + MCP JSON-RPC
- REST routes for journal, notes, memories, auth, admin
- Services for personas, prompts, AI calls, metrics, backups, and audit
- Knex with SQLite (dev) / PostgreSQL (production)

## AI Stack

- AI calls are executed from OPAL tools/services
- OpenAI and Anthropic providers are supported in code paths
- Model resolution and fallback: `opal/src/services/modelRegistry.js`
- Retry/timeout handling: `opal/src/utils/retryWithBackoff.js`

## Core Features

### 1. Journaling

- Freeform entries
- Guided module sessions
- Entry metadata and management (star/archive/pin)
- AI feedback attached to entries

### 2. Guided Modules

- Modules page + module admin flow
- Step progress persisted via OPAL module tools
- Completed module sessions can be saved into Core memories

### 3. Core Memories

- Create/edit/archive/star core entries
- Tag filtering and visualization panels
- On-demand AI insights from memory context

### 4. Personas and Prompting

- Personas are database-backed and editable in Admin
- Chat and insights system prompts are configurable in Admin

### 5. Identity Profile

- Biographical and personality data for personalization
- Profile context injected into AI feedback/insight generation

### 6. Themes and Customization

- Runtime theme switching via `ThemeProvider`
- Theme definitions in `src/lib/themeConfig.ts`
- Current default: `midnight-soft`

## Project Layout

```text
forge/
├── src/                  # React app
├── src-tauri/            # Tauri (Rust host, OPAL process management)
├── opal/                 # OPAL backend server
├── docs/                 # Documentation
└── package.json          # Frontend scripts/deps
```

## Important Frontend Paths

- `src/App.tsx`: route composition and global layout
- `src/hooks/useJournal.tsx`: journal state + startup retry logic
- `src/lib/simple-opal-client.js`: MCP client
- `src/pages/AdminPage.tsx`: personas/prompts/settings
- `src/pages/CorePage.tsx`: core memories + insights

## Important Backend Paths

- `opal/src/server.js`: OPAL bootstrap and route/tool registration
- `opal/src/routes/`: REST endpoints (`journal`, `notes`, `memory`, `auth`)
- `opal/src/services/promptsService.js`: AI feedback + insights calls
- `opal/src/services/modelRegistry.js`: model validation/fallback
- `opal/src/utils/retryWithBackoff.js`: retry and timeout utility

## Build and Development

## Frontend / Desktop

```powershell
npm install
npm run tauri:dev
```

or

```powershell
start.bat
```

## OPAL (manual / web mode)

```powershell
cd opal
npm install
npx knex migrate:latest
npm start
```

## Production Build

```powershell
npm run build
npm run tauri:build
```

## Notes on Data and Security

- Journal/memory/notes/persona data persists in OPAL database.
- Auth uses JWT flows and protected routes/endpoints.
- Theme and model preferences are stored locally in the app.
- AI calls are user-triggered through feedback/insights/chat actions.

## Related Docs

- [QUICK-START.md](QUICK-START.md)
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- [CHANGELOG.md](CHANGELOG.md)
