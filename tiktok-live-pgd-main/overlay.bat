@echo off
rem Mo cua so chua cho LIVE Studio quay: dung overlay.bat cua kit (o thu muc ben canh).
if not defined KIT_DIR set "KIT_DIR=%~dp0..\tiktok-live-kit"
call "%KIT_DIR%\overlay.bat"
