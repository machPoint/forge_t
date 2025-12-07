@echo off
echo ===================================
echo OPAL Server Startup Script
echo ===================================
echo.

:: Set environment variables
set NODE_ENV=development
set MCP_PORT=3000
set DB_FILE=c:\Users\X1\PROJECT\OPAL\database\opal.sqlite3

:: Check if port 3000 is already in use and use a different port if needed
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo Port 3000 is already in use, trying port 3001...
    set MCP_PORT=3001
    
    :: Check if port 3001 is also in use
    netstat -ano | findstr :3001 > nul
    if %errorlevel% equ 0 (
        echo Port 3001 is also in use, trying port 3002...
        set MCP_PORT=3002
    )
)

:: Set MCP-specific environment variables
set MCP_PROTOCOL_VERSION=1.0
set MCP_SERVER_NAME=OPAL MCP Server
set MCP_SERVER_VERSION=1.0.0

:: Rate limiting configuration
set MCP_RATE_LIMIT_WINDOW=60000
set MCP_RATE_LIMIT_MAX_REQUESTS=100

:: API integration configuration
set MCP_API_COUNT=1
set MCP_API_0_NAME=OpenAI
set MCP_API_0_BASE_URL=https://api.openai.com/v1
set MCP_API_0_AUTH_TYPE=bearer_token
set MCP_API_0_AUTH_VALUE=your_openai_key

:: Check if the OPAL server is already running
echo Checking if OPAL server is already running...
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo WARNING: Port 3000 is already in use!
    echo Please close any existing OPAL server instances first.
    echo.
    choice /C YN /M "Do you want to force close any processes using port 3000"
    if errorlevel 2 goto :EOF
    if errorlevel 1 (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
            echo Terminating process with PID: %%a
            taskkill /F /PID %%a
        )
    )
)

:: Create database directory if it doesn't exist
if not exist "c:\Users\X1\PROJECT\OPAL\database" (
    echo Creating database directory...
    mkdir "c:\Users\X1\PROJECT\OPAL\database"
)

:: Ensure database has correct permissions
echo Ensuring database has correct permissions...
if exist "%DB_FILE%" (
    echo Database file exists at: %DB_FILE%
    attrib -R "%DB_FILE%"
) else (
    echo Database file does not exist yet, it will be created on first run.
)

:: Change to the OPAL server directory
cd c:\Users\X1\PROJECT\OPAL

:: Run database fixes if needed
echo Checking database configuration...
if exist "%DB_FILE%" (
    echo Running database persistence fixes...
    node scripts/fix-database-persistence.js
    if %errorlevel% neq 0 (
        echo WARNING: Database fix script failed, but continuing with server startup.
    )
)

:: Start the OPAL server
echo.
echo Starting OPAL server...
echo.
echo Server will be available at:
echo - HTTP: http://localhost:3000/mcp
echo - WebSocket: ws://localhost:3000
echo.
echo MCP Protocol Version: %MCP_PROTOCOL_VERSION%
echo Server Name: %MCP_SERVER_NAME%
echo Server Version: %MCP_SERVER_VERSION%
echo.
echo Press Ctrl+C to stop the server
echo ===================================
echo.

:: Start the OPAL server directly with Node.js
echo Starting server with Node.js...
node src/server.js

echo.
echo OPAL server has stopped.
pause
