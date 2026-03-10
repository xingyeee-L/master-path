# Master Path

一个带仪式感的 21 天刻意练习应用：把任务铸造成“塔罗卡牌”，用 XP、等级、成就与放空仪式把行动变成可坚持的旅程。

## 特性
- 卡牌任务：输入任务，选择时长，生成卡牌并完成结算
- 放空仪式：15 分钟倒计时，结束后自动结算 100 XP（每日一次）
- 成就系统：首次放空、心流、悬崖勒马等成就提示
- 等级与头衔：XP 驱动等级进度，支持中英文
- 多语言：右上角 EN/中文切换
- 塔罗牌面：每张卡稳定不同花纹风格 + 大阿尔卡那编号/关键词 + 稀有度视觉（15/30/60/100）
- 首次启动开场：一键开始 21 天旅程（支持 Enter）
- 自动化测试：单元/集成（Vitest）+ 端到端（Playwright）

## 技术栈
- UI：React + Tailwind CSS + shadcn/ui
- 动画：framer-motion
- 状态：zustand（IndexedDB 持久化）
- 桌面端：Tauri 2
- 测试：Vitest + Testing Library + Playwright

## 快速开始
```bash
npm install
npm run dev
```

## 常用命令
```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## 打包发布（macOS / Tauri）
```bash
PATH="$HOME/.cargo/bin:$PATH" npm run tauri build
```

产物默认输出：
- `.app`：`src-tauri/target/release/bundle/macos/Master Path.app`
- `.dmg`：`src-tauri/target/release/bundle/dmg/Master Path_*.dmg`

更多信息见 [docs/RELEASE.md](docs/RELEASE.md)

## 测试文档
- 测试计划：[docs/testing/TEST_PLAN.md](docs/testing/TEST_PLAN.md)
- 用例摘要：[docs/testing/TEST_CASES.md](docs/testing/TEST_CASES.md)
- 缺陷流程：[docs/testing/DEFECT_WORKFLOW.md](docs/testing/DEFECT_WORKFLOW.md)
- 测试报告：[docs/testing/TEST_REPORT.md](docs/testing/TEST_REPORT.md)
