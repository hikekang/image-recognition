@echo off
chcp 65001 >nul

echo.
echo ========================================
echo   Tesseract OCR 快速安装
echo ========================================
echo.

echo [1/2] 正在安装 Tesseract...
echo.

REM 运行安装程序
start /wait "" "F:\image-recognition\tesseract-setup.exe" /SILENT /SUPPRESSMSGBOXES /NORESTART /DIR="C:\Program Files\Tesseract-OCR"

echo.
echo [2/2] 配置环境变量...
echo.

REM 添加到 PATH
setx PATH "%PATH%;C:\Program Files\Tesseract-OCR" /M >nul 2>&1

if exist "C:\Program Files\Tesseract-OCR\tesseract.exe" (
    echo ✓ Tesseract 安装成功！
    echo.
    echo 安装位置: C:\Program Files\Tesseract-OCR
    echo.
    echo 请重新打开命令行窗口，然后运行:
    echo   cd F:\image-recognition
    echo   local.bat F:\1.png
) else (
    echo ✗ 安装可能未完成，请检查
)

echo.
pause
