@echo off
title College Event Presenter Management System
echo ============================================================
echo   STARTING COLLEGE EVENT PRESENTER MANAGEMENT SYSTEM
echo ============================================================
echo.
cd /d "%~dp0"
echo Starting backend server on http://localhost:5000...
start http://localhost:5000
node backend/server.js
pause
