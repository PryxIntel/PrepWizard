@echo off
title PrepWizard Shutdown
echo ========================================================
echo             Stopping PrepWizard Services
echo ========================================================
echo.

echo Freeing port 5000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Freeing port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All PrepWizard services have been stopped.
timeout /t 3 >nul
exit
