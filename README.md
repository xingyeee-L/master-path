# Master Path (21-Day Challenge)

<div align="center">

![GitHub release (latest by date)](https://img.shields.io/github/v/release/xingyeee-L/master-path)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/xingyeee-L/master-path/release.yml?label=build)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-orange)
![React](https://img.shields.io/badge/React-v19-blue)

**以卡为誓，重塑专注。**
一个融合塔罗仪式感与游戏化激励的 21 天刻意练习工具。

[下载最新版本](https://github.com/xingyeee-L/master-path/releases/latest) · [提交反馈](https://github.com/xingyeee-L/master-path/issues)

</div>

---

## 📖 简介

**Master Path** 旨在通过“15分钟放空 + 学习奖励机制”降低多巴胺兴奋阈值，帮助你戒除玩耍成瘾，重塑注意力与执行力。

在这个为期 21 天的旅程中，你将把每一个具体的行动铸造成一张**塔罗卡牌**。当行动完成，卡牌消散为经验值（XP），推动你从“启程者”向“绝对大师”进阶。这不仅是一个 Todo 应用，更是一场关于自我掌控的修行仪式。

## ✨ 核心特性

### 🃏 仪式化任务系统
- **铸卡**：输入任务与时长，生成独一无二的塔罗卡牌。
- **视觉反馈**：基于时长生成不同稀有度（Common / Uncommon / Rare / Legendary）的卡面视觉。
- **沉浸交互**：3D 环形卡组，支持拖拽旋转与点击结算。

### 🧘 15分钟放空仪式
- **每日必修**：内置“15分钟放空”专属卡片，每日仅限一次。
- **冥想倒计时**：全屏沉浸式倒计时，帮助你切断多巴胺成瘾回路。
- **高额奖励**：完成即得 100 XP，是升级的最快途径。

### 🎵 沉浸式音频体验
- **动态 BGM**：内置精选白噪音与氛围音乐（如《动物森友会》原声），支持无缝循环。
- **播放器**：支持暂停/播放、切歌、随机模式与上传本地音乐。
- **无缝切换**：跨曲目自动淡入淡出，保证心流不被打断。

### 🏆 游戏化成长
- **等级系统**：10 个等级头衔（启程者 -> 绝对大师），支持中英双语切换。
- **成就徽章**：解锁“初窥门径”、“心流状态”、“悬崖勒马”等里程碑成就。
- **每日开场**：每日首次打开应用，展示当前天数与阶段性鼓励文案，强化坚持的意义。

### 💻 跨平台桌面应用
- 基于 **Tauri 2** 构建，兼具原生性能与 Web 开发效率。
- 支持 **macOS** (.dmg / .app) 与 **Windows** (.exe / .msi)。
- 体积轻量，启动迅速。

## 🛠️ 技术栈

- **核心框架**：React 19 + TypeScript + Vite
- **桌面容器**：Tauri 2 (Rust)
- **UI 系统**：Tailwind CSS + shadcn/ui + Framer Motion (动画)
- **状态管理**：Zustand + IndexedDB (持久化)
- **测试保障**：Vitest (单元/集成) + Playwright (E2E) + GitHub Actions (CI/CD)

## 🚀 快速开始

### 开发环境

1. **克隆仓库**
   ```bash
   git clone https://github.com/xingyeee-L/master-path.git
   cd master-path
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 或同时启动 Tauri 桌面端预览
   npm run tauri dev
   ```

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run typecheck` | 运行 TypeScript 类型检查 |
| `npm run lint` | 运行 ESLint 代码规范检查 |
| `npm test` | 运行单元与集成测试 |
| `npm run test:e2e` | 运行端到端测试 (需安装 Playwright 浏览器) |
| `npm run build` | 构建 Web 产物 |

## 📦 打包发布

本项目使用 GitHub Actions 自动构建发布。当你推送 `v*` 标签时（如 `v0.1.0`），CI 将自动打包 macOS 与 Windows 版本并发布到 Releases。

**手动本地打包**：

```bash
# macOS / Linux
npm run tauri build

# Windows (需配置 Rust 与 C++ 环境)
npm run tauri build
```

产物默认输出至 `src-tauri/target/release/bundle/`。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。
