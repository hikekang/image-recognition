# Tesseract OCR 安装和配置脚本
# 以管理员权限运行

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Tesseract OCR 安装和配置" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否以管理员权限运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "错误: 请以管理员权限运行此脚本" -ForegroundColor Red
    Write-Host "右键点击 PowerShell -> 以管理员身份运行" -ForegroundColor Yellow
    pause
    exit 1
}

# 安装路径
$installPath = "C:\Program Files\Tesseract-OCR"
$setupFile = "F:\image-recognition\tesseract-setup.exe"

# 检查安装包是否存在
if (-not (Test-Path $setupFile)) {
    Write-Host "错误: 找不到安装包" -ForegroundColor Red
    Write-Host "位置: $setupFile" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[1/4] 安装 Tesseract OCR..." -ForegroundColor Yellow

# 运行安装程序
try {
    Start-Process -FilePath $setupFile -ArgumentList "/SILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/DIR=`"$installPath`"" -Wait -NoNewWindow
    Write-Host "  ✓ 安装完成" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 安装失败: $_" -ForegroundColor Red
    pause
    exit 1
}

# 添加到 PATH
Write-Host "[2/4] 配置环境变量..." -ForegroundColor Yellow

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$installPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installPath", "User")
    $env:Path = "$env:Path;$installPath"
    Write-Host "  ✓ 已添加到 PATH" -ForegroundColor Green
} else {
    Write-Host "  ✓ PATH 已配置" -ForegroundColor Green
}

# 下载中文语言包
Write-Host "[3/4] 下载中文语言包..." -ForegroundColor Yellow

$tessdataPath = "$installPath\tessdata"
$chineseUrl = "https://github.com/tesseract-ocr/tessdata/raw/main/chi_sim.traineddata"
$chineseFile = "$tessdataPath\chi_sim.traineddata"

try {
    Invoke-WebRequest -Uri $chineseUrl -OutFile $chineseFile -UseBasicParsing
    Write-Host "  ✓ 中文语言包下载完成" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ 中文语言包下载失败: $_" -ForegroundColor Yellow
    Write-Host "  手动下载: $chineseUrl" -ForegroundColor Yellow
    Write-Host "  保存到: $tessdataPath" -ForegroundColor Yellow
}

# 验证安装
Write-Host "[4/4] 验证安装..." -ForegroundColor Yellow

$tesseractExe = "$installPath\tesseract.exe"
if (Test-Path $tesseractExe) {
    Write-Host "  ✓ Tesseract 已安装" -ForegroundColor Green

    # 获取版本信息
    try {
        $version = & $tesseractExe --version 2>&1 | Select-String "tesseract"
        Write-Host "  版本: $version" -ForegroundColor Cyan
    } catch {
        Write-Host "  (无法获取版本信息)" -ForegroundColor Gray
    }

    # 检查语言包
    $engData = "$tessdataPath\eng.traineddata"
    $chiData = "$tessdataPath\chi_sim.traineddata"

    Write-Host ""
    Write-Host "语言包状态:" -ForegroundColor Cyan
    if (Test-Path $engData) {
        Write-Host "  ✓ English (eng)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ English (eng) - 缺失" -ForegroundColor Red
    }

    if (Test-Path $chiData) {
        Write-Host "  ✓ Chinese Simplified (chi_sim)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Chinese Simplified (chi_sim) - 缺失" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ 安装验证失败" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "安装完成！" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "使用方法:" -ForegroundColor Yellow
Write-Host "  1. 打开新的命令行窗口" -ForegroundColor White
Write-Host "  2. 运行: tesseract --version" -ForegroundColor White
Write-Host "  3. 测试 OCR: tesseract image.png output" -ForegroundColor White
Write-Host ""
Write-Host "在本项目中使用:" -ForegroundColor Yellow
Write-Host "  cd F:\image-recognition" -ForegroundColor White
Write-Host "  node analyze.js --ocr F:\1.png" -ForegroundColor White
Write-Host ""

pause
