# Troubleshooting Guide

## Common Issues and Solutions

### 1. Port 3000 Already in Use

**Symptoms**

- OPAL fails to start
- Errors like `EADDRINUSE`

**Fix (PowerShell)**

```powershell
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

If you run OPAL manually, you can also change `MCP_PORT` in `opal/.env` and update frontend URLs accordingly.

### 2. OPAL Server Connection Failed

**Check list**

1. In Tauri mode (`npm run tauri:dev`), OPAL should be auto-started by the desktop backend.
2. In web/manual mode, start OPAL yourself:
   ```powershell
   cd opal
   npm start
   ```
3. Verify health endpoint:
   - `http://localhost:3000/health` (or your configured port)
4. Confirm firewall/AV is not blocking local Node.js traffic.

### 3. Authentication Errors (401 / missing token)

**Symptoms**

- Journal, notes, or memories fail to load/save.

**Fixes**

1. Sign out and sign back in.
2. Open DevTools and confirm requests include `Authorization: Bearer ...`.
3. If needed, clear local auth state and relaunch app.

### 4. AI Feedback or Insights Not Generating

**Check list**

1. OPAL connection status is `ready` in app.
2. API keys are configured in app settings or OPAL runtime environment.
3. Selected model is valid for the configured provider.
4. Inspect DevTools console for `get_ai_feedback` / `get_ai_insights` tool errors.

### 5. Personas Not Showing Up

Personas are database-backed and loaded via OPAL tools.

**Fixes**

1. Confirm OPAL is connected and authenticated.
2. Open `Admin > AI Personas` and refresh/recreate personas.
3. If the personas table is missing, rerun migrations:
   ```powershell
   cd opal
   npx knex migrate:latest
   ```

### 6. Theme Not Applying

**Symptoms**

- Wrong colors or theme not persisted.

**Fixes**

1. Hard refresh / restart app.
2. Remove stored theme key and reopen:
   ```javascript
   localStorage.removeItem('forge-theme-id')
   location.reload()
   ```
3. Verify `src/lib/themeConfig.ts` and `src/components/ThemeProvider.tsx` are not out of sync.

### 7. Database Migration Errors

**Reset dev database (destructive)**

```powershell
cd opal
if (Test-Path .\dev.sqlite3) { Remove-Item .\dev.sqlite3 -Force }
npx knex migrate:latest
npx knex seed:run
```

If using PostgreSQL, verify all `DB_*` environment variables.

### 8. Tauri Build Fails

**Fixes**

1. Update toolchain:
   ```powershell
   rustup update
   ```
2. Clean and rebuild:
   ```powershell
   cd src-tauri
   cargo clean
   cargo build
   ```
3. Ensure WebView2 runtime is installed on Windows.

### 9. Vite Dev Server Won't Start

**Symptoms**

- Port conflict on 1420.

**Fixes**

```powershell
netstat -ano | findstr :1420
taskkill /F /PID <PID>
```

Or change Vite port in `vite.config.ts` and keep any Tauri dev URL config in sync.

### 10. Notes / Journal / Core Entries Not Saving

These flows depend on OPAL REST endpoints and auth.

**Check list**

1. OPAL is running.
2. User is authenticated.
3. Endpoint is reachable:
   - `/journal`
   - `/notes`
   - `/core` (memory routes)
4. No backend exceptions in OPAL logs.

## Debug Workflow

1. Open DevTools (`F12`) and inspect Console + Network tabs.
2. Check OPAL server logs in the terminal running `node src/server.js`.
3. Verify app/runtime URLs from Tauri bridge commands when debugging desktop mode.
4. Reproduce with minimal steps and capture exact error text.

## Reset Application State (Destructive)

```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Then optionally reset OPAL dev DB:

```powershell
cd opal
if (Test-Path .\dev.sqlite3) { Remove-Item .\dev.sqlite3 -Force }
npx knex migrate:latest
npx knex seed:run
```

## Collect Useful Debug Info

When reporting an issue, include:

- Exact error message
- Steps to reproduce
- OS + version
- `node --version`
- `npm --version`
- `rustc --version`
- Relevant console/network logs
