# COS72-Tauri 变更日志

## [0.3.5] - 2025-05-08 (仓库优化与架构设计)

### 仓库优化

- 使用git-filter-repo工具彻底清理了仓库历史，大小从1.1GB减少到1.6MB：
  1. 清理了Git大文件历史(724MB)
  2. 移除了不必要的构建缓存和日志
  3. 优化了.gitignore配置，确保不再跟踪构建目录

### 架构设计

- 重新设计了Rust后端架构，提升模块化和扩展性：
  1. 设计了全面的硬件抽象层(HAL)，确保跨平台兼容性
  2. 增强了TEE服务抽象层，支持多种TEE实现和远程TEE服务
  3. 改进了安全钱包服务架构，支持多种签名格式和地址生成
  4. 设计了详细的插件系统架构，支持动态加载功能扩展

### 前端架构规划

- 规划了Next.js前端完整架构：
  1. 设计了积分系统、任务管理、商品市场等业务模块
  2. 规划了前端与Rust后端的清晰分离和通信机制
  3. 制定了应用场景的实现路径和技术选型

### 文档改进

- 更新了SOLUTION.md文档，添加了详细的架构图和技术实现路径：
  1. 使用mermaid图表展示了系统整体架构
  2. 添加了Rust后端详细架构设计
  3. 制定了前端架构与Rust服务交互模型
  4. 规划了未来扩展方向和风险对策

### 修改的文件

- SOLUTION.md - 全面更新架构设计和技术实现路径
- .gitignore - 优化配置确保不跟踪大型构建产物
- CHANGES.md - 添加v0.3.5版本记录

## [0.3.4] - 2025-05-07 (Bug修复与清理)

### Bug修复

- 修复了`src-tauri/src/main.rs`中的异步函数调用错误
- 修复了`src-tauri/src/tee/teaclave_adapter.rs`中的静态可变引用警告
- 删除了`src-tauri/target`目录并在`.gitignore`中确认已忽略

### 修改的文件

- src-tauri/src/main.rs - 修复测试函数中的异步调用
- src-tauri/src/tee/teaclave_adapter.rs - 修复静态可变引用警告
- package.json - 更新版本到0.3.4
- src-tauri/Cargo.toml - 更新版本到0.3.4
- CHANGES.md - 添加v0.3.4版本记录

## [0.3.3] - 2025-05-18 (TEE架构增强 & OP-TEE支持)

### TEE抽象层与模块化架构

- 实现了TEE抽象接口，使不同TEE实现可互换：
  1. 创建了`TEEAdapter`特性，定义了所有TEE实现必须提供的方法
  2. 重构`TeaclaveAdapter`实现新接口，保留现有功能
  3. 添加了`OpTeeAdapter`用于ARM TrustZone OP-TEE实现
  4. 创建了`TEEAdapterFactory`用于动态选择最适合的TEE实现
- 支持多种TEE连接方式：
  1. 本地（设备内）TEE直接访问
  2. 远程TEE（如树莓派）通过网络API访问
  3. 模拟TEE用于开发和不支持TEE的环境

### 树莓派OP-TEE支持

- 添加了在树莓派上设置和使用OP-TEE的完整支持：
  1. 创建详细文档`RASPI-TEE-SETUP.md`，指导用户在树莓派上设置OP-TEE
  2. 实现了`OpTeeAdapter`，支持与树莓派上的OP-TEE服务通信
  3. 增强了构建脚本和部署文档，添加ARM平台支持

### 开发与调试增强

- 改进了构建脚本(build.sh)：
  1. 更好的错误处理和诊断能力
  2. 添加了针对不同平台的构建选项
  3. 改进了对远程TEE测试的支持
- 更新了部署文档：
  1. 添加了OP-TEE树莓派部署指南
  2. 增加了针对多平台兼容性的测试信息
  3. 提供了远程TEE测试的详细说明

### 修改的文件

- src-tauri/src/tee/mod.rs - 重构以使用抽象接口和TEE适配器工厂
- src-tauri/src/tee/adapter_interface.rs - 新文件，定义TEE抽象接口
- src-tauri/src/tee/teaclave_adapter.rs - 更新以实现新接口
- src-tauri/src/tee/optee_adapter.rs - 新文件，实现OP-TEE适配器
- src-tauri/src/tee/adapter_factory.rs - 新文件，实现TEE适配器工厂
- src-tauri/Cargo.toml - 更新版本到0.3.3，添加async-trait依赖
- RASPI-TEE-SETUP.md - 新文件，树莓派OP-TEE设置指南
- deploy.md - 添加OP-TEE树莓派部署指南
- build.sh - 增强构建脚本，改进错误处理

## [0.3.2] - 2025-05-16 (WebAuthn Enhancement & UI Internationalization)

### WebAuthn/Passkey Improvements

- Enhanced WebAuthn implementation with robust Passkey registration support:
  1. Implemented in-memory registration state management for testing purposes
  2. Added proper Passkey credential storage mechanism
  3. Fixed registration completion flow with proper credential validation
  4. Improved challenge-response handling for better security

### UI Internationalization

- Updated UI text to use English instead of Chinese for better international
  user experience:
  1. Changed all user interface text in pages/register-passkey.tsx and
     pages/test-passkey.tsx
  2. Updated debug information displays to use English terms
  3. Converted all Layout components to display information in English
  4. Standardized terminology across the application

### Server-side Improvements

- Enhanced backend messages with proper English localization:
  1. Updated all console logging to use English
  2. Converted debug and status messages from Chinese to English
  3. Standardized error messages format for better readability

### New Features

- Added new WebAuthn functions:
  1. webauthn_finish_authentication: Properly complete the authentication flow
  2. Enhanced credential storage and retrieval mechanism
  3. Added test script (test-webauthn.js) for validating WebAuthn functionality

### Technical Details

- Improved WebAuthn registration flow:
  1. Added proper storage of PasskeyRegistration state during registration
  2. Implemented secure handling of registration responses
  3. Added support for proper credential verification

### Modified Files

- src/components/Layout.tsx - Updated to display debug information in English
- src/pages/register-passkey.tsx - Converted UI text to English
- src/pages/test-passkey.tsx - Converted UI text to English
- src-tauri/src/fido/webauthn.rs - Enhanced WebAuthn implementation with proper
  registration support
- src-tauri/src/main.rs - Added new Tauri command for authentication completion
  and English messages
- test-webauthn.js - Added new test script for WebAuthn functionality validation

## [0.3.1] - 2025-05-15 (性能优化与类型修复)

### 性能优化

- 增强了硬件检测结果缓存机制：
  1. 优化了tauri-api.ts中的detectHardware函数，确保缓存机制正常工作
  2. 添加了通过clearHardwareCache函数手动清除缓存的能力
  3. 解决了在某些情况下缓存未正确应用的问题

### 类型安全性增强

- 修复了eth-wallet.tsx中的类型错误问题：
  1. 为invokeCommand函数添加了明确的类型参数
  2. 添加了TeeResult类型接口确保类型安全
  3. 解决了"result is of type unknown"错误提示
- 改进了tauri-api.ts中performTeeOperation函数：
  1. 修改函数签名以支持复杂参数类型
  2. 使其能够处理字符串和对象类型的操作参数
  3. 确保与Rust后端的交互正确

### Rust编译错误修复

- 修复了src-tauri/src/tee/mod.rs中的关键编译错误：
  1. 解决了`get_tee_status`函数重复定义问题，移除了同步版本
  2. 确保异步函数调用正确使用`.await`
  3. 移除了未使用的导入，解决了编译警告

### 编码改进

- 提高了代码可维护性：
  1. 为API函数添加了更清晰的类型注解
  2. 统一了API调用的错误处理模式
  3. 添加了详细的代码注释

### 已修改文件

- src/lib/tauri-api.ts - 增强了performTeeOperation函数，支持复杂参数类型
- src/pages/eth-wallet.tsx - 修复了类型错误，为invokeCommand添加正确的类型参数
- src-tauri/src/tee/mod.rs - 解决了函数重复定义和异步调用问题
- src-tauri/src/tee/teaclave_adapter.rs - 移除了未使用的导入
- CHANGES.md - 添加v0.3.1版本更新记录

## [0.2.13] - 2023-12-31 (UI改进与Passkey注册修复)

### Passkey注册功能修复

- 修复了Passkey注册过程中的WebAuthn API错误：
  1. 解决了challenge类型不匹配问题，确保提供正确的ArrayBuffer类型
  2. 修复了公钥凭证创建选项中的参数格式
  3. 优化了Base64URL编解码逻辑，提升跨平台兼容性
  4. 完善了错误处理和调试日志
- 增强了模拟实现：
  1. 添加了全套WebAuthn相关命令的模拟支持
  2. 实现了模拟凭证管理和挑战响应流程
  3. 改进了浏览器环境下的降级体验

### UI布局改进

- 重新设计了页面布局以提升用户体验：
  1. 将导航菜单移至页面顶部，增强跨页面一致性
  2. 重新组织系统状态显示区域，放置于页面底部
  3. 优化了硬件信息和TEE状态区域，采用单行两列布局
  4. 改进了API检测信息展示格式，更加清晰直观
- 修复了UI文本问题：
  1. 替换了undefined为中文"未定义"
  2. 统一了状态说明文本的展示格式
  3. 增强了错误信息的可读性

### 技术改进

- 增强前端与后端的通信可靠性：
  1. 统一了命令参数名称，确保前后端一致
  2. 改进参数验证和错误处理
  3. 增加了详细的调试日志和状态报告
- 提高了类型安全性：
  1. 修复了ArrayBuffer和Uint8Array的类型转换问题
  2. 优化了WebAuthn API调用的类型定义
  3. 解决了潜在的类型不匹配异常

### 已修改文件

- src/lib/passkey-manager.ts - 修复WebAuthn API调用和类型问题
- src/lib/tauri-mock.ts - 添加WebAuthn命令的模拟支持
- src/pages/register-passkey.tsx - 重新设计UI布局，移动导航菜单到顶部
- src/pages/test-passkey.tsx - 优化系统状态区域，修复显示问题
- CHANGES.md - 添加v0.2.13版本变更记录

## [0.2.12] - 2023-12-31 (Passkey 功能完善)

### 完整实现 Passkey 流程

- 实现了完整的 FIDO2/Passkey 管理流程：
  1. 用户注册：调用WebAuthn API创建密钥对，注册用户的生物识别信息
  2. 服务器通信：将公钥发送到服务器并存储，保持私钥本地安全
  3. 签名挑战：从服务器获取挑战并使用私钥签名
  4. 验证签名：服务器使用公钥验证签名确认用户身份
- 增强了前端实现：
  1. 优化了Passkey注册页面，改进用户体验和错误处理
  2. 添加了新的`passkey-manager.ts`模块，包装WebAuthn API并处理不同平台差异
  3. 实现了挑战字符串的Base64URL正确编解码，确保跨平台兼容性
  4. 添加了模拟服务器页面，展示完整的注册和验证流程

### 跨平台兼容性

- 确保在各个平台上的一致体验：
  1. macOS: 使用Touch ID / Secure Enclave
  2. Windows: 支持Windows Hello
  3. Linux: 支持FIDO2安全密钥
  4. 浏览器环境: 降级到模拟数据但保持相同API接口

### 技术实现

- 后端改进：
  1. 优化了`webauthn.rs`中的FIDO2实现，使用最新的webauthn-rs库
  2. 添加了公钥存储和检索机制
  3. 实现了随机挑战生成和验证流程
- 前端改进：
  1. 正确处理WebAuthn的Base64URL编码
  2. 优化了用户体验和错误信息展示
  3. 添加了详细的调试信息便于问题排查

### 已修改文件

- src/lib/passkey-manager.ts - 新文件，实现Passkey注册和验证的完整流程
- src/pages/register-passkey.tsx - 改进用户体验，实现完整的注册流程
- src/pages/test-passkey.tsx - 强化测试功能，支持完整的Passkey验证流程
- src-tauri/src/fido/webauthn.rs - 优化后端实现，支持Passkey全流程
- CHANGES.md - 添加v0.2.12版本变更记录

## [0.2.11] - 2023-12-30 (核心改进)

### Tauri 2.0 API通信机制重构

- 彻底重写API通信机制，采用官方推荐方式：
  1. 移除了自定义事件通信方式，直接使用官方`@tauri-apps/api/core`中的`invoke`函数
  2. 简化了DOM就绪事件处理逻辑，移除了复杂的自定义事件处理
  3. 改进了环境检测逻辑，支持多种检测方式和更强的容错性
- 增强前端API的可靠性：
  1. 重构了`tauri-api.ts`，实现动态导入和渐进式API检测
  2. 优化了API等待策略，增加动态重试和更长超时时间
  3. 添加了`refreshTauriAPI()`函数，支持动态恢复API连接
  4. 修复了类型定义问题，添加全局Window接口扩展

### 后端代码优化

- 简化Rust端API实现：
  1. 移除了复杂的自定义事件处理代码，直接使用Tauri原生命令机制
  2. 修复了`perform_tee_operation`函数参数解析，支持字符串类型参数
  3. 显式注册`initialize_tee`命令，确保所有API在前端可用
- 优化日志和错误处理：
  1. 增强了日志输出，包含更多调试信息和版本标记
  2. 优化了错误信息格式，更便于定位问题

### 已修改文件

- src/lib/tauri-api.ts - 完全重构，采用官方推荐API调用方式
- src-tauri/src/main.rs - 简化API注入和命令处理逻辑
- CHANGES.md - 添加v0.2.11版本变更记录

## [0.2.10] - 2023-12-27 (重要修复)

### API通信彻底修复

- 解决了应用无法正确找到和使用Tauri API的关键问题:
  1. 虽然Tauri环境标记(`__IS_TAURI_APP__`)被正确注入，但`window.__TAURI__`对象未正确创建
  2. 修正了API调用一律降级到模拟数据的问题
  3. 添加了多层次的备用通信方案，确保API调用可靠性
- 改进了事件通信机制:
  1. 优化了`window.__TAURI_IPC__`对象的创建和初始化
  2. 改进了DOM就绪事件监听与API注入时机
  3. 添加了更多日志和调试信息，方便诊断
  4. 实现了API状态检测和自动恢复功能

### 用户体验增强

- 前端页面增强:
  1. 增加了API调用的等待时间，从5秒到10秒，解决大型应用加载慢的问题
  2. 引入更强大的重试机制，随重试次数动态调整等待时间
  3. 添加了API刷新功能，当首次尝试失败后自动恢复API状态
  4. 改善了状态反馈，用户可以看到详细的错误和重试进度
  5. 保留了最终降级到模拟数据的能力，确保即使在API完全不可用时应用也能运行

### 技术实现

- 后端改进:
  1. 对Tauri 2.0的DOM就绪事件处理更加优化
  2. 完善了IPC通信机制和事件处理
  3. 采用更可靠的事件驱动模型
- 前端改进:
  1. 添加了`refreshTauriAPI()`函数，支持动态恢复API状态
  2. 改进API就绪状态跟踪和检测，确保及时发现API可用性变化
  3. 优化了invoke函数实现，尽可能使用原生方法，失败后才降级

### 已修改文件

- src-tauri/src/main.rs - 优化了DOM就绪事件处理和API注入
- src/lib/tauri-api.ts - 全面重构，增强API封装和错误恢复能力
- src/pages/index.tsx - 改进API调用重试和状态反馈
- src/pages/plugins.tsx - 同步更新API调用逻辑
- CHANGES.md - 添加v0.2.10版本变更记录

## [0.2.9] - 2023-12-26 (Bug修复)

### 编译错误修复

- 修复了三个关键的Rust编译错误:
  1. 修复了`main.rs`中`event.payload()`类型不匹配错误
  2. 更新了`TeeOperation`枚举使用，移除了不存在的`GetWalletInfo`变体
  3. 修复了`initialize_tee`函数的调用方式，包括添加了`await`
- 解决了所有警告:
  1. 移除了`webauthn.rs`中未使用的导入
  2. 修复了未使用变量警告
- 更新了所有组件中的应用版本号

### 技术改进

- 改进了类型安全性和函数调用兼容性
- 确保了代码与Tauri 2.0规范的兼容
- 优化了Rust代码以符合编译器要求

### 已修改文件

- src-tauri/src/main.rs - 修复了三个编译错误
- src-tauri/src/fido/webauthn.rs - 移除未使用的导入并修复变量警告
- src/pages/index.tsx - 更新了版本号
- src/pages/plugins.tsx - 更新了版本号
- CHANGES.md - 添加本次修复记录

## [0.2.9] - 2023-12-25 (修复)

### API通信修复

- 解决了硬件检测和FIDO2/Passkey功能无法正常工作的问题
- 重构了前端与后端的通信机制，使用事件驱动模型
- 优化了API就绪检测和等待逻辑

### 技术实现

- 在main.rs中添加对DOM就绪事件的监听，确保前端API准备就绪
- 优化了自定义事件通信机制，实现了通用的命令调用接口
- 改进了tauri-api.ts中的命令调用逻辑和事件处理
- 在前端UI中添加API状态检测和等待机制

### 兼容性增强

- 优化了在不同环境下的降级策略，当无法使用真实API时优雅降级到模拟数据
- 添加了更详细的错误处理和日志记录，方便调试

### 已修改文件

- src-tauri/src/main.rs - 重构DOM就绪事件处理，增强事件通信机制
- src/lib/tauri-api.ts - 优化前端API封装，重构命令调用和事件监听
- src/pages/index.tsx - 改进API就绪检测和调用逻辑
- src/pages/plugins.tsx - 同步更新API调用逻辑
- CHANGES.md - 添加v0.2.9版本变更记录

## [0.2.8] - 2023-12-20 (改进)

### UI增强

- 添加了详细的调试信息显示功能
- 改进了错误处理和用户反馈
- 优化了响应式布局

### 功能增强

- 添加了WebAuthn凭证管理功能
- 改进了FIDO2实现和错误处理
- 完善了TEE状态监测和初始化流程

### 技术实现

- 优化了API封装层，增强了浏览器和Tauri环境兼容性
- 添加了更多单元测试
- 改进了错误处理和日志记录

### 已修改文件

- src/pages/index.tsx - 添加调试信息和错误处理
- src/pages/plugins.tsx - 优化插件页面UI和状态反馈
- src/lib/tauri-api.ts - 增强API封装，添加WebAuthn相关功能
- src-tauri/src/main.rs - 完善命令处理和错误处理
- src-tauri/tauri.conf.json - 更新版本号和配置
- CHANGES.md - 添加v0.2.8版本变更记录

## [0.2.7] - 2023-12-05 (更新)

## [0.2.6] - 2023-12-30 (UI修复)

### UI修复

- 修复了Link组件使用方式，解决了Next.js 13的兼容性问题
- 修复了"测试签名"功能，改进了结果处理逻辑
- 添加了更详细的签名请求日志，便于调试
- 添加了缺失的`getTeeStatus`导出函数

### 技术实现

- 更新了Link组件语法，移除了嵌套span标签
- 增强了签名结果处理，支持不同格式的返回值
- 确保调试日志始终显示，不受DEBUG开关影响
- 在src/lib/tauri-api.ts中导出了getTeeStatus函数

### 已修改文件

- src/pages/index.tsx - 修复Link组件使用方式和签名处理功能
- src/lib/tauri-api.ts - 增强调试日志，添加getTeeStatus函数
- CHANGES.md - 添加v0.2.6版本变更记录

## v0.2.6 (2023-09-15)

### 改进

1. 优化了Tauri环境检测逻辑，确保在不同环境下正确判断
2. 解决了Next.js Link组件使用错误问题
3. 修复了"测试签名"按钮无响应问题
4. 修复了"下载TEE插件"显示命令未实现错误

### 新增

1. 添加了专用Passkey/FIDO2签名测试页面(/test-passkey)
2. 增加了Node.js命令行测试脚本(test-tauri-passkey.js)，用于直接测试签名功能
3. 创建了调试页面(/debug)用于测试各种Tauri命令

### 文件变更

- src/pages/test-passkey.tsx (新增): 专用FIDO2 Passkey测试页面
- test-tauri-passkey.js (新增): Node.js命令行测试脚本
- src/pages/index.tsx: 添加FIDO2测试页面链接，更新版本号
- src/lib/tauri-api.ts: 优化环境检测和命令调用逻辑
- src-tauri/Cargo.toml: 依赖更新
- src-tauri/tauri.conf.json: 配置更新
- package.json: 版本更新为0.2.6

### 注意事项

- FIDO2签名功能需要在Tauri应用环境中才能正常工作
- 不同平台(Windows/macOS/Linux)的签名实现有所不同

## v0.2.7 (2024-06-19)

- 🛠️ 改进了FIDO2签名测试功能
  - 增强了Linux平台上的FIDO2设备支持检测
  - 改进了调试日志输出，便于问题诊断
  - 优化了mock实现，使测试流程更接近真实环境
  - 修复了点击测试签名按钮无响应的问题
  - 加强了错误处理和UI反馈

## v0.2.6 (2024-06-18)

- 🚀 完成了TEE插件下载和验证功能
- 🔍 新增插件管理页面
- 🔐 改进了FIDO2签名测试页面

## v0.2.5 (2024-06-17)

- 🔧 增强了TEE接口的封装
- 📝 完善了API文档
- 🐛 修复了部分UI问题

## v0.2.4 (2024-06-16)

- 🚀 实现了硬件检测功能
- 🔐 添加了FIDO2签名测试页面
- 📊 美化了主页显示

## [0.2.9] - 2023-12-16 (更新)

### FIDO2/Passkey功能修复

- 修复了Tauri环境中FIDO2/Passkey功能无法正常工作的问题
- 解决了应用无法正确检测Tauri环境，错误使用模拟数据的问题
- 增强了环境检测机制，添加多重检测方法
- 添加了专门用于诊断Tauri环境的测试页面

### 技术实现

- 重构了`tauri-api.ts`中的环境检测逻辑，增加多种检测手段:
  - 检查`window.__TAURI__`和`window.__TAURI_IPC__`对象
  - 检查URL协议和参数
  - 检查meta标签和自定义标识符
  - 添加开发模式特殊处理
- 增强了`invoke`函数实现:
  - 添加开发模式特殊处理
  - 改进动态导入Tauri API的逻辑
  - 增加多种备用调用方式
  - 增强错误处理和日志记录
- 修改了`main.rs`中的环境标识符注入方式:
  - 使用`get_webview_window`替代旧版的接口
  - 添加更完善的注入脚本
  - 添加Web Crypto API兼容性补丁

### 新增文件

- 添加了`src/pages/tauri-env-check.tsx`环境诊断页面:
  - 详细展示环境信息
  - 提供API测试功能
  - 增加调试帮助信息

### 已修改文件

- src-tauri/src/main.rs - 修改了主窗口获取方式，注入环境标识符和兼容性补丁
- src/lib/tauri-api.ts - 重构环境检测逻辑和invoke实现
- CHANGES.md - 添加本次更新记录

### 问题根本原因分析

Tauri
2.0更改了窗口API和环境变量注入方式，导致应用无法正确识别Tauri环境。此次修复通过多重检测机制和更完善的API调用处理，确保应用能够在各种环境下正确运行。

## [0.2.8] - 2024-02-10 (更新)

## [0.3.0] - 2025-05-07 (重大改进)

### FIDO2/Passkey功能全面增强

- 完全重构了WebAuthn实现，使用webauthn-rs 0.4.8库提供更稳定的生物识别验证
- 简化了WebAuthn API，移除了不必要的复杂性和状态管理，提高了代码可维护性
- 优化了前端测试页面的Base64URL处理和WebAuthn响应处理，确保跨浏览器兼容性
- 添加了详细的调试日志，方便问题定位和解决
- 研究了Passkey与Google Password Manager同步机制，明确了同步功能支持范围和条件

### 技术实现

- 改进了WebAuthn配置，使用更简单的RP ID和源设置
- 添加了完整的Base64URL编解码工具函数，解决了WebAuthn数据格式问题
- 优化了前端异步签名流程，提高了用户体验和安全性
- 采用了更现代的WebAuthn API调用方式，支持最新浏览器标准

### 关于Passkey同步功能的研究结果

- 确认Tauri应用中实现的Passkey可以与Google Password Manager同步，前提是：
  1. 使用与操作系统集成的WebAuthn API
  2. 配置正确的RP ID和源
  3. 使用discoverable credentials (以前称为resident keys)
- Passkey同步主要由操作系统和浏览器厂商管理，应用程序只需遵循标准WebAuthn协议
- 同步后的Passkey可在用户不同设备间使用，无需额外开发工作

### 已修改文件

- src-tauri/src/fido/webauthn.rs - 完全重构，简化实现
- src/pages/test-passkey.tsx - 添加更强大的WebAuthn响应处理
- CHANGES.md - 添加v0.3.0版本变更记录

## [0.3.1] - 2025-05-08 (问题修复)

### 修复严重的Tauri API调用问题

- 解决了硬件检测和FIDO2签名API失效问题
- 修复了环境检测虽然正确但API调用失败的问题
- 增强了Tauri环境中的API可用性检测和动态恢复
- 添加了命令重试机制，提高了应用稳定性

### 技术实现

- 改进了main.rs中的API注入方式:
  - 使用资源请求事件处理器提供更可靠的注入
  - 实现了稳定的window.**TAURI**.invoke方法构建
  - 添加了备用IPC通信机制确保跨平台兼容性
  - 发送自定义事件通知前端API可用
- 重构了tauri-api.ts:
  - 添加Tauri API状态跟踪逻辑
  - 实现等待API就绪的Promise包装函数
  - 添加自定义invoke方法构建逻辑
  - 在降级情况下使用备用实现
- 增强了页面检测逻辑:
  - 在index.tsx和plugins.tsx添加API就绪等待
  - 实现命令调用重试机制
  - 改善错误处理和用户反馈
  - DOM加载完成后再执行硬件检测

### 问题根本原因分析

根本问题在于Tauri 2.0的API注入时序和环境识别有差异：

1. 环境标记(**IS_TAURI_APP**)被正确注入，但window.__TAURI__对象未同步注入
2. 注入脚本可能在页面完全加载前执行，导致注入不完整
3. 某些平台上IPC接口初始化较慢，而前端代码执行过快

此次修复通过多层次的补救措施确保API在各种场景下都能正常工作，大幅提高了应用的稳定性和用户体验。

### 已修改文件

- src-tauri/src/main.rs - 改进API注入机制和事件处理
- src/lib/tauri-api.ts - 增强API状态跟踪和恢复逻辑
- src/pages/index.tsx - 添加API就绪等待和重试机制
- src/pages/plugins.tsx - 同步更新硬件检测逻辑
- CHANGES.md - 添加v0.3.1版本更新记录

## v0.3.0 - TEE钱包与Teaclave TrustZone集成

### 新增功能

1. **集成Teaclave TrustZone SDK**
   - 添加TeaclaveAdapter适配器，连接eth_wallet项目与COS72-Tauri应用
   - 实现TEE接口与以太坊钱包功能的对接
   - 支持钱包创建、交易签名、公钥获取等基础功能

2. **以太坊TEE钱包UI**
   - 新增以太坊钱包页面，提供用户友好的界面
   - 支持TEE状态显示、钱包管理和交易签名功能
   - 实现交易构建和签名流程

3. **TEE核心功能**
   - 实现TEE环境检测与初始化
   - 实现TEE命令操作接口
   - 提供线程安全的TEE访问机制

### 修复问题

1. **导航栏布局问题**
   - 统一所有页面的导航栏布局
   - 添加正确的页面链接，确保导航一致性

2. **Passkey注册错误**
   - 修复WebAuthn API权限问题
   - 移除RP ID设置，使用当前域自动设置，解决"用户或平台拒绝权限"错误

3. **TEE操作接口优化**
   - 升级perform_tee_operation函数，支持复杂操作类型
   - 改进错误处理和日志记录

### 技术细节

1. **依赖更新**
   - 添加once_cell用于线程安全的全局状态管理
   - 添加hex和serde_json用于数据处理

2. **架构改进**
   - 使用模块化设计分离TEE功能
   - 实现适配器模式连接不同TEE实现
   - 为后续实际TEE环境集成做准备

### 构建修复

1. **Tauri 2.0兼容性修复**
   - 更新tauri依赖特性配置，移除不存在的api-all特性
   - 仅保留必要的macos-private-api特性
   - 添加对应的tauri.conf.json配置

2. **异步处理优化**
   - 修复tokio线程阻塞问题，优化异步函数调用
   - 改进TEE初始化和状态检查的异步流程

3. **性能优化**
   - 添加硬件检测结果缓存，避免重复检测
   - 优化页面加载性能
   - 改进Tauri API初始化和检测流程

### 界面改进

1. **统一导航与布局**
   - 实现统一的导航组件，用于所有页面
   - 添加通用布局组件，包含导航栏和页脚
   - 标准化所有页面的结构与样式

2. **版本与错误处理**
   - 升级至v0.3.0版本
   - 改进Tauri API连接错误处理
   - 优化失败降级到模拟数据的流程

## v0.2.13 - 错误修复与性能优化

### 修复问题

1. **Tauri API初始化问题**
   - 修复在某些环境下Tauri API初始化失败的问题
   - 添加降级机制以支持模拟环境

2. **版本升级**
   - 更新应用版本号
   - 添加版本信息到UI
   - 更新依赖与API

3. **错误处理**
   - 改进错误处理与日志记录
   - 添加更友好的用户提示

### 新增特性

1. **Passkey支持**
   - 添加Passkey/WebAuthn验证功能
   - 实现生物识别支持检测

2. **调试工具**
   - 增加调试页面
   - 添加环境检测功能
   - 增强日志记录

## [0.3.3] - 2025-05-17 (WebAuthn Fix & TEE Simulation)

### WebAuthn/Passkey Fixes

- Fixed WebAuthn registration permission denied error:
  1. Removed fixed "localhost" RP ID in webauthn.rs, allowing browser to use
     current domain
  2. Updated WebAuthn configuration to use allow_credentials_for_registration
  3. Fixed challenge format and authentication flow

### TEE Wallet Enhancements

- Improved TEE wallet simulation functionality:
  1. Enhanced transaction signing with realistic mock signatures
  2. Added proper JSON operation parsing for complex TEE operations
  3. Improved public key and address generation with realistic formats
  4. Updated console messages to use English for better internationalization

### Linux Testing Support

- Added Linux testing tools for ETH wallet services:
  1. Created eth-wallet-service-mock.js to simulate TEE wallet in standard Linux
  2. Provided Dockerfile.eth-wallet-mock for containerized testing
  3. Added comprehensive documentation in ETH-WALLET-MOCK-README.md

### Internationalization

- Continued UI and server message internationalization:
  1. Converted remaining error messages from Chinese to English
  2. Standardized naming and message formats

### Modified Files

- src-tauri/src/fido/webauthn.rs - Fixed WebAuthn RP ID configuration
- src-tauri/src/tee/teaclave_adapter.rs - Enhanced TEE simulation
- src-tauri/src/main.rs - Improved operation parsing and error messaging
- src/lib/passkey-manager-simple.ts - Updated registration handling
- eth-wallet-service-mock.js - Added mock service for Linux environments
- Dockerfile.eth-wallet-mock - Added Docker support for mock service
- ETH-WALLET-MOCK-README.md - Added documentation for Linux testing
- CHANGES.md - Updated with version 0.3.3 changes

## [0.3.6] - 2025-05-10 (WebAuthn与TEE兼容性修复)

### WebAuthn修复

- 修复了WebAuthn API初始化和检测问题：
  1. 改进了Tauri API注入机制，确保`window.__TAURI__`对象正确暴露
  2. 添加了自动检测API缺失并尝试重新注入的功能
  3. 增强了降级机制，在API初始化失败时提供更明确的错误信息
  4. 添加了针对WebAuthn调试的额外日志记录

### TEE连接增强

- 改进了TEE服务连接机制：
  1. 增强了错误处理和诊断能力，提供更详细的错误信息
  2. 添加了连接重试机制，增强系统稳定性
  3. 改进了远程TEE检测逻辑，支持更可靠的自动发现
  4. 更新了OP-TEE适配器，支持Raspberry Pi 5

### 文档更新

- 更新了部署和故障排除文档：
  1. 添加了常见错误排查指南，包括API初始化和TEE连接问题
  2. 更新了RASPI-TEE-SETUP.md，适配Raspberry Pi 5
  3. 在PLAN.md中添加了WasmEdge集成计划
  4. 扩展了deploy.md，增加更多故障排除信息

### 测试增强

- 添加了自动化测试用例：
  1. 为WebAuthn初始化添加了测试场景
  2. 为TEE连接添加了模拟测试
  3. 增加了边缘情况的错误处理测试

### 修改的文件

- src-tauri/src/main.rs - 改进DOM就绪注入脚本，增加Tauri对象检测与修复逻辑
- src-tauri/src/fido/webauthn.rs - 增强错误处理和调试信息
- src-tauri/src/tee/optee_adapter.rs - 更新适配Raspberry Pi 5
- deploy.md - 添加常见错误排查部分
- RASPI-TEE-SETUP.md - 更新为Raspberry Pi 5适配
- PLAN.md - 添加WasmEdge集成计划
- CHANGES.md - 添加v0.3.6版本记录
