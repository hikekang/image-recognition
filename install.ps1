# Tesseract OCR 快速安装脚本
# 保存为 install.ps1，以管理员权限运行

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Tesseract OCR 快速安装" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 安装配置
$installDir = "C:\Program Files\Tesseract-OCR"
$setupFile = "F:\image-recognition\tesseract-setup.exe"
$tessdataDir = "$installDir\tessdata"

# 检查安装包
if (-not (Test-Path $setupFile)) {
    Write-Host "错误: 找不到安装包" -ForegroundColor Red
    Write-Host "位置: $setupFile" -ForegroundColor Yellow
    Read-Host "按 Enter 退出"
    exit 1
}

# 检查是否已安装
if (Test-Path "$installDir\tesseract.exe") {
    Write-Host "Tesseract 已安装在: $installDir" -ForegroundColor Green
    Write-Host ""

    # 检查版本
    try {
        $version = & "$installDir\tesseract.exe" --version 2>&1 | Select-String "tesseract"
        Write-Host "版本: $version" -ForegroundColor Cyan
    } catch {}

    Write-Host ""
    $reinstall = Read-Host "是否重新安装？(y/N)"
    if ($reinstall -ne "y" -and $reinstall -ne "Y") {
        Write-Host "跳过安装，直接配置..." -ForegroundColor Yellow
    } else {
        # 卸载旧版本
        Write-Host "卸载旧版本..." -ForegroundColor Yellow
        Start-Process -FilePath "$installDir\unins000.exe" -ArgumentList "/SILENT" -Wait -ErrorAction SilentlyContinue
    }
}

# 安装 Tesseract
Write-Host ""
Write-Host "[1/3] 安装 Tesseract OCR..." -ForegroundColor Yellow
Write-Host "  安装目录: $installDir" -ForegroundColor Gray

try {
    $process = Start-Process -FilePath $setupFile -ArgumentList "/SILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/DIR=`"$installDir`"" -Wait -PassThru -NoNewWindow

    if ($process.ExitCode -eq 0) {
        Write-Host "  ✓ 安装成功" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ 安装完成，退出代码: $($process.ExitCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ 安装失败: $_" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

# 配置环境变量
Write-Host ""
Write-Host "[2/3] 配置环境变量..." -ForegroundColor Yellow

try {
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

    if ($currentPath -notlike "*$installDir*") {
        $newPath = "$currentPath;$installDir"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        $env:Path = "$env:Path;$installDir"
        Write-Host "  ✓ 已添加到 PATH" -ForegroundColor Green
    } else {
        Write-Host "  ✓ PATH 已配置" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠ PATH 配置失败，请手动添加" -ForegroundColor Yellow
    Write-Host "    路径: $installDir" -ForegroundColor Gray
}

# 下载中文语言包
Write-Host ""
Write-Host "[3/3] 配置中文语言包..." -ForegroundColor Yellow

$chiSimFile = "$tessdataDir\chi_sim.traineddata"

if (Test-Path $chiSimFile) {
    Write-Host "  ✓ 中文语言包已存在" -ForegroundColor Green
} else {
    Write-Host "  正在下载中文语言包..." -ForegroundColor Gray

    try {
        $chiUrl = "https://github.com/tesseract-ocr/tessdata/raw/main/chi_sim.traineddata"
        Invoke-WebRequest -Uri $chiUrl -OutFile $chiSimFile -UseBasicParsing
        Write-Host "  ✓ 中文语言包下载完成" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ 下载失败，请手动下载" -ForegroundColor Yellow
        Write-Host "    URL: $chiUrl" -ForegroundColor Gray
        Write-Host "    保存到: $tessdataDir" -ForegroundColor Gray
    }
}

# 验证安装
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   安装验证" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$tesseractExe = "$installDir\tesseract.exe"

if (Test-Path $tesseractExe) {
    Write-Host "✓ Tesseract 已安装" -ForegroundColor Green
    Write-Host "  路径: $tesseractExe" -ForegroundColor Gray

    # 显示版本
    try {
        $versionOutput = & $tesseractExe --version 2>&1
        Write-Host ""
        Write-Host "版本信息:" -ForegroundColor Cyan
        $versionOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    } catch {}

    # 检查语言包
    Write-Host ""
    Write-Host "语言包:" -ForegroundColor Cyan

    $engFile = "$tessdataDir\eng.traineddata"
    if (Test-Path $engFile) {
        Write-Host "  ✓ English (eng)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ English (eng) - 缺失" -ForegroundColor Red
    }

    if (Test-Path $chiSimFile) {
        Write-Host "  ✓ 中文简体 (chi_sim)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 中文简体 (chi_sim) - 缺失" -ForegroundColor Red
    }

} else {
    Write-Host "✗ 安装验证失败" -ForegroundColor Red
}

# 完成
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "使用方法:" -ForegroundColor Yellow
Write-Host "  1. 打开新的命令行窗口" -ForegroundColor White
Write-Host "  2. 测试: tesseract --version" -ForegroundColor White
Write-Host "  3. OCR: tesseract image.png output -l chi_sim+eng" -ForegroundColor White
Write-Host ""
Write-Host "在本项目中使用:" -ForegroundColor Yellow
Write-Host "  cd F:\image-recognition" -ForegroundColor White
Write-Host "  node analyze.js --ocr F:\1.png" -ForegroundColor White
Write-Host ""

Read-Host "按 Enter 完成安装"
