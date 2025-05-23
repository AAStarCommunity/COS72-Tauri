# COS72-Tauri v0.1 功能特性

## 核心功能

### 1. Web UI基础框架
- 使用Next.js构建的基础UI界面
- 响应式设计，适配桌面和移动设备
- 基本导航和路由结构

### 2. 生物识别签名功能
- 接收外部服务器的challenge请求
- 调用系统FIDO2 API进行指纹签名
- 将签名结果返回给服务器进行验证

### 3. 硬件检测功能
- 检测CPU架构类型（尤其是ARM架构）
- 检测设备是否支持TEE环境（SGX/TrustZone）
- 显示硬件检测结果及兼容性状态

### 4. TEE插件下载框架
- 对于支持ARM架构的设备，提供下载TEE插件的选项
- 下载插件前进行验证（校验哈希值）
- 插件下载管理（进度显示、重试机制）

### 5. 基础钱包功能
- 仅针对支持TEE的设备提供
- 支持创建新钱包账户
- 支持基本的交易签名
- 支持签名验证

## 技术特性

### 1. Tauri框架集成
- 基于Tauri的跨平台应用架构
- Rust后端与Next.js前端的通信机制
- 应用基础配置和资源管理

### 2. 跨平台支持
- 支持Mac、Windows、Linux桌面系统
- 基础的Android/iOS移动设备支持
- 平台特定API的适配层

### 3. 安全机制
- 安全通信（HTTPS）
- 签名数据的安全处理
- 下载验证机制

## 限制说明

- v0.1版本仅提供基本框架和功能验证
- TEE相关功能仅在支持的硬件上可用
- 暂不包含网络穿透功能
- 暂不支持完整的Web3业务功能
- 仅支持与测试服务器的交互 

# COS72-Tauri v0.3.0 功能扩展计划

## Teaclave TrustZone SDK集成

### 1. 以太坊钱包TEE实现
- 集成Apache Teaclave TrustZone SDK的eth_wallet项目
- 在TEE环境中安全生成和存储密钥
- 在TEE环境中执行交易签名，私钥不离开可信环境
- 提供助记词派生和管理功能

### 2. 安全通信通道
- 在应用和TEE环境之间建立安全通信通道
- 实现请求/响应加密机制
- 防止中间人攻击的会话管理

### 3. 平台适配层增强
- 完善ARM TrustZone检测和初始化
- 添加OP-TEE驱动支持
- 针对不同硬件平台的优化

### 4. 钱包UI增强
- 专门设计TEE钱包管理界面
- 交易签名确认流程
- 钱包备份和恢复机制
- 多账户管理功能

### 5. 开发者工具
- TEE开发调试支持
- TEE模拟器集成（用于不支持TEE的设备）
- 开发文档和示例 