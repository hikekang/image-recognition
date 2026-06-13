const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * 使用 Windows 10/11 内置 OCR 提取文字
 */
function extractTextWithWindowsOCR(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      return { success: false, error: `文件不存在: ${imagePath}` };
    }

    // 转换路径为 Windows 格式
    const winPath = imagePath.replace(/\//g, "\\");

    // PowerShell 脚本使用 Windows OCR
    const psScript = `
      Add-Type -AssemblyName System.Drawing
      Add-Type -AssemblyName PresentationCore
      Add-Type -AssemblyName WindowsBase

      # 读取图片
      $img = [System.Drawing.Image]::FromFile('${winPath}')
      $bitmap = New-Object System.Drawing.Bitmap $img

      # 保存为临时文件
      $tempFile = [System.IO.Path]::GetTempFileName() + ".png"
      $bitmap.Save($tempFile, [System.Drawing.Imaging.ImageFormat]::Png)

      # 使用 Windows OCR
      try {
        $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()

        if ($ocrEngine) {
          # 读取图片为流
          $fileStream = [System.IO.File]::OpenRead($tempFile)
          $decoder = [System.Windows.Media.Imaging.PngBitmapDecoder]::new(
            $fileStream,
            [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
            [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
          )
          $bitmapSource = $decoder.Frames[0]

          # 转换为 SoftwareBitmap
          $softwareBitmap = [Windows.Graphics.Imaging.SoftwareBitmap]::CreateCopyFromBuffer(
            $bitmapSource.PixelBuffer,
            [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,
            $bitmapSource.PixelWidth,
            $bitmapSource.PixelHeight
          )

          # OCR 识别
          $result = $ocrEngine.RecognizeAsync($softwareBitmap).GetAwaiter().GetResult()
          Write-Output $result.Text

          $fileStream.Close()
        } else {
          Write-Output "ERROR: Windows OCR 引擎不可用"
        }
      } catch {
        Write-Output "ERROR: $($_.Exception.Message)"
      }

      # 清理
      $bitmap.Dispose()
      $img.Dispose()
      Remove-Item $tempFile -ErrorAction SilentlyContinue
    `;

    const result = execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    }).trim();

    if (result.startsWith("ERROR:")) {
      return { success: false, error: result.replace("ERROR: ", "") };
    }

    return { success: true, text: result, method: "Windows OCR" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 获取图片信息
 */
function getImageInfo(imagePath) {
  try {
    const stats = fs.statSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();

    return {
      path: imagePath,
      name: path.basename(imagePath),
      ext: ext,
      size: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
      lastModified: stats.mtime.toISOString(),
    };
  } catch (error) {
    return null;
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║        Windows OCR 文字识别工具                            ║
╠════════════════════════════════════════════════════════════╣
║  无需安装，使用 Windows 10/11 内置 OCR                    ║
╚════════════════════════════════════════════════════════════╝

用法:
  node windows-ocr.js <图片路径>

示例:
  node windows-ocr.js F:\\screenshot.png
  node windows-ocr.js F:\\1.png
    `);
    return;
  }

  const imagePath = args[0];

  console.log("\n" + "=".repeat(60));
  console.log("📝 Windows OCR 文字识别");
  console.log("=".repeat(60));

  // 获取图片信息
  const info = getImageInfo(imagePath);
  if (!info) {
    console.log(`\n✗ 错误: 文件不存在 - ${imagePath}`);
    process.exit(1);
  }

  console.log(`\n📸 图片信息:`);
  console.log(`  文件: ${info.name}`);
  console.log(`  大小: ${info.sizeFormatted}`);
  console.log(`  格式: ${info.ext}`);

  // OCR 识别
  console.log(`\n🔍 正在识别文字...`);

  const result = extractTextWithWindowsOCR(imagePath);

  if (result.success) {
    console.log(`\n✓ 识别成功 (方法: ${result.method})\n`);
    console.log("-".repeat(60));
    console.log(result.text);
    console.log("-".repeat(60));
    console.log(`\n📊 统计: ${result.text.length} 字符`);
  } else {
    console.log(`\n✗ 识别失败: ${result.error}`);
    console.log(`\n💡 提示:`);
    console.log(`  - 确保 Windows 版本为 10 或 11`);
    console.log(`  - 确保图片清晰可读`);
    console.log(`  - 支持 PNG, JPG, BMP 格式`);
  }

  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);
