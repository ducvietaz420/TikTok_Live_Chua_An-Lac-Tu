@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo =======================================
echo        CHUA AO - TIKTOK LIVE
echo =======================================

rem Bo kit (engine) nam canh repo nay. Dat bien KIT_DIR neu de cho khac.
if not defined KIT_DIR if exist "..\tiktok-live-kit\src\server.js" set "KIT_DIR=..\tiktok-live-kit"
if not defined KIT_DIR (
  echo [LOI] Khong thay TikTok Live Kit. Clone duycuf/tiktok-live-kit vao thu muc canh day
  echo       hoac dat bien KIT_DIR tro toi no.
  pause
  exit /b 1
)
for %%i in ("%KIT_DIR%") do set "KIT_DIR=%%~fi"

set "KIT_THEMES_DIR=%~dp0themes"
set "KIT_DATA_DIR=%~dp0data"
set "KIT_CONFIG=%~dp0config.json"

where node >nul 2>&1
if errorlevel 1 (
  echo [LOI] Chua cai Node.js 20 tro len: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "%KIT_DIR%\node_modules\ws\package.json" (
  echo [LOI] Kit chua cai thu vien. Chay run.bat trong "%KIT_DIR%" mot lan truoc.
  pause
  exit /b 1
)

powershell -NoProfile -Command "try { $h = Invoke-RestMethod -Uri 'http://127.0.0.1:3939/api/health' -TimeoutSec 2; if ($h.app -eq 'tiktok-live-kit') { exit 0 } } catch {}; exit 1" >nul 2>&1
if not errorlevel 1 (
  echo Server dang chay san o cong 3939. Tat cua so do roi chay lai neu no la kit khac.
  goto :open
)

echo Dang khoi dong (kit: %KIT_DIR%)...
start "Chua ao - TikTok Live" cmd /k "node "%KIT_DIR%\src\server.js""
for /l %%i in (1,1,20) do (
  powershell -NoProfile -Command "try { Invoke-RestMethod -Uri 'http://127.0.0.1:3939/api/health' -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 goto :open
  ping 127.0.0.1 -n 2 >nul
)
echo [LOI] Server khong len sau 20 giay. Xem cua so "Chua ao - TikTok Live".
pause
exit /b 1

:open
start "" "http://localhost:3939/"
echo.
echo Bang dieu khien: http://localhost:3939/
echo Overlay cho OBS:  http://localhost:3939/overlay  (1080 x 1920)
exit /b 0
