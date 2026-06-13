@echo off
chcp 65001 >/dev/null

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║        Tesseract OCR 安装程序                              ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║  正在以管理员权限运行安装脚本...                           ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM 检查管理员权限
net session >/dev/null 2>&1
if %errorlevel% neq 0 (
    echo 错误: 需要管理员权限
    echo.
    echo 请右键点击此文件，选择"以管理员身份运行"
    echo.
    pause
    exit /b 1
)

REM 运行 PowerShell 安装脚本
powershell -ExecutionPolicy Bypass -File "F:\image-recognition\install-tesseract.ps1"

exit /b 0
