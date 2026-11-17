@echo off
cd /d "%~dp0"
py -3 -m pip install Pillow
if errorlevel 1 (echo Python or Pillow installation failed & pause & exit /b 1)
where ffmpeg >nul 2>nul
if errorlevel 1 (echo FFmpeg is required on PATH & pause & exit /b 1)
start http://127.0.0.1:8890
py -3 studio.py
pause
