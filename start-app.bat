@echo off
title SurgHistory Clinical Workstation
echo =======================================================
echo   SurgHistory Clinical Workstation v2.0
echo   Launching local server and opening browser...
echo =======================================================
start http://localhost:8000
node server.js
pause
