# 赛事实时播报

[![Manifest](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-88%2B-brightgreen)](https://www.google.com/chrome/)

轻量级浏览器扩展，实时播报体育赛事、电竞、运动会比分。采用 Chrome Manifest V3 原生 API，零外部依赖，完全免费。

## 功能特性

- **实时比分推送** — 30 秒自动刷新，进球/终场/开始时系统通知
- **多数据源** — TheSportsDB（免费） + 500彩票网（免费） + 雷速体育（免费）
- **赛事筛选** — 按运动类型、联赛勾选关注赛事，支持搜索
- **可点击跳转** — 每个赛事卡片可点击直达详情页
- **三级通知** — Badge 角标 → Popup 静默 → 系统弹窗
- **网页浮层** — 浏览任意网页时右下角弹出比分更新
- **极轻量** — 8 个文件，< 500 行代码，零 API 费用

## 安装使用

### 方式一：Chrome Web Store（即将上线）

> 待审核通过后直接搜索安装

### 方式二：开发者模式加载

1. 下载本仓库代码或 `git clone`
2. 打开 Chrome，地址栏输入 `chrome://extensions/`
3. 右上角开启 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择本仓库的根目录
6. 扩展图标出现在工具栏，点击即可使用

### 方式三：Edge 浏览器

1. 打开 Edge，地址栏输入 `edge://extensions/`
2. 左侧开启 **开发人员模式**
3. 点击 **加载解压缩的扩展**
4. 选择本仓库根目录

## 项目结构

```
sports-live-extension/
├── manifest.json          # 扩展配置
├── background.js          # Service Worker（数据拉取+通知）
├── popup.html             # 弹窗 UI
├── popup.js               # 弹窗逻辑
├── popup.css              # 弹窗样式
├── options.html           # 设置页面
├── options.js             # 设置逻辑
├── content.js             # 网页浮层播报
├── icons/                 # 图标资源
└── README.md
```

## 数据源

| 数据源 | 费用 | 覆盖 | 更新频率 |
|--------|------|------|----------|
| TheSportsDB | 免费 | 足球/NBA/NFL/MLB 等 | 2 分钟 |
| 500彩票网 | 免费 | 竞彩足球+篮球 | 赛后即时 |
| 雷速体育 | 免费 | 足球 2000+ 联赛 | 10-30 秒 |

## 技术栈

- Chrome Manifest V3
- Service Worker
- chrome.alarms API（定时轮询）
- chrome.storage API（数据缓存+事件分发）
- chrome.notifications API（系统通知）
- 纯原生 JavaScript，零依赖

## 开发

```bash
# 克隆仓库
git clone https://github.com/yourname/sports-live-extension.git
cd sports-live-extension

# 在 Chrome 中加载
# chrome://extensions/ → 开发者模式 → 加载已解压的扩展程序
```

## License

MIT