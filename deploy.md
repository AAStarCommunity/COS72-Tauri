# COS72-Tauri 部署与运行指南

本文档详细说明了COS72-Tauri应用的初始化、编译、测试和发布步骤，包括前端(Node.js)和后端(Rust)部分。
最后更新：v0.2.0

## 先决条件

**重要提示**: 在开始之前，确保已安装以下工具和依赖项。缺少任何一项都可能导致构建失败。

1. **Rust 和 Cargo**: 
   - Rust是构建Tauri应用的基础要求
   - 最低版本: 1.60.0
   - 安装命令: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   - 验证安装: `rustc --version && cargo --version`

2. **Node.js**: 
   - 最低版本: 16.x
   - 推荐使用nvm安装: `nvm install 16`
   - 验证安装: `node --version`

3. **pnpm**: 
   - 推荐版本: 7.x或更高
   - 安装命令: `npm install -g pnpm`
   - 验证安装: `pnpm --version`

4. **平台特定依赖**:
   - **Windows**: 
     - Microsoft Visual C++ Build Tools
     - WebView2
   - **macOS**: 
     - Xcode Command Line Tools (`xcode-select --install`)
   - **Linux**: 
     - 基本构建工具 (`build-essential`)
     - WebKit2GTK (`libwebkit2gtk-4.0-dev`)

## 环境准备

### 必要工具

1. **Node.js**: 16.x 或更高版本
2. **Rust**: 1.60.0 或更高版本
3. **pnpm**: 7.x 或更高版本
4. **Tauri CLI**

### 安装指令

```bash
# 安装 Rust (如果尚未安装)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# 或在Windows上从 https://rustup.rs 下载安装

# 安装 Node.js (如果尚未安装)
# 建议使用 nvm 管理 Node.js 版本
# https://github.com/nvm-sh/nvm

# 安装 pnpm
npm install -g pnpm

# 安装 Tauri CLI
pnpm install -g @tauri-apps/cli
```

## 前端 (Node.js) 部分

### 初始化与依赖安装

```bash
# 安装项目依赖
pnpm install

# 如果需要添加新依赖
pnpm add <package-name>

# 添加开发依赖
pnpm add -D <package-name>
```

### 开发与测试

```bash
# 运行前端开发服务器
pnpm dev

# 运行测试
pnpm test

# 仅构建前端
pnpm build
```

### v0.2.0更新 - 前端测试更改

我们在v0.2.0中扩展了前端测试，主要包括：

1. 对TEE状态组件的测试
2. 对钱包创建功能的测试
3. 对插件兼容性检查的测试

运行前端测试的命令保持不变：

```bash
# 安装依赖（如果尚未安装）
pnpm install

# 运行所有测试
pnpm test

# 可以添加 --watch 参数进行监视模式测试
pnpm test -- --watch
```

### 添加测试配置

1. 安装 Jest 依赖:

```bash
pnpm add -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest
```

2. 在 `package.json` 中添加测试脚本:

```json
"scripts": {
  "test": "jest"
}
```

3. 创建 Jest 配置文件 (`jest.config.js`):

```js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
};
```

4. 创建 `jest.setup.js`:

```js
import '@testing-library/jest-dom';
```

5. 测试示例 (`src/pages/index.test.tsx`):

```tsx
import { render, screen } from '@testing-library/react';
import Home from './index';

// 需要在测试环境中模拟 Tauri API
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: jest.fn().mockImplementation(() => Promise.resolve({
    cpu: { model_name: 'Test CPU', architecture: 'x86_64', cores: 4, is_arm: false },
    memory: 16384,
    tee: { tee_type: 'none', sgx_supported: false, trustzone_supported: false }
  }))
}));

jest.mock('@tauri-apps/api/window', () => ({
  appWindow: { close: jest.fn() }
}));

describe('Home Page', () => {
  it('renders welcome text', () => {
    render(<Home />);
    const heading = screen.getByText(/欢迎使用 COS72 应用/i);
    expect(heading).toBeInTheDocument();
  });
});
```

## 后端 (Rust) 部分

### API 列表

v0.2.0版本实现的 Tauri 命令 API:

| API 名称 | 描述 | 参数 | 返回值 |
|---------|------|------|--------|
| `check_hardware` | 获取完整硬件信息 | 无 | `Result<HardwareInfo, String>` |
| `get_cpu_info` | 获取CPU信息 | 无 | `Result<CpuInfo, String>` |
| `check_tee_support` | 检查TEE支持情况 | 无 | `Result<TeeSupport, String>` |
| `get_challenge_signature` | 使用生物识别对挑战进行签名 | `challenge: String` | `Result<String, String>` |
| `download_tee_plugin` | 下载TEE插件 | `url: String, target_path: String` | `Result<bool, String>` |
| `verify_plugin_hash` | 验证插件哈希 | `file_path: String, expected_hash: String` | `Result<bool, String>` |
| `get_tee_status` | 获取TEE状态 | 无 | `Result<TeeStatus, String>` |
| `initialize_tee` | 初始化TEE环境 | 无 | `Result<bool, String>` |
| `perform_tee_operation` | 执行TEE操作 | `operation: String, params: Option<String>` | `Result<TeeResult, String>` |

### 编译与测试

```bash
# 切换到Rust项目目录
cd src-tauri

# 编译检查
cargo check

# 运行单元测试
cargo test

# 开发构建
cargo build

# 发布构建
cargo build --release
```

### v0.2.0更新 - Rust组件测试

我们在v0.2.0中增加了Rust端的测试用例，主要包括：

1. TEE状态获取功能测试
2. TEE操作参数解析测试
3. FIDO2签名功能增强测试

运行Rust测试的命令：

```bash
# 进入Rust目录
cd src-tauri

# 运行所有测试
cargo test

# 运行特定模块的测试（例如TEE模块）
cargo test --package cos72-tauri --lib tee

# 运行特定测试
cargo test test_get_tee_status
```

## 整体应用 (Tauri)

### 开发运行

```bash
# 开发模式运行完整应用 (前端+后端)
pnpm tauri:dev
```

### 构建与打包

```bash
# 构建所有平台版本
pnpm tauri:build

# 或指定平台
pnpm tauri build --target windows  # Windows
pnpm tauri build --target macos    # macOS
pnpm tauri build --target linux    # Linux
```

### v0.2.0 多平台发布详细步骤

#### 步骤1: 确保版本信息一致

在发布前，确保以下文件中的版本号都已更新为0.2.0：
- package.json
- src-tauri/Cargo.toml
- src-tauri/tauri.conf.json
- CHANGES.md
- RELEASE.md

检查命令：
```bash
# 检查package.json版本
grep '"version"' package.json

# 检查Cargo.toml版本
grep 'version =' src-tauri/Cargo.toml

# 检查tauri.conf.json版本
grep '"version"' src-tauri/tauri.conf.json
```

#### 步骤2: 运行测试确保功能正常

```bash
# 运行前端测试
pnpm test

# 运行Rust测试
cd src-tauri && cargo test && cd ..
```

#### 步骤3: 构建开发版本并验证

```bash
# 使用开发模式运行应用
pnpm tauri:dev
```

验证：
- 确认所有页面正常加载
- 测试硬件检测功能
- 测试生物识别签名功能
- 测试TEE相关操作
- 测试插件下载与验证

#### 步骤4: 构建发布版本

```bash
# 构建所有平台版本
pnpm tauri:build

可以运行 cargo fix --bin "cos72-tauri" 自动修复一部分警告。
```

或按平台分别构建：

```bash
# Windows版本
pnpm tauri build --target windows

# macOS版本
pnpm tauri build --target macos

# Linux版本
pnpm tauri build --target linux
```

#### 步骤5: 测试打包的应用

在各平台上测试打包的应用：

**Windows:**
```bash
# 安装程序位于
./src-tauri/target/release/bundle/msi/COS72_0.2.0_x64-setup.exe
```

**macOS:**
```bash
# 应用位于
./src-tauri/target/release/bundle/macos/COS72.app
# DMG位于
./src-tauri/target/release/bundle/dmg/COS72_0.2.0_x64.dmg
```

**Linux:**
```bash
# Debian包位于
./src-tauri/target/release/bundle/deb/cos72_0.2.0_amd64.deb
# AppImage位于
./src-tauri/target/release/bundle/appimage/cos72_0.2.0_amd64.AppImage
```

#### 步骤6: 发布

1. 创建GitHub Release：
   - 标签: v0.2.0
   - 标题: COS72-Tauri v0.2.0
   - 描述: 从RELEASE.md复制相关内容

2. 上传构建产物:
   - Windows: COS72_0.2.0_x64-setup.exe
   - macOS: COS72_0.2.0_x64.dmg
   - Linux: cos72_0.2.0_amd64.deb 和 cos72_0.2.0_amd64.AppImage

### 多平台发布步骤

#### Windows 构建

1. 确保已安装 Windows 开发环境:
   - Visual Studio 2019/2022 带 "Desktop development with C++" 工作负载
   - Windows 10/11 SDK

```bash
# 构建 Windows 安装包
pnpm tauri:build --target windows

# 构建结果位于
# src-tauri/target/release/bundle/msi/
# src-tauri/target/release/bundle/nsis/
```

#### macOS 构建

1. 确保已安装 macOS 开发环境:
   - Xcode 和命令行工具
   - 如需签名，准备好开发者证书

```bash
# 构建 macOS 应用包
pnpm tauri:build --target macos

# 构建结果位于
# src-tauri/target/release/bundle/macos/
# src-tauri/target/release/bundle/dmg/
```

#### Linux 构建

1. 确保已安装必要的库:
   - Debian/Ubuntu: `sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
   - Fedora: `sudo dnf install webkit2gtk3-devel openssl-devel curl wget libappindicator-gtk3-devel librsvg2-devel`
   - Arch: `sudo pacman -S webkit2gtk base-devel curl wget openssl gtk3 libappindicator-gtk3 librsvg`

```bash
# 构建 Linux 包
pnpm tauri:build --target linux

# 构建结果位于
# src-tauri/target/release/bundle/deb/
# src-tauri/target/release/bundle/appimage/
```

## 常见问题与错误修复

### 前端构建错误

1. **模块解析错误**:
   - 检查 `tsconfig.json` 配置
   - 确保所有导入的模块都已安装

2. **TypeScript 类型错误**:
   - 安装缺少的类型定义: `pnpm add -D @types/<package>`
   - 检查类型定义是否正确

### Rust 构建错误

1. **依赖项错误**:
   - 更新 Rust: `rustup update`
   - 重新安装依赖: `cargo clean && cargo build`

2. **平台特定错误**:
   - 确保已安装平台所需的开发库
   - 检查 `Cargo.toml` 中的特性标志

### Tauri 打包错误

1. **图标错误**:
   - 确保 `src-tauri/icons` 目录包含正确格式的图标
   - Windows: `.ico`, macOS: `.icns`, 其他: `.png`

2. **签名错误**:
   - Windows: 检查证书配置
   - macOS: 检查签名身份配置

## v0.2.0新增功能常见问题

1. **TEE初始化失败**:
   - 确认设备支持TEE (TrustZone, SGX或Secure Enclave)
   - 检查系统TEE驱动是否正确安装
   - 在Linux上，确保OP-TEE守护进程正在运行

2. **FIDO2签名错误**:
   - 确认设备支持生物识别
   - Windows: 确认Windows Hello已配置
   - macOS: 确认Touch ID可用
   - Linux: 确认有FIDO2兼容设备连接

3. **插件下载失败**:
   - 检查网络连接
   - 确认下载URL有效
   - 确认应用有写入目标目录的权限

## 自动化发布流程

可以使用 GitHub Actions 自动构建和发布:

1. 已创建 `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 16
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 7
      - name: Install dependencies
        run: pnpm install
      - name: Build the app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'COS72-Tauri v${{ github.ref_name }}'
          releaseBody: 'See the release notes on our website.'
          releaseDraft: true
          prerelease: false
```

2. 发布新版本:
   - 创建新标签并推送: `git tag v0.2.0 && git push origin v0.2.0`
   - GitHub Actions 将自动构建并创建发布草稿

## 版本发布清单

发布新版本前的检查清单:

1. 所有测试通过: `pnpm test && cd src-tauri && cargo test`
2. 更新版本号:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
3. 更新 `CHANGES.md` 和 `RELEASE.md`
4. 创建 Git 标签并推送
5. 等待自动构建完成或手动构建各平台版本
6. 检查构建产物并发布 

## COS72-Tauri v0.2.0 API调用范例

以下是v0.2.0中添加的Tauri命令API的调用范例：

### 获取硬件信息

```javascript
// 在前端JavaScript/TypeScript中调用
import { invoke } from '@tauri-apps/api/tauri';

// 获取完整硬件信息
const hardwareInfo = await invoke('check_hardware');
console.log('CPU信息:', hardwareInfo.cpu);
console.log('内存:', hardwareInfo.memory, 'MB');
console.log('TEE支持:', hardwareInfo.tee);

// 仅获取CPU信息
const cpuInfo = await invoke('get_cpu_info');
console.log('CPU架构:', cpuInfo.architecture);
console.log('型号:', cpuInfo.model_name);
```

### FIDO2生物识别签名

```javascript
// 使用生物识别对challenge进行签名
const challenge = 'SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IGNoYWxsZW5nZQ=='; // Base64编码的挑战
try {
  const signature = await invoke('get_challenge_signature', { challenge });
  console.log('签名成功:', signature);
} catch (error) {
  console.error('签名失败:', error);
}
```

### TEE功能调用

```javascript
// 获取TEE状态
const teeStatus = await invoke('get_tee_status');
console.log('TEE可用:', teeStatus.available);
console.log('TEE类型:', teeStatus.type_name);

// 初始化TEE
if (teeStatus.available && !teeStatus.initialized) {
  const initResult = await invoke('initialize_tee');
  console.log('TEE初始化结果:', initResult);
}

// 创建钱包
const createWalletResult = await invoke('perform_tee_operation', { 
  operation: 'create_wallet',
  params: null
});
console.log('钱包创建结果:', createWalletResult);

// 签名交易
const signResult = await invoke('perform_tee_operation', { 
  operation: 'sign_transaction',
  params: JSON.stringify({ tx_data: '0x1234...', nonce: 5 })
});
console.log('交易签名结果:', signResult);

// 验证签名
const verifyResult = await invoke('perform_tee_operation', { 
  operation: 'verify_signature',
  params: 'message,signature'
});
console.log('签名验证结果:', verifyResult);
```

### 插件管理

```javascript
// 下载TEE插件
const downloadResult = await invoke('download_tee_plugin', { 
  url: 'https://example.com/plugins/tee-wallet.zip',
  target_path: 'plugins/tee-wallet.zip'
});
console.log('下载结果:', downloadResult);

// 验证插件哈希
const hashResult = await invoke('verify_plugin_hash', { 
  file_path: 'plugins/tee-wallet.zip',
  expected_hash: 'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2'
});
console.log('哈希验证结果:', hashResult);
```

## v0.2.0 编译测试笔记

在v0.2.0的编译测试中，我们遇到并解决了以下问题：

1. **测试文件冲突**：通过更新next.config.js文件，排除测试文件（*.test.tsx）防止其被构建到生产环境。

2. **TypeScript警告**：修复了React组件中的类型定义问题，特别是关于TeeStatus和HardwareInfo接口。

3. **Rust编译错误**：
   - 修复了临时值引用问题（特别是在detect_secure_enclave_support函数中）
   - 创建了缺失的build.rs文件
   - 解决了图标文件配置问题

4. **Tauri构建配置**：
   - 更新了所有版本号到v0.2.0，保持一致性
   - 简化了图标配置，提高了跨平台构建兼容性

5. **代码质量改进**：
   - 修复了未使用的导入和变量警告
   - 改进了错误处理和状态管理

成功运行的测试和构建命令：

```bash
# 安装依赖
pnpm install

# 运行前端测试
pnpm test

# 构建前端
pnpm build

# 运行Rust编译检查
cargo check

# 运行Rust单元测试
cargo test

# 构建Rust应用
cargo build

# 运行完整应用（开发模式）
pnpm tauri:dev
``` 