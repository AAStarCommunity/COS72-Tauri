use serde::{Deserialize, Serialize};
use std::{thread, time::Duration};
use tauri::{Window, Emitter};

/// 方法1: 直接调用示例
/// 将发送的消息回显给前端
#[tauri::command]
pub fn echo_message(message: String) -> Result<String, String> {
    println!("Demo: 收到消息: {}", message);
    Ok(format!("服务器收到消息: {}", message))
}

/// 方法2: 计算器模式示例
/// 接收计算参数并返回结果
#[derive(Debug, Serialize, Deserialize)]
pub enum CalculationOperation {
    Add,
    Subtract,
    Multiply,
    Divide,
}

#[tauri::command]
pub fn perform_calculation(num1: f64, num2: f64, operation: String) -> Result<f64, String> {
    println!("Demo: 执行计算: {} {} {}", num1, operation, num2);
    
    match operation.as_str() {
        "+" => Ok(num1 + num2),
        "-" => Ok(num1 - num2),
        "*" => Ok(num1 * num2),
        "/" => {
            if num2 == 0.0 {
                Err("除数不能为零".to_string())
            } else {
                Ok(num1 / num2)
            }
        },
        _ => Err("不支持的操作".to_string())
    }
}

/// 方法3: 后端事件模式示例
/// 启动长时间运行的操作并发送进度更新
#[tauri::command]
pub fn start_long_operation(window: Window) -> Result<(), String> {
    println!("Demo: 启动长时间运行的操作");
    
    // 克隆window以便在线程中使用
    let window_clone = window.clone();
    
    // 启动线程处理长时间运行操作
    thread::spawn(move || {
        for i in 0..=10 {
            // 模拟工作
            thread::sleep(Duration::from_millis(500));
            
            // 发送进度更新事件
            let progress = i * 10;
            println!("Demo: 进度更新: {}%", progress);
            window_clone.emit("progress-update", progress).expect("发送进度更新事件失败");
        }
        
        // 操作完成时发送事件
        println!("Demo: 操作完成");
        window_clone.emit("operation-complete", "操作已成功完成").expect("发送操作完成事件失败");
    });
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_echo_message() {
        let result = echo_message("Hello".to_string());
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Hello"));
    }
    
    #[test]
    fn test_perform_calculation() {
        // 测试加法
        let add_result = perform_calculation(5.0, 3.0, "+".to_string());
        assert!(add_result.is_ok());
        assert_eq!(add_result.unwrap(), 8.0);
        
        // 测试除以零
        let div_by_zero = perform_calculation(5.0, 0.0, "/".to_string());
        assert!(div_by_zero.is_err());
    }
} 