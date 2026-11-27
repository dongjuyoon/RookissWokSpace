@echo off
setlocal
cd /d "%~dp0"
title RookissAI WorkSpace - dev server

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install the LTS version from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [INFO] node_modules not found. Installing packages...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo [INFO] Starting dev server at http://localhost:3000
echo [INFO] Press Ctrl+C in this window to stop the server.
start "" cmd /c "ping -n 6 127.0.0.1 >nul & start http://localhost:3000"
call npm run dev

echo.
echo [INFO] Server stopped.
pause
