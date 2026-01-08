# Troubleshooting Guide

## Common Issues and Solutions

### 1. Port 3000 Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Cause:** Another instance of the OPAL server (or another application) is already running on port 3000.

**Solutions:**

**Option A: Kill the process using the helper script**
```bash
kill-port-3000.bat
```

**Option B: Manual process termination**
1. Find the process using port 3000:
   ```bash
   netstat -ano | findstr :3000
   ```
2. Note the PID (Process ID) in the last column
3. Kill the process:
   ```bash
   taskkill /F /PID <PID_NUMBER>
   ```

**Option C: Change the OPAL server port**
1. Open `opal/.env` (or create it if it doesn't exist)
2. Add or modify:
   ```
   MCP_PORT=3001
   ```
3. Update the frontend to connect to the new port in `src/lib/opal-client.ts`

### 2. CSS Import Order Error

**Error Message:**
```
@import must precede all other statements (besides @charset or empty @layer)
```

**Cause:** CSS `@import` statements must come before all other CSS rules, including Tailwind directives.

**Solution:** Fixed in `src/index.css` - the `@import './styles/global-theme.css';` statement now comes first, before font declarations and Tailwind directives.

### 3. OPAL Server Connection Failed

**Error Message:**
```
Failed to connect to OPAL server
```

**Possible Causes & Solutions:**

1. **OPAL server not running**
   - Start the OPAL server: `cd opal && npm start`
   - Or use the main `start.bat` which starts both

2. **Wrong port configuration**
   - Check `opal/.env` for `MCP_PORT` setting
   - Verify frontend `src/lib/opal-client.ts` uses matching port

3. **Firewall blocking connection**
   - Add exception for Node.js in Windows Firewall
   - Check antivirus settings

### 4. Database Migration Errors

**Error Message:**
```
Migration failed
```

**Solutions:**

1. **Reset database (development only)**
   ```bash
   cd opal
   rm dev.sqlite3
   npx knex migrate:latest
   npx knex seed:run
   ```

2. **Check migration files**
   - Verify migration files in `opal/migrations/` are intact
   - Ensure database file has write permissions

3. **PostgreSQL connection issues (production)**
   - Verify `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`
   - Test PostgreSQL connection manually

### 5. Tauri Build Errors

**Error Message:**
```
Failed to build Tauri application
```

**Solutions:**

1. **Rust toolchain not installed or outdated**
   ```bash
   rustup update
   ```

2. **Missing WebView2 (Windows)**
   - Install WebView2 Runtime: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

3. **Build dependencies missing**
   ```bash
   npm install
   cd src-tauri
   cargo build
   ```

### 6. API Key Issues

**Error Message:**
```
OpenAI API request failed: 401 Unauthorized
```

**Solutions:**

1. **Missing or invalid API key**
   - Open Admin page in app
   - Navigate to API Configuration
   - Add valid OpenAI/Anthropic/Grok API key

2. **API key not saved**
   - Check browser localStorage in DevTools
   - Key should be stored under `openai_api_key`

3. **Rate limit exceeded**
   - Check your API usage on provider's dashboard
   - Wait for rate limit reset
   - Consider upgrading API plan

### 7. Journal Entries Not Saving

**Possible Causes & Solutions:**

1. **LocalStorage full**
   - Check browser storage quota
   - Clear old/unused data
   - Export and delete old entries

2. **Browser permissions**
   - Ensure app has storage permissions
   - Try clearing cache and reloading

3. **Corrupted state**
   - Open DevTools Console
   - Clear localStorage: `localStorage.clear()`
   - Restart application

### 8. AI Feedback Not Generating

**Error Message:**
```
Failed to generate AI feedback
```

**Check:**

1. **API key configured** (see #6)
2. **Entry selected** - Must select an entry before requesting feedback
3. **Network connection** - Verify internet connectivity
4. **API service status** - Check OpenAI/Anthropic status pages
5. **Console errors** - Open DevTools and check for detailed error messages

### 9. Theme Not Applying

**Symptoms:** App looks unstyled or wrong colors

**Solutions:**

1. **CSS not loaded**
   - Hard refresh: `Ctrl + Shift + R`
   - Clear browser cache

2. **Theme file missing**
   - Verify `src/styles/global-theme.css` exists
   - Check `src/index.css` imports it correctly

3. **LocalStorage theme setting corrupted**
   ```javascript
   // In DevTools Console
   localStorage.removeItem('theme')
   location.reload()
   ```

### 10. Dev Server Won't Start

**Error Message:**
```
Port 1420 already in use
```

**Solutions:**

1. **Kill Vite dev server**
   - Find and kill Node.js process on port 1420
   - `netstat -ano | findstr :1420`
   - `taskkill /F /PID <PID>`

2. **Change Vite port**
   - Edit `vite.config.ts`:
   ```typescript
   server: {
     port: 1421 // or any available port
   }
   ```
   - Update `src-tauri/tauri.conf.json` `devUrl` to match

### 11. Windows PATH Issues

**Error Message:**
```
'cargo' is not recognized as an internal or external command
```

**Solutions:**

1. **Add Rust to PATH**
   - The `start.bat` already adds: `set PATH=%PATH%;C:\Users\X1\.cargo\bin`
   - Verify Rust is installed: `rustc --version`

2. **Reinstall Rust**
   - Download from: https://rustup.rs/
   - Follow installation wizard
   - Restart terminal/IDE

### 12. Module Not Loading

**Symptoms:** Guided modules don't appear or won't start

**Solutions:**

1. **Module definition error**
   - Check `src/lib/modules.ts` for syntax errors
   - Verify module IDs are unique

2. **State management issue**
   - Clear module state: `localStorage.removeItem('selectedModule')`
   - Reload application

## Getting More Help

### Enable Debug Mode

1. Open DevTools: `Ctrl + Shift + I` or `F12`
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application > Local Storage for state

### Collect Debug Information

When reporting issues, include:
- Error message (full text)
- Console logs (from DevTools)
- Steps to reproduce
- Operating system and version
- Node.js version: `node --version`
- npm version: `npm --version`
- Rust version: `rustc --version`

### Log Files

**OPAL Server Logs:**
- Located in `opal/logs/` (if configured)
- Console output when running `npm start`

**Tauri Logs:**
- Console output from `npm run tauri:dev`
- Rust build errors appear here

### Reset Application to Defaults

**Warning: This will delete all user data!**

```javascript
// In DevTools Console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Then restart OPAL server:
```bash
cd opal
rm dev.sqlite3
npx knex migrate:latest
npx knex seed:run
```

## Performance Issues

### Slow AI Response Times

1. **Try smaller model** (e.g., GPT-4o-mini instead of GPT-4o)
2. **Check network speed**
3. **Reduce entry length** (very long entries take longer to process)

### High Memory Usage

1. **Too many entries loaded** - Archive or export old entries
2. **Memory leak** - Restart application
3. **Browser DevTools open** - Close when not debugging

### Slow Application Startup

1. **Large database** - Clean up old data
2. **Theme initialization slow** - Simplify custom themes
3. **Too many modules** - Disable unused modules

## Contact & Support

For additional help:
- GitHub Issues: [Create an issue](https://github.com/yourorg/forge/issues)
- Email: support@forge.app
- Documentation: Check `docs/README.md`
