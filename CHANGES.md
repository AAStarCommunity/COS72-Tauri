# COS72-Tauri 变更日志

## [0.2.0] - 2023-11-15 (已完成)

### 增强功能
- 完善FIDO2签名实现
  - 添加Windows、macOS和Linux平台的实际实现
  - 改进错误处理和用户提示
- TEE功能增强
  - 实现基础TEE操作接口
  - 添加TEE钱包核心功能
  - 完善TEE插件管理
- 改进硬件检测模块
  - 更精确的TEE支持检测
  - 添加更多硬件信息采集
- UI改进
  - 优化插件安装流程
  - 添加更详细的状态反馈
  - 改进错误处理

### 技术实现
- 改进跨平台兼容性
- 添加更多单元测试和集成测试
- 完善构建和发布流程
- 优化性能和资源使用

### 构建与测试
- 更新了前端测试配置，解决了测试文件与构建冲突问题
- 改进了TypeScript类型定义，增强了类型安全性
- 优化了jest和webpack配置
- 完善了deploy.md文档，添加了详细的先决条件和环境要求
- 修复了macOS下检测Apple Silicon处理器的临时值引用问题
- 添加了缺失的Tauri build.rs文件，修复了构建错误
- 修复了未使用的导入和变量警告，提高了代码质量
- 解决了图标文件配置问题，简化了图标配置
- 更新了所有版本号到v0.2.0，保持一致性

### 已修改文件
- CHANGES.md - 添加v0.2.0版本变更记录
- RELEASE.md - 添加v0.2.0发布说明
- deploy.md - 更新部署指南和API列表
- package.json - 更新版本号
- src-tauri/Cargo.toml - 更新版本号
- src-tauri/tauri.conf.json - 更新版本号和图标配置
- src-tauri/build.rs - 新建文件用于Tauri构建流程
- src-tauri/src/hardware/detect.rs - 修复临时值引用问题
- src-tauri/src/fido/passkey.rs - 增强FIDO2签名实现
- src-tauri/src/tee/mod.rs - 添加TEE核心功能框架和修复警告
- src-tauri/src/main.rs - 新增TEE API和单元测试，修复警告
- src/pages/index.tsx - 更新UI以支持TEE功能

## [0.1.0] - 2023-11-01 (计划发布)

### 项目初始化
- 创建项目基础结构
- 设置Tauri框架
- 配置Next.js前端
- 创建开发文档 (FEATURES.md, PLAN.md, SOLUTION.md, RELEASE.md)

### 添加功能
- 基础Web UI框架
  - 首页界面
  - 插件管理页面
  - 响应式设计
- FIDO2指纹签名接口
  - 跨平台抽象层
  - 平台特定实现 (Windows/macOS/Linux/Android/iOS)
- CPU架构和TEE环境检测
  - CPU信息检测
  - SGX/TrustZone/Secure Enclave支持检测
- TEE插件下载框架
  - 插件下载功能
  - 哈希验证功能
  - 插件兼容性检查
- 基础钱包功能（仅支持TEE设备）
  - TEE接口设计

### 技术实现
- 跨平台支持（Mac、Windows、Linux基础支持）
- 多平台FIDO2接口适配
- Rust与Next.js通信机制
- 安全通信与哈希验证 
- Tauri配置与项目结构 

## TEE架构与集成分析 (v0.3.0计划)

### 项目结构

成功将Apache Teaclave TrustZone SDK添加为项目子模块，预计在v0.3.0版本中进行深度集成。重点关注其eth_wallet项目，该项目实现了基于TEE的以太坊钱包功能。

### 架构设计

Teaclave TrustZone SDK的eth_wallet项目采用标准TA/CA架构：
- **TA (Trusted Application)**: 在TrustZone安全环境中运行，负责所有敏感操作
- **CA (Client Application)**: 在普通环境中运行，负责用户交互和非敏感操作
- **Proto**: 定义TA和CA之间的通信协议和数据结构

### 核心功能

1. **密钥生成与管理**
   - 安全随机数生成
   - 助记词派生
   - 密钥安全存储
   
2. **交易签名**
   - 在TEE内部安全签名
   - 私钥永不离开安全环境
   
3. **安全通信**
   - CA与TA之间的安全通道
   - 命令/响应通信模式

### 集成计划

计划将Teaclave TrustZone SDK的eth_wallet功能集成到COS72-Tauri应用中：
1. 在src-tauri/src/tee模块中实现与TA的通信
2. 添加Tauri命令API暴露功能给前端
3. 实现用户友好的钱包管理界面
4. 添加跨平台支持和兼容性检查

### 安全考量

1. **密钥生命周期管理**
   - 确保密钥生成在TEE内部
   - 实现安全的密钥存储
   - 提供安全的钱包备份机制
   
2. **用户界面安全**
   - 实现交易确认安全UI
   - 防止钓鱼攻击
   
3. **错误处理与安全日志**
   - 实现安全日志记录
   - 敏感错误信息处理

关于详细实施计划，请参见PLAN.md中的v0.3.0 Teaclave集成计划。

## [0.2.1] - 2023-11-16 (更新)

### 增强功能
- 添加了Teaclave TrustZone SDK作为项目子模块
- 改进了前端与后端的集成
- 修复了浏览器环境兼容性问题

### 技术实现
- 添加了Tauri API的封装层，支持在浏览器和Tauri环境中运行
- 实现了环境检测逻辑
- 添加了前端mock数据，支持Web环境开发和测试

### 集成与平台适配
- 修复了tauri.conf.json中的构建命令配置
- 更新了.gitignore，添加了Rust项目特有的忽略规则
- 改进了开发流程，支持更灵活的调试方式

### 错误修复与优化
- 修复了硬件检测功能在不同平台的兼容性问题
- 添加了详细的错误处理和调试信息
- 优化了对ARM架构的检测和TEE功能的限制逻辑
- 添加了运行时日志以便更好地诊断问题
- 创建了调试脚本(run.sh)，方便应用问题定位

### 已修改文件
- FEATURES.md - 添加v0.3.0版本功能计划
- PLAN.md - 添加v0.3.0 Teaclave集成计划
- CHANGES.md - 添加v0.2.1版本变更记录和Teaclave架构分析
- .gitignore - 添加Rust项目相关忽略规则
- src-tauri/tauri.conf.json - 更新构建命令
- src-tauri/src/main.rs - 添加详细日志和错误处理
- src-tauri/Cargo.toml - 添加缺少的依赖项
- src/lib/tauri-api.ts - 重构API封装，增强错误处理
- src/lib/tauri-mock.ts - 改进mock数据，支持多种硬件配置
- src/pages/index.tsx - 添加更详细的错误反馈和调试信息
- run.sh - 新建调试脚本

## [0.2.2] - 2023-11-22 (修复)

### 依赖问题修复
- 更新了Tauri插件依赖，将branch从"dev"更改为"v2"
- 解决了由于Tauri 2.0稳定版发布后插件仓库分支变更导致的构建错误

### 技术细节
- Tauri 2.0已于2023年10月正式发布，插件仓库主分支从`dev`变更为`v2`
- 修复了`tauri-plugin-dialog`、`tauri-plugin-fs`、`tauri-plugin-http`和`tauri-plugin-os`依赖路径

### 已修改文件
- src-tauri/Cargo.toml - 更新Tauri插件依赖分支
- CHANGES.md - 添加v0.2.2版本变更记录 