# 打包发布（Master Path）

## 产物位置（macOS）
- App Bundle：
  - `src-tauri/target/release/bundle/macos/Master Path.app`
- DMG 安装包：
  - `src-tauri/target/release/bundle/dmg/Master Path_0.1.0_aarch64.dmg`
- 纯 Web 静态站点：
  - `dist/`

## 一键构建命令
### 1) 代码质量门禁（建议每次发布都跑）
```bash
npm run typecheck
npm run lint
npm test
```

### 2) Web 构建
```bash
npm run build
```

### 3) Tauri 打包（生成 .app / .dmg）
如果终端找不到 `cargo`，用这一版（推荐）：
```bash
PATH="$HOME/.cargo/bin:$PATH" npm run tauri build
```

如果环境已正确配置 Rust 工具链：
```bash
npm run tauri build
```

## 发布建议（macOS）
- 未签名/未公证：在本机可正常打开，但分发给其他机器可能触发 Gatekeeper 警告。
- 正式分发：建议配置 Apple Developer 签名与 notarization（后续可以补齐 CI 发布流水线）。

