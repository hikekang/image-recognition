@echo off
chcp 65001 >/dev/null
cd /d F:\image-recognition

if "%~1"=="" (
    echo 用法: local.bat F:\图片.png
    exit /b 1
)

if "%~1"=="--list" (
    node analyze.js --list %2
    exit /b 0
)

if "%~1"=="--batch" (
    node analyze.js --batch %2
    exit /b 0
)

REM 综合分析：图片信息 + OCR
echo.
echo ════════════════════════════════════════
echo   📸 图片分析
echo ════════════════════════════════════════
echo.

node analyze.js %1

echo.
echo ════════════════════════════════════════
echo   📝 OCR 文字识别
echo ════════════════════════════════════════
echo.

node windows-ocr.js %1

exit /b 0
