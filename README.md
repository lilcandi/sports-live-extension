# 赛事实时播报 v2.2

[![Manifest](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-88%2B-brightgreen)](https://www.google.com/chrome/)
[![Version](https://img.shields.io/badge/Version-2.2.0-orange)]()
[![60+赛事](https://img.shields.io/badge/赛事-60+-success)]()
[![13资讯源](https://img.shields.io/badge/资讯源-13-blue)]()

轻量级 Chrome 浏览器扩展，实时播报体育赛事、电竞比分和中文资讯。**v2.2 全面增强**：60+ 赛事覆盖、13 个中文资讯源、热度排名系统、30+ 设置选项。

## ✨ 功能特性

### 🏆 赛事数据（60+）

| 类别 | 代表赛事 | 数量 | 数据源 |
|------|----------|------|--------|
| ⚽ 足球 | 世界杯、欧冠、英超、西甲、意甲、德甲、中超、亚冠、欧洲杯 | 19 | 500.com |
| 🏀 篮球 | NBA、CBA、男篮世界杯、欧冠篮球 | 5 | 500.com |
| 🏎️ 赛车 | F1、MotoGP、WEC、WRC | 4 | TheSportsDB |
| 🎾 网球 | 四大满贯、ATP大师赛、年终总决赛 | 6 | TheSportsDB |
| 🏓 乒乓球 | 世乒赛、奥运会、世界杯、WTT | 4 | 静态日程 |
| 🎮 电竞 | LPL/S赛/MSI、TI、CS2 Major、瓦罗兰特、KPL、PEL等 | 22 | 静态日程 |

### 📰 中文资讯源（13个）

**论坛社区**（7个）：
- 🏀 虎扑步行街 / NBA / 足球 / 电竞（HTML 爬取）
- 💡 知乎热榜（RSS，多源 fallback）
- 📢 微博热搜（RSS，多源 fallback）

**体育资讯**（4个）：
- ⚽ 懂球帝（HTML 爬取）
- 📺 直播吧（HTML 爬取）
- 📰 新浪体育（HTML 爬取，可选）
- 🏆 腾讯体育（HTML 爬取，可选）

**API 接口**（2个，需密钥）：
- 📱 头条体育新闻（聚合数据 API）
- 🔥 ALAPI 微博热搜

### 🔥 热度排名系统

- **赛事分级**：S+ / S / A / B / C 五档热度
- **动态热度**：基础关注度 + 实时状态加成（进行中+30、即将开始+15）+ 比分激烈度（高得分/胶着比赛加分）
- **分类排名**：总榜 TOP20 + 各运动分类 TOP10
- **通知过滤**：可设置最低通知热度门槛，避免打扰

### 🎛️ 设置选项（30+）

| 分类 | 选项 |
|------|------|
| 🔔 通知 | 结束/进球/开始通知、最低热度门槛、通知声音 |
| 🗣️ 语音 | 总开关、进球语音、结束语音、语速（4档） |
| 🖥️ 显示 | 热度排序、热度标识、来源显示、游戏标签、默认页面、最大资讯数 |
| 📰 资讯 | 总开关、刷新间隔、13 个源独立开关 |
| 💾 数据 | 统计面板、导出/导入数据、清空数据、历史保留天数 |

### 🔧 核心功能

- **7 个 Tab** — 热度排名 | 实时赛事 | 中文资讯 | 未来赛程 | 历史搜索 | 我的收藏 | 昨日总结
- **历史搜索** — 搜索一年内任意赛事结果，关键词 + 时间范围过滤
- **昨日总结** — 每日早 8 点自动生成昨日赛事汇总
- **收藏联赛** — 收藏任意联赛，跟踪赛程进度
- **四级通知** — Badge 角标 → Popup 静默 → 系统弹窗 → 网页浮层
- **可点击跳转** — 每个赛事/资讯卡片点击直达详情页
- **数据备份** — 设置和数据一键导出/导入 JSON

## 🚀 安装使用

### 方式一：开发者模式加载

1. 下载本仓库：`git clone https://github.com/lilcandi/sports-live-extension.git`
2. 打开 Chrome，地址栏输入 `chrome://extensions/`
3. 右上角开启 **开发者模式**
4. 点击 **加载已解压的扩展程序** → 选择本仓库根目录
5. 扩展图标出现在工具栏，点击即可使用

### 方式二：Edge 浏览器

1. `edge://extensions/` → 开启开发人员模式 → 加载解压缩的扩展

## 📁 项目结构

```
sports-live-extension/
├── manifest.json          # MV3 扩展配置
├── background.js          # Service Worker（数据拉取+资讯爬取+通知）
├── content.js             # 网页浮层播报（比分+资讯）
├── popup.html             # 7 Tab 弹窗 UI
├── popup.js               # 弹窗逻辑
├── popup.css              # 弹窗样式
├── options.html           # 设置页面（30+ 选项）
├── options.js             # 设置逻辑
├── data/
│   ├── leagues.js         # 联赛定义（60+ 赛事）
│   ├── sources.js         # 资讯源配置（13 个源）
│   └── esports_schedule.js # 电竞日程数据
├── icons/                 # 图标 (16/48/128)
├── LICENSE                # MIT 协议
└── README.md
```

## 📊 数据源状态

| 数据源 | 类型 | 状态 | 说明 |
|--------|------|------|------|
| 500彩票网 | 赛果结论 | ✅ 可用 | GBK 编码，正则提取 data-attribute |
| TheSportsDB | JSON API | ✅ 可用 | 免费 API，赛车/网球 |
| 虎扑 (4板块) | HTML爬取 | ✅ 可用 | 论坛帖子列表 |
| 懂球帝 | HTML爬取 | ✅ 可用 | 足球资讯 |
| 直播吧 | HTML爬取 | ✅ 可用 | 综合体育资讯 |
| 新浪体育 | HTML爬取 | ✅ 可用 | 默认关闭 |
| 腾讯体育 | HTML爬取 | ✅ 可用 | 默认关闭 |
| 知乎热榜 | RSS | ⚠️ 多源fallback | RSSHub 不稳定，已配置备用源 |
| 微博热搜 | RSS | ⚠️ 多源fallback | RSSHub 不稳定，已配置备用源 |
| 头条新闻 | API | ⏸️ 需Key | 聚合数据 |
| ALAPI微博 | API | ⏸️ 需Token | ALAPI |

## 🔑 可选 API 密钥

| 密钥 | 用途 | 获取方式 |
|------|------|----------|
| ALAPI Token | 微博热搜（更稳定） | https://v2.alapi.cn/ 扫码关注公众号 |
| 聚合数据 Key | 头条体育新闻 | https://www.juhe.cn/ 注册获取 |

> 留空则自动使用 RSSHub 免费路由 + 备用源，无需任何密钥即可使用。

## 🛠️ 技术栈

- **Manifest V3** — Chrome 扩展最新标准
- **Service Worker** — 后台数据拉取，不占用内存
- **纯原生 JS** — 无框架依赖，轻量快速
- **正则解析** — 避免 DOM 解析，降低被反爬检测概率
- **多源 fallback** — RSS/API 源自动切换备用地址
- **localStorage + sync** — 本地缓存 + 跨设备同步设置

## 📝 更新日志

### v2.2.0
- ✨ 新增 13 个中文资讯源（虎扑/知乎/微博/懂球帝/直播吧/新浪/腾讯等）
- ✨ 资讯爬取模块（8 种解析器 + 多源 fallback）
- ✨ 设置页面全面升级（30+ 选项，6 大分类）
- ✨ 数据管理功能（导出/导入/清空 + 统计面板）
- ✨ 通知热度门槛过滤
- 🔧 修复 buildUrl 参数缺失 bug
- 🔧 修复 content.js 未注册问题

### v2.1.0
- ✨ 60+ 赛事覆盖（足球/篮球/赛车/网球/乒乓球/电竞）
- ✨ 热度排名系统（S+/S/A/B/C 五级 + 动态热度计算）
- ✨ 热度排名 Tab（默认首页，TOP3 奖牌徽章）
- ✨ 电竞静态日程扩展到 24 项
- 🎨 赛事卡片热度标识动画

### v2.0.6
- ✨ 改为赛果结论读取模式，避免触发反爬
- ✨ 500.com 数据源，正则提取 data-attribute 赛果

## 📄 License

MIT
