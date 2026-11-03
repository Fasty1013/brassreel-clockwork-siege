@echo off
title BRASSREEL: Clockwork Siege
cd /d "%~dp0"

:: 1. Ensure dist/index.html is ready
if not exist "dist\index.html" (
    echo [BRASSREEL] Dist missing, building web bundle...
    call npm run build
)

:: 2. Launch native standalone executable
if exist "BRASSREEL.exe" (
    start "" "BRASSREEL.exe"
    exit /b 0
)

:: 3. Fallback if executable is absent
echo [BRASSREEL] Executable not found, starting browser preview...
start "" "http://127.0.0.1:4173/"
npm run preview
