@echo off
title Mango Disease Prediction - Local Development

echo.
echo ==========================================
echo      MANGO DISEASE PREDICTION APP
echo ==========================================
echo.

cd /d P:\mango-disease-prediction

echo [1/2] Starting FastAPI Backend...
start "Mango Backend - FastAPI" cmd /k "cd /d P:\mango-disease-prediction && call .venv\Scripts\activate.bat && python main.py"

timeout /t 5 /nobreak >nul

echo [2/2] Starting Next.js Frontend...
start "Mango Frontend - Next.js" cmd /k "cd /d P:\mango-disease-prediction\frontend && npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo ==========================================
echo       MANGO APP IS RUNNING
echo ==========================================
echo.
echo Frontend : http://localhost:3000
echo Backend  : http://localhost:8000
echo API Docs : http://localhost:8000/docs
echo.

start http://localhost:3000

exit