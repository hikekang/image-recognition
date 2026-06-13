const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

// 配置 API Key
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "your-api-key-here",
});

/**
 * 读取图片并转换为 Base64
 */
function readImageAsBase64(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`文件不存在: ${imagePath}`);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString("base64");
    const ext = path.extname(imagePath).toLowerCase();

    const mimeTypes = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
    };

    const mimeType = mimeTypes[ext] || "image/png";

    return { base64, mimeType, size: imageBuffer.length };
  } catch (error) {
    throw new Error(`读取图片失败: ${error.message}`);
  }
}

/**
 * 使用 Claude 识别图片内容
 */
async function recognizeImage(imagePath, prompt = null) {
  try {
    console.log(`\n📸 正在读取图片: ${imagePath}`);
    const { base64, mimeType, size } = readImageAsBase64(imagePath);
    console.log(`✓ 图片读取成功 (${(size / 1024).toFixed(2)} KB, ${mimeType})`);

    const defaultPrompt = "请详细描述这张图片的内容，包括：\n1. 图片中有什么\n2. 文字内容（如果有）\n3. 布局和结构\n4. 重要的细节";

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64,
              },
            },
            {
              type: "text",
              text: prompt || defaultPrompt,
            },
          ],
        },
      ],
    });

    return message.content[0].text;
  } catch (error) {
    throw new Error(`识别图片失败: ${error.message}`);
  }
}

/**
 * 批量识别图片
 */
async function recognizeMultipleImages(imagePaths, prompt = null) {
  const results = [];

  for (const imagePath of imagePaths) {
    try {
      const description = await recognizeImage(imagePath, prompt);
      results.push({
        path: imagePath,
        success: true,
        description,
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
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        path: fullPath,
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
        ext: path.extname(file).toLowerCase(),
      };
    });

  return imageFiles;
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           Image Recognition Tool - 使用说明                ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  用法:                                                     ║
║    node recognize.js <图片路径> [自定义提示词]               ║
║                                                            ║
║  示例:                                                     ║
║    node recognize.js F:\\screenshot.png                     ║
║    node recognize.js F:\\image.jpg "这是什么内容？"          ║
║    node recognize.js --list F:\\                            ║
║    node recognize.js --batch F:\\photos                    ║
║                                                            ║
║  功能:                                                     ║
║    - 识别单张图片                                          ║
║    - 批量识别图片                                          ║
║    - 列出目录中的图片                                      ║
║                                                            ║
║  环境变量:                                                 ║
║    ANTHROPIC_API_KEY - Anthropic API 密钥                  ║
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
        console.log(`   路径: ${img.path}`);
        console.log(`   大小: ${img.sizeFormatted}`);
        console.log(`   格式: ${img.ext}`);
        console.log("");
      });
    } catch (error) {
      console.error("错误:", error.message);
    }
    return;
  }

  // 批量识别
  if (args[0] === "--batch") {
    const dirPath = args[1] || ".";
    const prompt = args[2] || null;

    console.log(`\n📂 批量识别目录: ${dirPath}\n`);

    try {
      const images = listImages(dirPath);

      if (images.length === 0) {
        console.log("未找到图片文件");
        return;
      }

      console.log(`找到 ${images.length} 张图片，开始识别...\n`);

      const results = await recognizeMultipleImages(
        images.map((img) => img.path),
        prompt
      );

      results.forEach((result, i) => {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`📸 图片 ${i + 1}: ${result.path}`);
        console.log("=".repeat(60));

        if (result.success) {
          console.log("\n✓ 识别结果:\n");
          console.log(result.description);
        } else {
          console.log("\n✗ 错误:", result.error);
        }
      });
    } catch (error) {
      console.error("错误:", error.message);
    }
    return;
  }

  // 单张图片识别
  const imagePath = args[0];
  const prompt = args[1] || null;

  try {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 Image Recognition Tool");
    console.log("=".repeat(60));

    const description = await recognizeImage(imagePath, prompt);

    console.log("\n✓ 识别结果:\n");
    console.log(description);
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\n✗ 错误:", error.message);
    process.exit(1);
  }
}

// 导出函数供其他模块使用
module.exports = {
  recognizeImage,
  recognizeMultipleImages,
  listImages,
  readImageAsBase64,
};

// 运行命令行接口
if (require.main === module) {
  main().catch(console.error);
}
