# COS72-Tauri 发布说明

## v0.2.0 (2023-11-15)

### 重要更新
- 大幅增强FIDO2签名接口功能，提供更完善的平台特定实现
- 添加TEE钱包核心功能框架与操作接口
- 升级前端UI，支持TEE相关操作

### 主要变更
1. FIDO2签名功能增强
   - 改进Windows/macOS/Linux平台的签名实现
   - 添加更完善的错误处理和平台检测
   - 支持挑战验证和签名数据格式化

2. TEE功能框架
   - 添加TEE状态检测和初始化功能
   - 实现钱包操作接口（创建、签名、验证等）
   - 支持TEE插件管理与交互

3. 前端UI更新
   - 增加TEE状态显示与管理界面
   - 支持钱包创建和初始化操作
   - 界面显示版本更新为v0.2.0

### 已知问题
- TEE功能目前仅提供API框架，尚未实现实际功能
- 不同平台的FIDO2实现仍需进一步优化
- 移动平台支持尚在开发中

### 下载与安装
请从项目仓库的Releases页面下载对应平台的安装包：
- Windows: `COS72-v0.2.0_x64-setup.exe`
- macOS: `COS72-v0.2.0_universal.dmg`
- Linux: `cos72_0.2.0_amd64.deb` 或 `COS72-v0.2.0_amd64.AppImage`

## v0.1.0 (2023-11-01)

### 初始版本
- 创建基础项目框架
- 实现硬件检测功能
- 提供FIDO2签名基础接口
- 支持TEE插件下载与验证

### 下载与安装
请从项目仓库的Releases页面下载对应平台的安装包：
- Windows: `COS72-v0.1.0_x64-setup.exe`
- macOS: `COS72-v0.1.0_universal.dmg`
- Linux: `cos72_0.1.0_amd64.deb` 或 `COS72-v0.1.0_amd64.AppImage`

## 概述

COS72-Tauri v0.1.0 是首个技术验证版本，实现了基础功能框架和核心技术验证。本版本主要聚焦于基础架构搭建、硬件检测和FIDO2生物识别签名功能的初步实现。

## 主要功能

1. **基础UI框架**
   - 使用Next.js构建的响应式UI界面
   - 基本导航和路由结构

2. **硬件检测**
   - CPU架构检测（特别是ARM架构支持）
   - TEE环境支持检测（SGX/TrustZone/Secure Enclave）
   - 硬件兼容性显示

3. **生物识别签名**
   - 跨平台FIDO2/Passkey支持
   - Challenge签名功能
   - 平台特定适配（Windows Hello/Touch ID等）

4. **TEE插件下载框架**
   - 插件列表显示和兼容性检查
   - 插件下载和哈希验证功能

## 支持平台

- Windows 10/11
- macOS 10.15+
- Linux (主流发行版)
- Android/iOS (基础支持)

## 安装要求

1. **通用要求**
   - 支持FIDO2/WebAuthn的设备
   - 对于TEE功能：支持SGX或TrustZone的CPU

2. **Windows特定**
   - Windows 10 1903版本或更高
   - 支持Windows Hello的设备

3. **macOS特定**
   - 支持Touch ID的设备
   - macOS 10.15+

4. **Linux特定**
   - 支持libfido2
   - 支持SGX/OP-TEE的设备（用于TEE功能）

## 已知问题

1. 在某些Linux发行版上可能缺少完整的FIDO2支持
2. TEE功能仅在支持的硬件上可用
3. 插件下载功能为模拟实现，实际功能将在后续版本中完善
4. 移动端支持尚处于实验阶段

## 后续计划

在下一个版本(v0.2.0)中，我们计划添加以下功能：

1. 完整账户管理系统
2. 真实TEE插件实现
3. 改进的跨平台兼容性
4. 更完善的错误处理和用户反馈

## 开发团队

COS72团队 (2023) 