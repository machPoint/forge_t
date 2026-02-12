@echo off
echo Starting Forge Tauri Dev Mode...
echo.
echo This will launch the app with hot-reload enabled.
echo Frontend changes will update instantly without rebuilding.
echo.
set PATH=%PATH%;C:\Users\X1\.cargo\bin
npm run tauri dev
pause
