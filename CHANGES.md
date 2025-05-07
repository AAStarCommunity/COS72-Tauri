# COS72-Tauri 变更日志

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
Tauri 2.0更改了窗口API和环境变量注入方式，导致应用无法正确识别Tauri环境。此次修复通过多重检测机制和更完善的API调用处理，确保应用能够在各种环境下正确运行。

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
  - 实现了稳定的window.__TAURI__.invoke方法构建
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
1. 环境标记(__IS_TAURI_APP__)被正确注入，但window.__TAURI__对象未同步注入
2. 注入脚本可能在页面完全加载前执行，导致注入不完整
3. 某些平台上IPC接口初始化较慢，而前端代码执行过快

此次修复通过多层次的补救措施确保API在各种场景下都能正常工作，大幅提高了应用的稳定性和用户体验。

### 已修改文件
- src-tauri/src/main.rs - 改进API注入机制和事件处理
- src/lib/tauri-api.ts - 增强API状态跟踪和恢复逻辑
- src/pages/index.tsx - 添加API就绪等待和重试机制
- src/pages/plugins.tsx - 同步更新硬件检测逻辑
- CHANGES.md - 添加v0.3.1版本更新记录