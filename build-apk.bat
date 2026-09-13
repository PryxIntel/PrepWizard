@echo off
title PrepWizard Android APK Builder
echo ========================================================
echo            PrepWizard Android APK Builder
echo ========================================================
echo.

cd /d "%~dp0\frontend"
echo [1/3] Building web production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Syncing assets with Capacitor Android project...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Compiling native Android APK with Gradle...
cd android

if not defined JAVA_HOME (
    echo [WARNING] JAVA_HOME is not set. Looking for Java in common directories...
    if exist "C:\Program Files\Android\Android Studio\jbr" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    ) else if exist "C:\Program Files\Java\jdk-17" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-17"
    )
)

call gradlew.bat assembleDebug

if exist "app\build\outputs\apk\debug\app-debug.apk" (
    copy /y "app\build\outputs\apk\debug\app-debug.apk" "%~dp0PrepWizard.apk" >nul
    echo.
    echo ========================================================
    echo  SUCCESS! APK generated at:
    echo  %~dp0PrepWizard.apk
    echo ========================================================
) else (
    echo.
    echo [NOTE] If compilation requires Java/Android SDK, you can:
    echo 1. Open the 'frontend\android' folder in Android Studio and click Build -^> Build APK.
    echo 2. OR push to GitHub to let GitHub Actions automatically build the APK.
)

pause
