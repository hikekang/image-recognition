const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

/**
 * 使用 Windows 内置工具提取图片信息
 */
function getImageInfo(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`文件不存在: ${imagePath}`);
    }

    const stats = fs.statSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const basename = path.basename(imagePath);

    // 获取图片尺寸（使用 Windows 内置工具）
    let dimensions = { width: 0, height: 0 };

    try {
      // 使用 PowerShell 获取图片尺寸
      const psCommand = `
        Add-Type -AssemblyName System.Drawing
        $img = [System.Drawing.Image]::FromFile('${imagePath.replace(/'/g, "''")}')
        Write-Output "$($img.Width)x$($img.Height)"
        $img.Dispose()
      `;

      const result = execSync(`powershell -Command "${psCommand.replace(/"/g, '\\"')}"`, {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();

      const [width, height] = result.split("x").map(Number);
      dimensions = { width, height };
    } catch (e) {
      // 如果 PowerShell 失败，尝试其他方法
      console.log("  (无法获取图片尺寸)");
    }

    return {
      success: true,
      path: imagePath,
      name: basename,
      ext: ext,
      size: stats.size,
      sizeFormatted: formatSize(stats.size),
      dimensions: dimensions,
      lastModified: stats.mtime.toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

/**
 * 使用 Tesseract OCR 提取文字（如果安装了的话）
 */
function extractTextWithTesseract(imagePath) {
  try {
    // Tesseract 完整路径
    const tesseractPath = "C:\\Program Files\\Tesseract-OCR\\tesseract.exe";

    // 检查是否安装了 Tesseract
    if (!fs.existsSync(tesseractPath)) {
      return {
        success: false,
        error: "Tesseract 未安装",
        suggestion: "安装 Tesseract: https://github.com/UB-Mannheim/tesseract/wiki",
      };
    }

    // 使用 Tesseract 提取文字（中英文）
    const result = execSync(`"${tesseractPath}" "${imagePath}" stdout -l chi_sim+eng`, {
      encoding: "utf-8",
      timeout: 30000,
    });

    return {
      success: true,
      text: result.trim(),
      method: "tesseract",
    };
  } catch (error) {
    return {
      success: false,
      error: "Tesseract 识别失败: " + error.message,
      suggestion: "确保图片清晰且格式正确",
    };
  }
}

/**
 * 使用 Windows OCR（需要 Windows 10+）
 */
function extractTextWithWindowsOCR(imagePath) {
  try {
    const psCommand = `
      Add-Type -AssemblyName System.Drawing
      Add-Type -AssemblyName System.Windows.Forms

      $img = [System.Drawing.Image]::FromFile('${imagePath.replace(/'/g, "''")}')

      # 创建 Windows OCR 引擎（仅 Windows 10+ 支持）
      try {
        $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
        if ($ocrEngine) {
          # 需要将图片转换为 Windows.Media.Imaging.SoftwareBitmap
          Write-Output "Windows OCR 可用，但需要额外配置"
        } else {
          Write-Output "Windows OCR 不可用"
        }
      } catch {
        Write-Output "Windows OCR 不支持"
      }

      $img.Dispose()
    `;

    const result = execSync(`powershell -Command "${psCommand.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
      timeout: 10000,
    }).trim();

    return {
      success: false,
      error: result,
      suggestion: "Windows OCR 需要额外配置，建议使用 Tesseract",
    };
  } catch (error) {
    return {
      success: false,
      error: "Windows OCR 不可用",
      suggestion: "安装 Tesseract: https://github.com/UB-Mannheim/tesseract/wiki",
    };
  }
}

/**
 * 分析图片内容（基于文件名和元数据）
 */
function analyzeImageContext(imagePath) {
  const info = getImageInfo(imagePath);
  if (!info.success) return null;

  const analysis = {
    ...info,
    possibleContent: [],
    suggestions: [],
  };

  // 根据文件名推断内容
  const filename = info.name.toLowerCase();

  if (filename.includes("screenshot") || filename.includes("截图")) {
    analysis.possibleContent.push("截图");
    analysis.suggestions.push("可能是屏幕截图，包含界面元素");
  }

  if (filename.includes("error") || filename.includes("错误")) {
    analysis.possibleContent.push("错误信息");
    analysis.suggestions.push("可能包含错误提示或异常信息");
  }

  if (filename.includes("charles") || filename.includes("fiddler") || filename.includes("抓包")) {
    analysis.possibleContent.push("网络抓包");
    analysis.suggestions.push("可能是 HTTP/HTTPS 抓包工具的截图");
  }

  if (filename.includes("code") || filename.includes("代码")) {
    analysis.possibleContent.push("代码");
    analysis.suggestions.push("可能包含源代码或编程相关内容");
  }

  if (filename.includes("ui") || filename.includes("界面") || filename.includes("design")) {
    analysis.possibleContent.push("UI 设计");
    analysis.suggestions.push("可能是用户界面设计或原型图");
  }

  // 根据尺寸推断
  if (info.dimensions.width > 0 && info.dimensions.height > 0) {
    const ratio = info.dimensions.width / info.dimensions.height;

    if (ratio > 1.5) {
      analysis.suggestions.push("宽屏比例，可能是横屏截图或视频帧");
    } else if (ratio < 0.7) {
      analysis.suggestions.push("竖屏比例，可能是手机截图");
    }

    if (info.dimensions.width >= 1920) {
      analysis.suggestions.push("高分辨率，可能是桌面截图");
    } else if (info.dimensions.width <= 720) {
      analysis.suggestions.push("低分辨率，可能是移动设备截图");
    }
  }

  return analysis;
}

/**
 * 生成图片描述（基于元数据分析）
 */
function generateDescription(imagePath) {
  const analysis = analyzeImageContext(imagePath);
  if (!analysis) {
    return {
      success: false,
      error: "无法分析图片",
    };
  }

  let description = `📸 图片信息:\n`;
  description += `  文件: ${analysis.name}\n`;
  description += `  路径: ${analysis.path}\n`;
  description += `  大小: ${analysis.sizeFormatted}\n`;
  description += `  格式: ${analysis.ext}\n`;

  if (analysis.dimensions.width > 0) {
    description += `  尺寸: ${analysis.dimensions.width} x ${analysis.dimensions.height}\n`;
  }

  description += `  修改时间: ${analysis.lastModified}\n`;

  if (analysis.possibleContent.length > 0) {
    description += `\n🔍 可能的内容类型:\n`;
    analysis.possibleContent.forEach((type) => {
      description += `  - ${type}\n`;
    });
  }

  if (analysis.suggestions.length > 0) {
    description += `\n💡 分析建议:\n`;
    analysis.suggestions.forEach((suggestion) => {
      description += `  - ${suggestion}\n`;
    });
  }

  // 尝试 OCR
  description += `\n📝 文字识别:\n`;

  const tesseractResult = extractTextWithTesseract(imagePath);
  if (tesseractResult.success) {
    description += `  ✓ 使用 Tesseract 识别成功\n`;
    description += `  识别结果:\n${tesseractResult.text}\n`;
  } else {
    description += `  ✗ Tesseract: ${tesseractResult.error}\n`;
    if (tesseractResult.suggestion) {
      description += `  💡 ${tesseractResult.suggestion}\n`;
    }
  }

  return {
    success: true,
    description: description,
    analysis: analysis,
  };
}

/**
 * 批量分析图片
 */
function batchAnalyze(imagePaths) {
  const results = [];

  for (const imagePath of imagePaths) {
    try {
      const result = generateDescription(imagePath);
      results.push({
        path: imagePath,
        ...result,
      });
    } catch (error) {
      results.push({
        path: imagePath,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * 列出目录中的图片
 */
function listImages(dirPath) {
  const supportedFormats = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];

  if (!fs.existsSync(dirPath)) {
    throw new Error(`目录不存在: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath);
  const imageFiles = files
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return supportedFormats.includes(ext);
    })
    .map((file) => {
      const fullPath = path.join(dirPath, file);
      return getImageInfo(fullPath);
    })
    .filter((info) => info.success);

  return imageFiles;
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║        Local Image Analyzer - 本地图片分析工具             ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  无需 API Key，完全本地运行                                ║
║                                                            ║
║  用法:                                                     ║
║    node analyze.js <图片路径>                              ║
║    node analyze.js --list <目录>                           ║
║    node analyze.js --batch <目录>                          ║
║    node analyze.js --ocr <图片路径>                        ║
║                                                            ║
║  示例:                                                     ║
║    node analyze.js F:\\screenshot.png                       ║
║    node analyze.js --list F:\\                              ║
║    node analyze.js --batch F:\\photos                      ║
║    node analyze.js --ocr F:\\image.png                     ║
║                                                            ║
║  功能:                                                     ║
║    - 获取图片元数据（大小、尺寸、格式）                    ║
║    - 分析图片内容类型                                      ║
║    - OCR 文字识别（需要安装 Tesseract）                    ║
║    - 批量分析                                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
    return;
  }

  // 列出图片
  if (args[0] === "--list") {
    const dirPath = args[1] || ".";
    console.log(`\n📂 扫描目录: ${dirPath}\n`);

    try {
      const images = listImages(dirPath);

      if (images.length === 0) {
        console.log("未找到图片文件");
        return;
      }

      console.log(`找到 ${images.length} 张图片:\n`);
      images.forEach((img, i) => {
        console.log(`${i + 1}. ${img.name}`);
        console.log(`   大小: ${img.sizeFormatted}`);
        if (img.dimensions.width > 0) {
          console.log(`   尺寸: ${img.dimensions.width} x ${img.dimensions.height}`);
        }
        console.log("");
      });
    } catch (error) {
      console.error("错误:", error.message);
    }
    return;
  }

  // 批量分析
  if (args[0] === "--batch") {
    const dirPath = args[1] || ".";
    console.log(`\n📂 批量分析目录: ${dirPath}\n`);

    try {
      const images = listImages(dirPath);

      if (images.length === 0) {
        console.log("未找到图片文件");
        return;
      }

      console.log(`找到 ${images.length} 张图片，开始分析...\n`);

      const imagePaths = images.map((img) => img.path);
      const results = batchAnalyze(imagePaths);

      results.forEach((result, i) => {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`📸 图片 ${i + 1}: ${result.path}`);
        console.log("=".repeat(60));

        if (result.success) {
          console.log(result.description);
        } else {
          console.log(`\n✗ 错误: ${result.error}`);
        }
      });
    } catch (error) {
      console.error("错误:", error.message);
    }
    return;
  }

  // OCR 模式
  if (args[0] === "--ocr") {
    const imagePath = args[1];

    if (!imagePath) {
      console.error("错误: 请指定图片路径");
      return;
    }

    console.log(`\n📝 OCR 识别: ${imagePath}\n`);

    const result = extractTextWithTesseract(imagePath);
    if (result.success) {
      console.log("✓ 识别成功:\n");
      console.log(result.text);
    } else {
      console.log(`✗ ${result.error}`);
      if (result.suggestion) {
        console.log(`\n💡 ${result.suggestion}`);
      }
    }
    return;
  }

  // 单张图片分析
  const imagePath = args[0];

  try {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 Local Image Analyzer");
    console.log("=".repeat(60));

    const result = generateDescription(imagePath);

    if (result.success) {
      console.log(result.description);
    } else {
      console.error(`\n✗ 错误: ${result.error}`);
    }

    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\n✗ 错误:", error.message);
    process.exit(1);
  }
}

// 导出函数
module.exports = {
  getImageInfo,
  extractTextWithTesseract,
  analyzeImageContext,
  generateDescription,
  batchAnalyze,
  listImages,
};

// 运行
if (require.main === module) {
  main().catch(console.error);
}
