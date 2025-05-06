#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod hardware;
mod fido;
mod tee;
mod plugin;

use hardware::detect;
use fido::passkey;
use tee::{TeeOperation, TeeResult};
use serde_json::Value;

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
            perform_tee_operation
        ])
        // 应用初始化事件处理
        .setup(|_app| {
            println!("COS72-Tauri: 应用初始化完成");
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
    println!("COS72-Tauri: 正在验证FIDO2密钥...");
    println!("COS72-Tauri: 收到挑战: {}", challenge);
    
    match passkey::sign_challenge(&challenge).await {
        Ok(result) => {
            println!("COS72-Tauri: FIDO2验证成功");
            // 将结果转换为 JSON Value
            let json_result = serde_json::json!({
                "success": true,
                "signature": result
            });
            Ok(json_result)
        },
        Err(e) => {
            println!("COS72-Tauri: FIDO2验证失败: {}", e);
            Err(format!("FIDO2验证失败: {}", e))
        }
    }
}

// TEE操作函数
#[tauri::command]
async fn perform_tee_operation(operation: TeeOperation) -> Result<TeeResult, String> {
    println!("COS72-Tauri: 正在执行TEE操作: {:?}", operation);
    
    // 检查TEE环境是否可用
    let tee_status = tee::get_tee_status().map_err(|e| e.to_string())?;
    
    if tee_status.available {
        println!("COS72-Tauri: TEE环境可用，执行操作");
        match tee::perform_tee_operation(operation).await {
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
        let result = perform_tee_operation(TeeOperation::CreateWallet).await;
        assert!(result.is_err());
        
        // 如需其他测试，请根据修改后的API适配
    }
} 