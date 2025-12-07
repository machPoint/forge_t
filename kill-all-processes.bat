@echo off
echo ========================================
echo Killing All ForgeOpal Processes
echo ========================================
echo.

REM Kill any Node.js processes running OPAL server
echo Killing OPAL server processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq OPAL*" 2>nul
taskkill /F /IM node.exe /FI "COMMANDLINE eq *opal*server.js*" 2>nul

REM Kill any Electron processes
echo Killing Electron processes...
taskkill /F /IM electron.exe 2>nul

REM Kill any Tauri processes
echo Killing Tauri processes...
taskkill /F /IM forge.exe 2>nul

REM Kill any Vite dev servers
echo Killing Vite dev servers...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :1420') DO taskkill /F /PID %%P 2>nul
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8080') DO taskkill /F /PID %%P 2>nul

REM Kill any processes on port 3000 (OPAL server)
echo Killing processes on port 3000...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000') DO taskkill /F /PID %%P 2>nul

echo.
echo ========================================
echo All processes killed!
echo ========================================
echo.
