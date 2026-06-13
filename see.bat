@echo off
chcp 65001 >/dev/null
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           Image Recognition - 快速启动                    ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║  使用方法:                                                 ║
echo ║    see.bat ^<图片路径^>                                      ║
echo ║    see.bat --list ^<目录^>                                   ║
echo ║    see.bat --help                                          ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

if "%~1"=="" (
    echo 用法: see.bat F:\screenshot.png
    echo.
    echo 示例:
    echo   see.bat F:\1.png
    echo   see.bat F:\screenshot.png "这是什么内容？"
    echo   see.bat --list F:\
    echo.
    exit /b 1
)

if "%~1"=="--help" (
    echo 用法: see.bat ^<图片路径^> [自定义提示词]
    echo.
    echo 示例:
    echo   see.bat F:\screenshot.png
    echo   see.bat F:\image.jpg "描述图片中的文字"
    echo   see.bat --list F:\
    echo.
    exit /b 0
)

if "%~1"=="--list" (
    cd /d F:\image-recognition
    node recognize.js --list "%~2"
    exit /b 0
)

cd /d F:\image-recognition
node recognize.js "%~1" "%~2"

exit /b 0
