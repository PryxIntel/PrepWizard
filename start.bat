@echo off
title PrepWizard Launcher
echo ========================================================
echo             Launching PrepWizard CBT Platform
echo ========================================================
echo.

echo [1/3] Starting Backend API & Exam Engines (Port 5000)...
start "PrepWizard Backend" /min cmd /c "cd /d %~dp0backend && npm run dev"

echo [2/3] Starting Frontend CBT Interface (Port 5173)...
start "PrepWizard Frontend" /min cmd /c "cd /d %~dp0frontend && npm run dev"

echo [3/3] Initializing servers...
timeout /t 3 /nobreak >nul

echo.
echo Opening PrepWizard in your browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo   PrepWizard is now active and ready!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000/api/health
echo.
echo   Account Setup:
echo   - Register your personal candidate profile on the sign-in screen
echo   - Admin Access: admin@prepwizard.com / PrepWizard@2026
echo.
echo   (To stop the servers later, double-click 'stop.bat')
echo ========================================================
echo.
timeout /t 5 >nul
exit
