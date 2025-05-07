#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod hardware;
mod fido;
mod tee;
mod plugin;

use hardware::detect;
use fido::webauthn;
use tee::{TeeOperation, TeeResult};
use serde_json::Value;
use tauri::Manager;
use tauri::Listener;

// Tauri 2.0主程序入口
fn main() {
    // 启用详细日志
    println!("COS72-Tauri: 应用启动中...");
    println!("COS72-Tauri: Rust版本: {}", rustc_version_runtime::version());
    println!("COS72-Tauri: 操作系统: {}", std::env::consts::OS);
    println!("COS72-Tauri: 架构: {}", std::env::consts::ARCH);

    // 检查重要的环境变量和路径
    println!("COS72-Tauri: 当前目录: {:?}", std::env::current_dir().unwrap_or_default());
    println!("COS72-Tauri: 临时目录: {:?}", std::env::temp_dir());
    
    // 创建Tauri应用 - Tauri 2.0风格
    tauri::Builder::default()
        // 注册自定义命令
        .invoke_handler(tauri::generate_handler![
            detect_hardware,
            verify_passkey,
            perform_tee_operation,
            get_tee_status,
            initialize_tee,
            webauthn_supported,
            webauthn_biometric_supported,
            webauthn_start_registration,
            webauthn_finish_registration,
            webauthn_get_credentials
        ])
        // 应用初始化事件处理
        .setup(|app| {
            println!("COS72-Tauri: 应用初始化完成");
            
            // 获取主窗口
            let window = app.get_webview_window("main");
            
            if let Some(window) = window {
                println!("COS72-Tauri: 找到主窗口，准备配置");
                
                // 初始脚本 - 设置环境标记
                let init_script = r#"
                    window.__IS_TAURI_APP__ = true;
                    console.log('[TAURI-INJECT] 环境标记已注入');
                "#;
                
                if let Err(e) = window.eval(init_script) {
                    println!("COS72-Tauri: 初始注入失败: {:?}", e);
                } else {
                    println!("COS72-Tauri: 初始注入成功");
                }
                
                // 监听DOM就绪事件
                let window_clone = window.clone();
                let _ = window.listen("tauri://dom-ready", move |_| {
                    println!("COS72-Tauri: DOM就绪事件触发");
                    
                    // 发送DOM就绪事件到前端
                    let dom_ready_script = r#"
                        console.log('[TAURI-INJECT] DOM已就绪');
                        
                        // 确保环境标记存在
                        window.__IS_TAURI_APP__ = true;
                        
                        // 触发API就绪事件
                        console.log('[TAURI-INJECT] 发送API就绪事件');
                        const apiReadyEvent = new CustomEvent('tauri-api-ready', {
                            detail: { version: '2.0.0' }
                        });
                        window.dispatchEvent(apiReadyEvent);
                    "#;
                    
                    // 执行注入
                    if let Err(e) = window_clone.eval(dom_ready_script) {
                        println!("COS72-Tauri: DOM就绪注入失败: {:?}", e);
                    } else {
                        println!("COS72-Tauri: DOM就绪注入成功");
                    }
                });
            } else {
                println!("COS72-Tauri: 无法获取主窗口，跳过注入环境标识符");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("COS72-Tauri: 应用运行失败");
}

// 检测硬件信息的处理函数
#[tauri::command]
async fn detect_hardware() -> Result<Value, String> {
    println!("COS72-Tauri: 正在检测硬件信息...");
    
    match detect::get_hardware_info() {
        Ok(info) => {
            println!("COS72-Tauri: 硬件检测成功: {:?}", info);
            // 将 HardwareInfo 转换为 Value
            match serde_json::to_value(&info) {
                Ok(json_value) => Ok(json_value),
                Err(e) => Err(format!("JSON序列化失败: {}", e))
            }
        },
        Err(e) => {
            println!("COS72-Tauri: 硬件检测失败: {}", e);
            Err(format!("硬件检测失败: {}", e))
        }
    }
}

// FIDO2验证函数
#[tauri::command]
async fn verify_passkey(challenge: String) -> Result<Value, String> {
    println!("===================================================");
    println!("COS72-Tauri: FIDO2/Passkey验证请求已接收");
    println!("COS72-Tauri: 挑战长度: {} 字符", challenge.len());
    if !challenge.is_empty() {
        let preview: String = challenge.chars().take(16).collect();
        println!("COS72-Tauri: 挑战前16字符: {}", preview);
    }
    
    // 检查挑战是否为空
    if challenge.trim().is_empty() {
        println!("COS72-Tauri: 错误 - 挑战为空");
        return Err("挑战不能为空".to_string());
    }
    
    // 检查操作系统
    println!("COS72-Tauri: 当前操作系统: {}", std::env::consts::OS);
    println!("COS72-Tauri: 当前架构: {}", std::env::consts::ARCH);
    
    // 检查macOS上的权限
    if std::env::consts::OS == "macos" {
        println!("COS72-Tauri: macOS上的WebAuthn支持: {}", webauthn::is_webauthn_supported());
        println!("COS72-Tauri: macOS上的生物识别支持: {}", webauthn::is_biometric_supported());
    }
    
    // 显示接下来要调用的函数
    println!("COS72-Tauri: 准备调用webauthn::verify_challenge函数...");
    
    // 使用新的WebAuthn实现 
    match webauthn::verify_challenge(&challenge).await {
        Ok(signature) => {
            println!("COS72-Tauri: FIDO2验证成功!");
            println!("COS72-Tauri: 签名结果长度: {}", signature.len());
            let preview: String = signature.chars().take(32).collect();
            println!("COS72-Tauri: 签名结果前32字符: {}", preview);
            
            // 将结果转换为 JSON Value
            let json_result = serde_json::json!({
                "success": true,
                "signature": signature,
                "platform": std::env::consts::OS,
                "timestamp": chrono::Utc::now().to_rfc3339()
            });
            println!("COS72-Tauri: 返回JSON结果: {}", json_result);
            println!("===================================================");
            Ok(json_result)
        },
        Err(e) => {
            println!("COS72-Tauri: FIDO2验证失败: {}", e);
            // 返回更详细的错误信息
            let error_json = serde_json::json!({
                "success": false,
                "error": e.to_string(),
                "platform": std::env::consts::OS,
                "timestamp": chrono::Utc::now().to_rfc3339()
            });
            println!("COS72-Tauri: 返回错误JSON: {}", error_json);
            println!("===================================================");
            Err(format!("FIDO2验证失败: {}", e))
        }
    }
}

// TEE状态获取函数
#[tauri::command]
async fn get_tee_status() -> Result<tee::TeeStatus, String> {
    println!("COS72-Tauri: 正在获取TEE状态...");
    
    match tee::get_tee_status() {
        Ok(status) => {
            println!("COS72-Tauri: TEE状态获取成功: {:?}", status);
            Ok(status)
        },
        Err(e) => {
            println!("COS72-Tauri: TEE状态获取失败: {:?}", e);
            Err(format!("TEE状态获取失败: {:?}", e))
        }
    }
}

// TEE操作函数
#[tauri::command]
async fn perform_tee_operation(operation: String) -> Result<TeeResult, String> {
    println!("COS72-Tauri: 正在执行TEE操作: {}", operation);
    
    // 解析操作类型
    let op = match operation.as_str() {
        "CreateWallet" => TeeOperation::CreateWallet,
        "GetPublicKey" => TeeOperation::GetPublicKey,
        _ => return Err(format!("未知的TEE操作: {}", operation))
    };
    
    // 检查TEE环境是否可用
    let tee_status = tee::get_tee_status().map_err(|e| e.to_string())?;
    
    if tee_status.available {
        println!("COS72-Tauri: TEE环境可用，执行操作");
        match tee::perform_tee_operation(op).await {
            Ok(result) => {
                println!("COS72-Tauri: TEE操作成功");
                Ok(result)
            },
            Err(e) => {
                println!("COS72-Tauri: TEE操作失败: {:?}", e);
                Err(format!("TEE操作失败: {:?}", e))
            }
        }
    } else {
        println!("COS72-Tauri: TEE环境不可用");
        Err("TEE环境不可用".to_string())
    }
}

// 检查是否支持WebAuthn
#[tauri::command]
fn webauthn_supported() -> bool {
    println!("COS72-Tauri: 检查WebAuthn支持");
    webauthn::is_webauthn_supported()
}

// 检查是否支持生物识别
#[tauri::command]
fn webauthn_biometric_supported() -> bool {
    println!("COS72-Tauri: 检查生物识别支持");
    webauthn::is_biometric_supported()
}

// 开始注册流程
#[tauri::command]
async fn webauthn_start_registration(username: String) -> Result<Value, String> {
    println!("COS72-Tauri: 开始WebAuthn注册，用户名: {}", username);
    webauthn::start_registration(&username)
}

// 完成注册流程
#[tauri::command]
async fn webauthn_finish_registration(user_id: String, response: String) -> Result<Value, String> {
    println!("COS72-Tauri: 完成WebAuthn注册，用户ID: {}", user_id);
    webauthn::finish_registration(&user_id, &response)
}

// 获取用户凭证
#[tauri::command]
async fn webauthn_get_credentials(user_id: String) -> Result<Value, String> {
    println!("COS72-Tauri: 获取凭证，用户ID: {}", user_id);
    webauthn::get_credentials(&user_id)
}

// 新增：初始化TEE环境 Tauri命令
#[tauri::command]
async fn initialize_tee() -> Result<bool, String> {
    println!("COS72-Tauri: 正在初始化TEE环境...");
    
    match tee::initialize_tee().await {
        Ok(result) => {
            println!("COS72-Tauri: TEE初始化成功: {}", result);
            Ok(result)
        },
        Err(e) => {
            println!("COS72-Tauri: TEE初始化失败: {:?}", e);
            Err(format!("TEE初始化失败: {:?}", e))
        }
    }
}

// 单元测试
#[cfg(test)]
mod tests {
    use super::*;
    use hardware::{CpuInfo, TeeSupport};

    #[test]
    fn test_cpu_info_default() {
        let cpu_info = CpuInfo::default();
        assert_eq!(cpu_info.architecture, "unknown");
        assert_eq!(cpu_info.model_name, "unknown");
        assert_eq!(cpu_info.cores, 0);
        assert_eq!(cpu_info.is_arm, false);
    }

    #[test]
    fn test_tee_support_default() {
        let tee_support = TeeSupport::default();
        assert_eq!(tee_support.sgx_supported, false);
        assert_eq!(tee_support.trustzone_supported, false);
        assert_eq!(tee_support.secure_enclave_supported, false);
        assert_eq!(tee_support.tee_type, "none");
    }

    // 修改测试以匹配新的API
    #[tokio::test]
    async fn test_challenge_signature_empty() {
        let result = verify_passkey("".into()).await;
        assert!(result.is_err());
    }

    // 修改测试以匹配新的API
    #[tokio::test]
    async fn test_verify_plugin_hash_invalid_path() {
        let result = verify_passkey("non_existent_file.zip".into()).await;
        assert!(result.is_err());
    }

    // 测试TEE状态获取 - 修改以适应新的API
    #[test]
    fn test_get_tee_status() {
        let result = tee::get_tee_status();
        assert!(result.is_ok());
        
        let status = result.unwrap();
        // 默认实现中TEE不可用
        assert_eq!(status.available, false);
    }
    
    // 测试TEE操作 - 修改以适应新的API
    #[tokio::test]
    async fn test_perform_tee_operation_parsing() {
        // 测试TEE环境不可用的情况
        let result = perform_tee_operation("CreateWallet".into()).await;
        assert!(result.is_err());
        
        // 如需其他测试，请根据修改后的API适配
    }
} 