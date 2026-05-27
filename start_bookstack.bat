@echo off
echo ===================================================
echo Starting BookStack Application Servers
echo ===================================================
echo.

echo 1. Starting Python Flask Backend Server...
start "BookStack Backend" cmd /k "cd /d D:\BookStack\backend && echo Starting Backend... && venv\Scripts\activate && python run.py"

echo 2. Starting React Vite Frontend Server...
start "BookStack Frontend" cmd /k "cd /d D:\BookStack\frontend-react && echo Starting Frontend... && npm run dev"

echo.
echo ===================================================
echo BookStack is starting up!
echo Two new terminal windows have been opened for the servers.
echo You can access the app at: http://localhost:5173
echo ===================================================
pause
