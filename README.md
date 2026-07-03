# 赛事实时播报 v2.0

[![Manifest](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-88%2B-brightgreen)](https://www.google.com/chrome/)
[![Version](https://img.shields.io/badge/Version-2.0.0-orange)]()

轻量级浏览器扩展，实时播报体育赛事、电竞、运动会比分。**v2.0 全面升级**：新增电竞赛事（LOL/CS2/Valorant/Dota2）、中文资讯源（知乎/虎扑/微博）、历史赛事搜索、未来赛程关注、收藏赛制跟踪。

## 功能特性

### 赛事数据
- **传统体育** — 足球 17 联赛 + NBA/CBA + NFL/MLB/NHL + F1 + 网球 + UFC
- **电竞** — LPL/LCK/LEC/LCS + MSI + S赛/全球总决赛 + KPL + CS2 Major/IEM/BLAST + Valorant VCT/冠军赛/大师赛 + Dota2 TI + 守望先锋 + 彩虹六号
- **多数据源** — TheSportsDB + 500彩票网 + Liquipedia + HLTV + vlr.gg（全部免费）

### 中文推送
- **微博热搜** — 体育/电竞相关话题实时推送
- **知乎热榜** — 体育/电竞讨论精华
- **虎扑论坛** — 步行街 + 电竞专区热门帖子
- 支持自定义关键词过滤，ALAPI Token 可选

### 核心功能
- **5 个 Tab** — 实时赛事 | 中文资讯 | 未来赛程 | 历史搜索 | 我的收藏
- **历史搜索** — 搜索一年内任意赛事结果，支持关键词+时间范围过滤
- **未来赛程** — 未来两周赛事预告，10-30 分钟自动刷新
- **收藏赛制** — 收藏任意联赛，跟踪赛程进度
- **三级通知** — Badge 角标 → Popup 静默 → 系统弹窗 → 网页浮层
- **可点击跳转** — 每个赛事/资讯卡片点击直达详情页

## 安装使用

### 方式一：开发者模式加载

1. 下载本仓库：`git clone https://github.com/lilcandi/sports-live-extension.git`
2. 打开 Chrome，地址栏输入 `chrome://extensions/`
3. 右上角开启 **开发者模式**
4. 点击 **加载已解压的扩展程序** → 选择本仓库根目录
5. 扩展图标出现在工具栏，点击即可使用

### 方式二：Edge 浏览器

1. `edge://extensions/` → 开启开发人员模式 → 加载解压缩的扩展

## 项目结构

```
sports-live-extension/
├── manifest.json          # MV3 扩展配置
├── background.js          # Service Worker（多数据源拉取+通知）
├── popup.html             # 5 Tab 弹窗 UI
├── popup.js               # 弹窗逻辑
├── popup.css              # 弹窗样式
├── options.html           # 设置页面（联赛选择+内容源+API密钥）
├── options.js             # 设置逻辑
├── content.js             # 网页浮层播报（比分+资讯）
├── data/
│   ├── leagues.js         # 联赛/赛事数据定义（50+ 联赛）
│   └── sources.js         # 内容源配置（6 个源）
├── icons/                 # 图标 (16/48/128)
└── README.md
```

## 数据源

| 数据源 | 类型 | 覆盖 | 费用 |
|--------|------|------|------|
| TheSportsDB | 传统体育 | 足球/NBA/NFL/MLB/NHL/F1/网球等 | 免费 |
| 500彩票网 | 传统体育 | 竞彩足球+篮球赛果 | 免费 |
| Liquipedia | 电竞 | LOL/Dota2/OW/R6 | 免费 |
| HLTV.org | 电竞 | CS2 赛事 | 免费 |
| vlr.gg | 电竞 | Valorant VCT | 免费 |
| 微博热搜 | 中文资讯 | 体育/电竞话题 | 免费 |
| 知乎热榜 | 中文资讯 | 体育/电竞讨论 | 免费 |
| 虎扑论坛 | 中文资讯 | 体育+电竞讨论 | 免费 |

## 可选 API 密钥

| 密钥 | 用途 | 获取方式 |
|------|------|----------|
| ALAPI Token | 微博热搜（更稳定） | https://v2.alapi.cn/ 扫码关注公众号 |
| 聚合数据 Key | 头条体育新闻 | https://www.juhe.cn/ 注册获取 |

> 留空则自动使用 RSSHub 免费路由，无需任何密钥即可使用。

## License

MIT