# COS72-Tauri 部署指南

本文档提供了COS72-Tauri应用的编译、测试、部署和问题排查指南。

## 环境要求

- Node.js v18.0.0+
- Rust 1.70.0+
- Tauri CLI 2.0.0+
- pnpm 8.0.0+

## 初始化项目

首次克隆项目后，请运行以下命令初始化环境：

```bash
# 安装依赖
pnpm install

# 安装Tauri CLI
cargo install tauri-cli --version "^2.0.0"
```

## 开发模式

启动开发服务器，实时预览应用：

```bash
# 启动前端开发服务器
pnpm dev

# 在另一个终端启动Tauri应用
pnpm tauri dev
```

## 编译与打包

将应用编译为可分发的安装包：

```bash
# 编译生产版本
pnpm build

# 打包Tauri应用
pnpm tauri build
```

打包成功后，可以在以下位置找到安装包：

- macOS: `src-tauri/target/release/bundle/macos/`
- Windows: `src-tauri/target/release/bundle/msi/`
- Linux: `src-tauri/target/release/bundle/appimage/`

## 测试

运行自动化测试以验证应用功能：

```bash
# 运行前端测试
pnpm test

# 运行Rust后端测试
cd src-tauri && cargo test
```

## 常见问题解决方案

### 1. Tauri API通信失败

如果应用无法正确调用Tauri后端API，可能是以下原因：

- **IPC通道初始化失败**：检查控制台是否有`[TAURI-INJECT]`相关的错误日志。
- **API对象不可用**：在开发者工具中检查`window.__TAURI__`和`window.__TAURI_IPC__`对象是否存在。

解决方案：

```js
// 在浏览器控制台执行以下代码，检查API状态
console.log({
  isTauriApp: Boolean(window.__IS_TAURI_APP__),
  hasTauriObj: typeof window.__TAURI__ !== 'undefined',
  hasTauriInvoke: typeof window.__TAURI__?.invoke === 'function',
  hasIpc: typeof window.__TAURI_IPC__ !== 'undefined',
  hasInternals: typeof window.__TAURI_INTERNALS__ !== 'undefined'
});
```

如果仅`window.__TAURI_INTERNALS__`可用，应用仍可通过内部API正常工作。

### 2. 编译错误

如果遇到编译错误，请检查：

- Rust版本是否兼容（`rustc --version`）
- Tauri CLI版本是否正确（`cargo tauri --version`）
- pnpm依赖是否完整（`pnpm install`）

### 3. 硬件检测失败

如果硬件检测功能失败：

- 确保应用具有必要的系统权限
- 在macOS上可能需要签名应用才能访问某些硬件信息
- 检查控制台日志中有关硬件访问的错误

### 4. WebAuthn/Passkey问题

如果WebAuthn功能不正常工作：

- 确保运行在HTTPS环境或localhost
- 检查浏览器是否支持WebAuthn API
- 在macOS上，确保已授予Touch ID权限

### 5. API注入顺序问题

如果应用显示标记为Tauri环境，但API调用失败，可能是注入顺序问题：

```js
// 手动触发API刷新
window.dispatchEvent(new CustomEvent('tauri-reinject-api'));
```

## 版本历史

请参考项目根目录下的`CHANGES.md`文件，了解各版本的变更内容和已修复的问题。

## 自动化脚本

```bash
# 整合式构建和测试
pnpm build-and-test

# 完整CI/CD脚本
pnpm ci-cd

# 快速检查API状态
pnpm check-api
```

## 其他参考文档

- [Tauri 2.0官方文档](https://tauri.app/v2/guide/)
- [Tauri API注入详解](https://tauri.app/v2/api/js/)
- [前后端通信问题修复总结](./SUMMARY.md)

## 测试

### 运行Jest测试

```bash
# 运行所有Jest测试
pnpm test

# 运行特定测试文件
pnpm test -- __tests__/yourtest.test.tsx
```

### 测试Tauri API通信

您可以使用测试脚本来验证前后端通信是否正常工作：

**Linux/macOS:**
```bash
# 测试API通信（简单HTML测试页面）
./run_tests.sh --simple

# 测试所有功能
./run_tests.sh --all

# 帮助信息
./run_tests.sh --help
```

**Windows:**
```bash
# 测试API通信（简单HTML测试页面）
run_tests.bat --simple

# 测试所有功能
run_tests.bat --all

# 帮助信息
run_tests.bat --help
```

## 构建

```bash
# 构建前端应用
pnpm build

# 构建Tauri应用 (调试模式)
pnpm tauri build --debug

# 构建Tauri应用 (发布模式)
pnpm tauri build
```

## 发布

### macOS发布

```bash
# 构建并签名macOS应用
./mac-release.sh
```

### Windows发布

Windows发布需要手动执行以下步骤：

1. 构建应用
```bash
pnpm build && pnpm tauri build
```

2. 签名应用（如果需要）
```bash
# 使用Windows签名工具签名
signtool sign /f your_cert.pfx /p your_password /tr http://timestamp.digicert.com /td sha256 /fd sha256 ".\src-tauri\target\release\bundle\nsis\cos72_0.4.4_x64-setup.exe"
```

## 问题排查

### Tauri API通信问题

如果遇到前后端通信问题，请尝试以下步骤：

1. 确认`src-tauri/tauri.conf.json`中的配置是否正确
   - 确保`withGlobalTauri`设置为`true`
   - 检查CSP配置是否允许必要的资源

2. 使用测试工具验证API通信
```bash
./run_tests.sh --simple
```

3. 检查浏览器控制台是否有API相关错误
   - `window.__TAURI__`对象是否存在
   - `window.__TAURI_IPC__`对象是否存在
   - `window.ipcNative`对象是否存在

4. 尝试手动刷新API
```javascript
// 在浏览器控制台中执行
window.dispatchEvent(new CustomEvent('tauri-reinject-api'));
```

### 构建错误

如果构建过程中遇到错误：

1. 确保所有依赖都已安装
```bash
pnpm install
```

2. 清理构建缓存
```bash
# 清理Tauri构建缓存
pnpm tauri clean

# 清理Next.js构建缓存
rm -rf .next out
```

3. 检查Rust依赖
```bash
cd src-tauri && cargo check
```

## 版本历史

当前版本: 0.4.4

查看[CHANGES.md](./CHANGES.md)获取完整的变更历史。 