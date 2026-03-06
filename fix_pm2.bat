@echo off
title PM2 Auto-Start Fix Script (Windows)
echo ==========================================
echo        FIXING PM2 / NODE ISSUES
echo ==========================================
echo.

echo Killing stuck Node and PM2 processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM pm2.exe >nul 2>&1
echo Done.
echo.

echo Removing old PM2 cache...
rd /s /q "C:\Users\DELL\.pm2"
echo Done.
echo.

echo Reinstalling PM2...
npm uninstall -g pm2 >nul 2>&1
npm install -g pm2
pm2 update
echo Done.
echo.

echo Navigating to CMSCRM project...
cd /d "C:\Users\DELL\Downloads\CMSCRM (1)\CMSCRM"
echo Done.
echo.

echo Starting CMSCRM backend...
pm2 start ecosystem.config.cjs
echo Done.
echo.

echo Saving PM2 process list...
pm2 save
echo Done.
echo.

echo ==========================================
echo   NOTE: On Windows, 'pm2 startup' fails.
echo   Use Task Scheduler (pm2 resurrect) OR
echo   install pm2-windows-startup.
echo ==========================================
pause