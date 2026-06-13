# 📸 Image Recognition Tool

一款强大的图片识别工具，支持本地OCR识别和Claude Vision API，可完全离线运行。

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11-lightgrey.svg)]()

---

## 🎯 功能特性

### ✨ 核心功能
- **图片元数据读取** - 文件大小、格式、尺寸、修改时间
- **OCR 文字识别** - 支持中英文混合识别，准确率高
- **批量处理** - 一次处理整个目录的图片
- **Windows OCR** - 使用系统内置OCR引擎（无需安装）
- **Tesseract OCR** - 高精度离线识别（推荐）

### 📋 支持格式
- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)

### 🌟 特色亮点
- ✅ **完全免费** - 无需API Key，完全本地运行
- ✅ **隐私安全** - 数据不离开你的电脑
- ✅ **多种安装选项** - 一键安装脚本
- ✅ **API集成** - 支持Claude Vision API（可选）

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 一键安装OCR工具

**方式1：快速安装（推荐）**
```bash
quick-install.bat
```

**方式2：完整安装**
```bash
install-ocr.bat
```

**方式3：PowerShell安装**
```powershell
.\install.ps1
```

### 验证安装

```bash
node --version
"C:\Program Files\Tesseract-OCR\tesseract.exe" --version
```

---

## 💻 使用方法

### 方法1：使用Batch脚本（最简单）

```bash
# 完整分析图片
local.bat F:\图片.png

# 仅OCR识别
ocr.cmd F:\图片.png

# 批量分析目录
local.bat --batch F:\photos

# 列出目录中的图片
local.bat --list F:\
```

### 方法2：直接使用Node.js

```bash
# 完整分析
node analyze.js F:\图片.png

# 仅OCR识别
node analyze.js --ocr F:\图片.png

# 批量处理
node analyze.js --batch F:\photos

# Windows OCR方案
node windows-ocr.js F:\图片.png
```

### 方法3：使用npm脚本

```bash
# 本地分析
npm run local F:\图片.png
npm run local:ocr F:\图片.png
npm run local:batch F:\photos

# API分析（需要API Key）
npm run api F:\图片.png
```

---

## 📝 命令参考

### local.bat / analyze.js

```bash
local.bat <图片路径>              # 完整分析（图片信息 + OCR）
local.bat --ocr <图片路径>        # 仅OCR文字识别
local.bat --list <目录>           # 列出目录中的图片
local.bat --batch <目录>          # 批量分析所有图片
```

### ocr.cmd

```bash
ocr.cmd <图片路径>                # 快速OCR识别
```

### 输出示例

```
============================================================
🔍 Local Image Analyzer
============================================================
📸 图片信息:
  文件: screenshot.png
  路径: F:/screenshot.png
  大小: 156.25 KB
  格式: .png
  尺寸: 1920x1080
  修改时间: 2026-06-13T03:01:09.908Z

📝 文字识别:
  ✓ 使用 Tesseract 识别成功

识别结果:
[识别出的文字内容]

============================================================
```

---

## ⚙️ 系统要求

### 必需
- **操作系统**: Windows 10 或 Windows 11
- **Node.js**: v18.0.0 或更高版本
- **磁盘空间**: 约 100 MB

### 推荐
- **内存**: 4 GB+
- **Tesseract OCR**: v5.4.0（用于高精度识别）
- **中文语言包**: 支持中文OCR

---

## 📦 项目结构

```
image-recognition/
├── analyze.js           # 本地分析主程序
├── recognize.js         # API分析程序
├── windows-ocr.js       # Windows OCR方案
├── package.json         # 项目配置
├── quick-install.bat    # 快速安装脚本
├── install-ocr.bat      # 完整安装脚本
├── install.ps1          # PowerShell安装脚本
├── local.bat            # 本地分析启动器
├── ocr.bat              # OCR启动器
├── ocr.cmd              # OCR命令工具
├── .gitignore          # Git忽略规则
└── 本地方案.md         # 安装文档
```

---

## 🔧 故障排除

### Tesseract 未安装

**问题**: "Tesseract 未安装" 错误

**解决**:
```bash
# 运行安装脚本
quick-install.bat

# 或手动下载安装
# 下载地址: https://github.com/UB-Mannheim/tesseract/wiki
```

### 中文识别效果差

**问题**: 中文识别不出或乱码

**解决**:
```bash
# 安装中文语言包
# 1. 下载 chi_sim.traineddata
# 2. 复制到 C:\Program Files\Tesseract-OCR\tessdata\
# 3. 重新运行分析
```

### 权限问题

**问题**: PowerShell 脚本无法执行

**解决**:
```powershell
# 以管理员身份运行PowerShell
Set-ExecutionPolicy RemoteSigned
```

---

## 🌐 API 集成（可选）

支持集成 Claude Vision API 进行高级图片分析：

```bash
# 设置环境变量
set ANTHROPIC_API_KEY=your_api_key_here

# 使用API分析
npm run api F:\图片.png
```

---

## 📊 性能指标

| 指标 | 本地OCR | API分析 |
|------|---------|---------|
| 速度 | ⚡ 快 | 🔄 中等 |
| 准确率 | 📊 高 | 📈 更高 |
| 离线支持 | ✅ 是 | ❌ 否 |
| 成本 | 💰 免费 | 💵 按量计费 |

---

## 🤝 贡献指南

欢迎贡献！请查看以下步骤：

1. Fork 这个仓库
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

### 报告问题

如果你遇到问题或有建议，请在 [Issues](https://github.com/hikekang/image-recognition/issues) 中提出。

---

## 📄 许可证

本项目采用 ISC 许可证。详情请查看 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) - OCR引擎
- [Node.js](https://nodejs.org) - 运行环境
- [Anthropic Claude](https://claude.ai) - Vision API

---

## 📧 联系方式

- GitHub: [@hikekang](https://github.com/hikekang)
- 项目链接: [https://github.com/hikekang/image-recognition](https://github.com/hikekang/image-recognition)

---

## ⭐️ 如果觉得有用，请给个星！

如果这个项目对你有帮助，请给我们一个 ⭐️ 支持！

