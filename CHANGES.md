# COS72-Tauri 变更日志

## [0.2.0] - 2023-11-15 (计划发布)

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