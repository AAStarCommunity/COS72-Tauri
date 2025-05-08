# Tauri 应用前后端通信方法指南

本文档总结了 Tauri 2.0 应用中前后端通信的三种常见模式，基于我们的演示项目中的示例实现。这些模式可以作为构建 Tauri 应用时的参考和学习资料。

## 1. 直接调用 Rust 函数

这是最基本也是最常用的通信方式，前端直接调用后端 Rust 函数并获取返回值。

### 核心实现方式

#### Rust 端 (后端)

```rust
// 1. 在 Rust 中定义带有 #[tauri::command] 标记的函数
#[tauri::command]
fn my_rust_function(param1: String, param2: i32) -> Result<String, String> {
    // 处理逻辑...
    Ok(format!("处理结果: {}, {}", param1, param2))
}

// 2. 在 main.rs 中注册命令
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            my_rust_function,
            // 其他命令...
        ])
        .run(tauri::generate_context!())
        .expect("错误: 无法启动应用");
}
```

#### TypeScript 端 (前端)

```typescript
// 使用 tauri-api.ts 中的 invoke 函数调用 Rust 命令
import { invoke } from '../lib/tauri-api';

// 调用 Rust 函数
async function callRustFunction() {
  try {
    const result = await invoke<string>('my_rust_function', { 
      param1: 'hello', 
      param2: 42 
    });
    console.log('结果:', result);
  } catch (error) {
    console.error('调用失败:', error);
  }
}
```

### 实际示例

项目中的 `detect_hardware` 函数是典型的直接调用模式示例。前端通过 invoke 函数直接调用后端，获取硬件信息。

## 2. 计算器模式 (请求-响应模式)

计算器模式适用于需要进行复杂计算或处理的场景，前端发送数据，后端处理后返回结果。

### 核心实现方式

#### Rust 端 (后端)

```rust
#[tauri::command]
fn calculate(expression: String) -> Result<f64, String> {
    // 解析表达式并计算
    match evaluate_math_expression(&expression) {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("计算错误: {}", e))
    }
}

fn evaluate_math_expression(expr: &str) -> Result<f64, String> {
    // 计算逻辑...
    // 返回计算结果或错误
}
```

#### TypeScript 端 (前端)

```typescript
import { invoke } from '../lib/tauri-api';

async function performCalculation(expression: string) {
  try {
    const result = await invoke<number>('calculate', { expression });
    return result;
  } catch (error) {
    throw new Error(`计算失败: ${error}`);
  }
}

// 在UI中使用
const handleCalculate = async () => {
  try {
    const result = await performCalculation('2 + 2 * 3');
    setResult(result); // 更新UI
  } catch (error) {
    setError(error.message);
  }
};
```

### 实际示例

项目中的 `perform_tee_operation` 函数是计算器模式的一个例子，它接收操作指令，后端执行复杂操作后返回处理结果。

## 3. 后端事件模式

事件模式适用于长时间运行的操作、异步通知或实时更新的场景，后端可以主动向前端发送消息。

### 核心实现方式

#### Rust 端 (后端)

```rust
// 1. 在启动时设置事件处理
#[tauri::command]
fn start_long_operation(window: tauri::Window) -> Result<(), String> {
    // 启动后台任务
    std::thread::spawn(move || {
        // 执行长时间运行的操作...
        
        // 在操作过程中发送进度更新
        window.emit("progress-update", 50).expect("failed to emit");
        
        // 操作完成时发送结果
        window.emit("operation-complete", "操作已完成").expect("failed to emit");
    });
    
    Ok(())
}
```

#### TypeScript 端 (前端)

```typescript
import { invoke } from '../lib/tauri-api';

// 1. 设置事件监听器
function setupEventListeners() {
  // 监听进度更新事件
  const unlistenProgress = await window.__TAURI__.event.listen('progress-update', 
    (event) => {
      console.log(`当前进度: ${event.payload}%`);
      setProgress(event.payload); // 更新UI进度条
    }
  );
  
  // 监听操作完成事件
  const unlistenComplete = await window.__TAURI__.event.listen('operation-complete', 
    (event) => {
      console.log(`操作结果: ${event.payload}`);
      setResult(event.payload);
      setIsComplete(true);
    }
  );
  
  // 返回清除函数以便在组件卸载时移除监听器
  return () => {
    unlistenProgress();
    unlistenComplete();
  };
}

// 2. 启动长时间运行的操作
async function startOperation() {
  try {
    await invoke('start_long_operation');
    setIsRunning(true);
  } catch (error) {
    console.error('启动操作失败:', error);
  }
}
```

### 实际示例

项目中的 WebAuthn 注册流程使用了事件模式的思想，后端可以发送认证状态更新事件给前端。

## 通用最佳实践

### 前端调用 Rust 的封装模式

我们的项目使用 `tauri-api.ts` 封装了 Tauri API 调用，主要优点包括：

1. **环境检测**：自动检测是否在 Tauri 环境中，不是则使用 mock 数据
2. **错误处理**：统一的错误处理和日志记录
3. **类型安全**：使用 TypeScript 泛型提供类型安全
4. **API 就绪检测**：在调用前确保 API 已初始化

### 通信原则

1. **保持简单**：避免过于复杂的通信模式，使用最适合场景的方法
2. **错误处理**：前后端都要做好错误处理和日志记录
3. **类型安全**：使用 TypeScript 和 Rust 的类型系统确保通信安全
4. **最小权限**：在 tauri.conf.json 中配置最小必要的权限
5. **异步处理**：使用 async/await 处理异步操作，避免阻塞 UI

### 调试技巧

1. **控制台日志**：在前后端都添加足够的日志记录
2. **错误代码**：使用明确的错误代码便于调试
3. **测试工具**：创建专门的调试页面测试通信功能
4. **API 状态检测**：添加 API 状态检测和诊断功能

## 结论

选择合适的通信模式取决于具体的应用场景：

- **直接调用**：简单的请求-响应操作，如获取数据
- **计算器模式**：复杂的处理任务，需要在后端执行计算
- **事件模式**：长时间运行的操作或需要推送更新的场景

通过组合这些模式，可以构建功能丰富且高效的 Tauri 应用。 