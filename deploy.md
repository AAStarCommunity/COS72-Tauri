# COS72-Tauri 部署与运行指南

本文档详细说明了COS72-Tauri应用的初始化、编译、测试和发布步骤，包括前端(Node.js)和后端(Rust)部分。
最后更新：v0.2.2

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

## v0.2.2 更新说明

### 依赖更新

在v0.2.2中，我们更新了Tauri插件依赖，将仓库分支从"dev"改为"v2"，这是因为Tauri 2.0正式版已于2023年10月发布，
插件仓库的主要开发分支也相应变更。

### 新增运行脚本

添加了`run.sh`脚本，用于简化项目的构建和调试：

```bash
# 赋予脚本执行权限
chmod +x run.sh

# 运行脚本
./run.sh
```

这个脚本会：
- 安装前端依赖
- 启动开发服务器
- 自动捕获并保存日志到`logs`目录

### 构建步骤更新

当使用v0.2.2版本时，请确保使用最新的Tauri CLI：

```bash
# 安装或更新Tauri CLI
npm install -g @tauri-apps/cli@latest

# 或使用pnpm
pnpm add -g @tauri-apps/cli@latest
```

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
| `detect_hardware` | 获取完整硬件信息 | 无 | `Result<HardwareInfo, String>` |
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
const hardwareInfo = await invoke('detect_hardware');
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

## 开发模式扩展说明

### 前端开发模式

为了便于前端开发，项目支持两种开发模式：

1. 纯前端开发模式 (无需Rust环境)
```bash
# 安装依赖
pnpm install

# 启动前端开发服务器
pnpm dev
```

在这种模式下，前端会使用mock数据模拟Tauri API的响应，便于UI开发和测试。可通过浏览器访问 http://localhost:3000 查看效果。

2. Tauri开发模式 (需要完整的Rust环境)
```bash
# 确保Rust环境已正确配置
export PATH="$HOME/.cargo/bin:$PATH"

# 安装依赖
pnpm install

# 启动Tauri开发服务
pnpm tauri:dev
```

这种模式会同时启动前端和Rust后端，创建完整的Tauri应用窗口。

### 环境准备补充说明

1. Rust环境配置
```bash
# 安装Rust (如未安装)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 添加Rust到PATH
export PATH="$HOME/.cargo/bin:$PATH"

# 验证安装
rustc --version
cargo --version
```

2. 针对Apple Silicon (M系列)的特殊配置
```bash
# 安装Xcode命令行工具
xcode-select --install

# 可能需要安装特定的依赖
brew install gcc libiconv
```

### 构建发布版本

```bash
# 构建前端
pnpm build

# 构建Tauri应用 (macOS/Windows/Linux)
pnpm tauri:build

# 仅构建特定平台
pnpm tauri build --target darwin-aarch64  # macOS ARM64
pnpm tauri build --target darwin-x86_64   # macOS Intel
pnpm tauri build --target windows-x86_64  # Windows
pnpm tauri build --target linux-x86_64    # Linux
```

构建完成后，应用将在以下位置生成：
- macOS: `src-tauri/target/release/bundle/macos/COS72.app`
- Windows: `src-tauri/target/release/bundle/msi/COS72_x.x.x_x64.msi`
- Linux: `src-tauri/target/release/bundle/deb/cos72-tauri_x.x.x_amd64.deb` 

## OP-TEE 树莓派部署指南 (v0.3.3新增)

在v0.3.3版本中，我们添加了对基于ARM TrustZone的OP-TEE实现的支持，这是一个完整的TEE解决方案，特别适用于树莓派等ARM设备。以下是在树莓派上设置和配置OP-TEE环境的详细步骤。

### 硬件要求

- 树莓派4B (推荐4GB+ RAM)
- 32GB+ microSD卡
- 电源适配器 (推荐3A)
- 可选: 带散热的外壳

### 软件设置

#### 1. 基础系统安装

```bash
# 下载Ubuntu Server 22.04 LTS for Raspberry Pi
wget https://cdimage.ubuntu.com/releases/22.04/release/ubuntu-22.04-preinstalled-server-arm64+raspi.img.xz

# 写入SD卡 (替换sdX为你的SD卡设备)
xzcat ubuntu-22.04-preinstalled-server-arm64+raspi.img.xz | sudo dd of=/dev/sdX bs=4M status=progress
```

启动树莓派并完成初始设置。

#### 2. 安装OP-TEE

OP-TEE为ARM平台提供了基于TrustZone的TEE实现。

```bash
# 安装依赖
sudo apt update
sudo apt install -y git python3-pip wget curl build-essential python3-dev python3-pycryptodome python3-pyelftools repo

# 克隆OP-TEE仓库
mkdir -p ~/tee
cd ~/tee
repo init -u https://github.com/OP-TEE/manifest.git -m rpi4.xml
repo sync -j4

# 构建OP-TEE
cd build
make toolchains
make all

# 烧写构建的镜像
sudo dd if=out/boot.img of=/dev/mmcblk0p1 bs=4M
sudo dd if=out/rootfs.img of=/dev/mmcblk0p2 bs=4M
```

重启树莓派。现在你已经有了运行OP-TEE的系统。

#### 3. 构建以太坊钱包可信应用(TA)

```bash
# 克隆ETH钱包TA仓库
git clone https://github.com/cos72/eth-wallet-ta.git
cd eth-wallet-ta

# 构建TA
make CROSS_COMPILE=aarch64-linux-gnu- TA_DEV_KIT_DIR=~/tee/optee_os/out/arm/export-ta_arm64
```

这会构建一个可以在安全世界中运行的可信应用程序。

#### 4. 构建ETH钱包服务

```bash
# 克隆ETH钱包服务仓库
git clone https://github.com/cos72/eth-wallet-service.git
cd eth-wallet-service

# 安装Node.js依赖
sudo apt install -y nodejs npm
npm install

# 配置服务使用TA
cp config.example.js config.js
# 编辑config.js指向TA位置
```

### 与COS72-Tauri集成

#### 1. 设置REST API服务器

```bash
# 启动ETH钱包服务
cd ~/eth-wallet-service
npm start
```

服务默认将在端口3030上启动。

#### 2. 配置COS72-Tauri使用远程TEE

编辑你的COS72-Tauri配置指向树莓派：

```bash
# 在.env或配置文件中
ETH_WALLET_SERVICE=http://<raspberry-pi-ip>:3030
USE_REMOTE_TEE=true
```

或者使用Tauri命令行选项：

```bash
# 使用命令行参数
pnpm tauri dev -- --tee-type optee --tee-remote http://<raspberry-pi-ip>:3030
```

#### 3. 使用程序界面配置

从v0.3.3版本开始，我们还添加了通过应用程序界面配置TEE的功能：

1. 启动COS72-Tauri应用程序
2. 导航到"设置"页面
3. 在"TEE配置"部分选择"OP-TEE"作为TEE类型
4. 选择"远程"作为连接模式
5. 输入远程服务器地址(例如 `http://<raspberry-pi-ip>:3030`)
6. 点击"应用"按钮

应用程序将自动尝试连接到远程TEE并显示连接状态。

### 安全增强

#### 1. 安全通信

要保护COS72-Tauri和树莓派之间的通信：

```bash
# 生成自签名证书
cd ~/eth-wallet-service
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes

# 在服务中配置HTTPS
# 编辑config.js启用HTTPS
```

更新你的COS72-Tauri配置使用HTTPS：

```
ETH_WALLET_SERVICE=https://<raspberry-pi-ip>:3030
```

#### 2. 网络隔离

为了最大安全，考虑：

1. 为树莓派设置专用VLAN
2. 使用USB-to-Ethernet适配器进行物理网络隔离
3. 实现防火墙规则限制对TEE服务的访问

### TEE中的密钥管理

OP-TEE环境提供了几个安全功能：

1. **安全存储**：由TrustZone支持的加密存储
2. **硬件密钥派生**：从硬件特定值派生的密钥
3. **安全内存**：正常世界无法访问的内存

在我们的TA中，我们实现：

```c
// 在安全世界中生成密钥的示例
TEE_Result generate_wallet(uint32_t param_types, TEE_Param params[4]) {
    // 在TEE中生成随机种子
    uint8_t seed[32];
    TEE_GenerateRandom(seed, sizeof(seed));
    
    // 派生以太坊密钥
    derive_ethereum_keys(seed, &private_key, &public_key, &address);
    
    // 在安全存储中存储密钥
    TEE_ObjectHandle object;
    TEE_CreatePersistentObject(TEE_STORAGE_PRIVATE, wallet_id, wallet_id_len,
                              TEE_DATA_FLAG_ACCESS_WRITE, NULL, 
                              private_key, private_key_len, &object);
    
    // 返回公开信息给正常世界
    memcpy(params[0].memref.buffer, public_key, public_key_len);
    memcpy(params[1].memref.buffer, address, address_len);
    
    return TEE_SUCCESS;
}
```

### 性能考虑

TrustZone操作比常规执行慢。设计你的应用程序以：

1. 最小化安全和正常世界之间的切换
2. 尽可能批处理操作
3. 使用异步模式避免阻塞UI

### 故障排除

#### 常见问题

1. **TA加载失败**：检查你的主机应用程序中的UUID是否与TA的UUID匹配
2. **通信错误**：验证网络连接和防火墙设置
3. **性能缓慢**：考虑优化在TEE中执行的操作

#### 日志和调试

启用TEE日志：

```bash
# 在树莓派上
sudo tee-supplicant -d 
sudo modprobe optee_armtz
```

查看日志：

```bash
dmesg | grep -i tee
```

## v0.3.3 多平台兼容性测试

我们已经在以下平台上测试了v0.3.3版本：

1. **macOS**：
   - macOS Ventura 13.4+ (Intel和Apple Silicon)
   - 兼容性：完全支持所有功能
   - TEE模式：模拟模式

2. **Windows**：
   - Windows 10/11 最新更新
   - 兼容性：完全支持所有功能
   - TEE模式：模拟模式

3. **Linux**：
   - Ubuntu 22.04 LTS
   - 兼容性：完全支持所有功能
   - TEE模式：
     - x86_64：模拟模式
     - ARM64：如果有OP-TEE，则为本地模式；否则为远程/模拟模式

4. **树莓派**：
   - 树莓派4B (4GB+) 运行Ubuntu 22.04
   - 兼容性：作为远程TEE服务完全支持
   - TEE模式：本地OP-TEE

### 在多个平台上构建

```bash
# 所有平台通用构建步骤
pnpm install
pnpm build

# 针对特定平台构建
pnpm tauri build --target windows  # Windows
pnpm tauri build --target macos    # macOS
pnpm tauri build --target linux    # Linux

# 构建ARM64版本（如树莓派）
pnpm tauri build --target linux-arm64
```

### 测试远程TEE连接

要测试与远程TEE的连接，请运行：

```bash
# 启动模拟TEE服务
node eth-wallet-service-mock.js

# 在另一个终端运行应用程序
pnpm tauri dev -- --tee-type optee --tee-remote http://localhost:3030
```

这将启动应用程序并连接到模拟的远程TEE服务。 

## 常见错误排查

### 错误: window.__TAURI__不存在或window.__TAURI_IPC__类型undefined

这是由于Tauri API未正确初始化导致的。可通过以下步骤解决:

1. 确保运行最新版本的Tauri 2.0
2. 检查您的tauri.conf.json配置是否正确
3. 重新构建应用: `pnpm run tauri build`
4. 清除浏览器缓存并重新启动应用

### 错误: TEE初始化失败 - Connection refused (os error 61)

这表明TEE服务未启动或无法访问。解决方法:

1. 检查本地TEE服务是否运行: `curl http://localhost:3030/api/tee/status`
2. 如果使用远程TEE(如树莓派)，确保服务正在运行并且网络连接正常
3. 检查防火墙设置是否阻止了连接
4. 如果使用树莓派OP-TEE，请按照RASPI-TEE-SETUP.md中的步骤进行设置

### 错误: WebAuthn注册卡在"Starting registration process..."

这通常由于WebAuthn API调用失败导致:

1. 确保您使用的是支持WebAuthn的浏览器（Chrome, Firefox, Safari等最新版本）
2. 在macOS上，确保应用有Touch ID权限
3. 检查Tauri权限配置是否包含biometric访问权限
4. 尝试重新启动应用，清除应用数据

如果问题持续存在，请查看控制台日志获取更详细的错误信息。 