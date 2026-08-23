@echo off
chcp 65001 >nul
title Judo Performance System - Local Server
echo ========================================
echo   تشغيل نظام إدارة أداء لاعبي الجودو
echo ========================================
echo.

cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 goto :haspython

where python3 >nul 2>nul
if %errorlevel%==0 goto :haspython3

echo لم يتم العثور على Python على جهازك.
echo الرجاء تثبيت Python من https://www.python.org/downloads/
echo (اختر "Add Python to PATH" أثناء التثبيت)
pause
exit /b 1

:haspython
echo جاري تشغيل السيرفر المحلي على المنفذ 8080 ...
start /b "" python -m http.server 8080
timeout /t 2 /nobreak >nul
start "" http://localhost:8080/
echo.
echo السيرفر يعمل الآن. لا تغلق هذه النافذة أثناء استخدام البرنامج.
echo لإيقاف السيرفر، أغلق هذه النافذة أو اضغط Ctrl+C.
pause >nul
goto :eof

:haspython3
echo جاري تشغيل السيرفر المحلي على المنفذ 8080 ...
start /b "" python3 -m http.server 8080
timeout /t 2 /nobreak >nul
start "" http://localhost:8080/
echo.
echo السيرفر يعمل الآن. لا تغلق هذه النافذة أثناء استخدام البرنامج.
echo لإيقاف السيرفر، أغلق هذه النافذة أو اضغط Ctrl+C.
pause >nul
goto :eof
