# 中文字体文件说明

## 如何添加中文字体支持

### 方法一：下载 Noto Sans SC 字体（推荐）

1. 访问 Google Fonts: https://fonts.google.com/noto/specimen/Noto+Sans+SC
2. 下载字体文件（Regular 和 Bold）
3. 将字体文件（.ttf 或 .otf）放到此目录下：
   - `NotoSansSC-Regular.ttf` (常规)
   - `NotoSansSC-Bold.ttf` (粗体)

### 方法二：使用系统字体

如果不想下载字体文件，可以使用在线字体 URL（见 PDFTemplates.tsx 中的注释说明）

## 字体文件命名规范

- Regular: `NotoSansSC-Regular.ttf`
- Bold: `NotoSansSC-Bold.ttf`

## 注意事项

- 字体文件较大（通常 2-5MB），建议使用 CDN 或压缩字体
- 生产环境建议使用子集字体（只包含常用汉字）以减小文件大小
