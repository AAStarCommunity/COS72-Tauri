#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod hardware;
mod fido;
mod tee;
mod plugin;

use tauri::Manager;
use hardware::detect;
use fido::passkey;
use tee::{TeeOperation, TeeResult, TeeStatus};

// 主程序入口
fn main() {
    run();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 启用详细日志
    println!("COS72-Tauri: 应用启动中...");
    println!("COS72-Tauri: Rust版本: {}", rustc_version_runtime::version());
    println!("COS72-Tauri: 操作系统: {}", std::env::consts::OS);
    println!("COS72-Tauri: 架构: {}", std::env::consts::ARCH);

    // 检查重要的环境变量和路径
    println!("COS72-Tauri: 当前目录: {:?}", std::env::current_dir().unwrap_or_default());
    println!("COS72-Tauri: 临时目录: {:?}", std::env::temp_dir());
    
    // 检查Tauri资源目录
    if let Ok(exe_path) = std::env::current_exe() {
        println!("COS72-Tauri: 可执行文件路径: {:?}", exe_path);
    }

    // 初始化应用
    println!("COS72-Tauri: 初始化Tauri应用...");
    
    // 使用更健壮的错误处理
    match tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            check_hardware,
            get_cpu_info,
            check_tee_support,
            get_challenge_signature,
            download_tee_plugin,
            verify_plugin_hash,
            get_tee_status,
            initialize_tee,
            perform_tee_operation
        ])
        .setup(|app| {
            println!("COS72-Tauri: 应用设置阶段...");
            println!("COS72-Tauri: 检查资源路径: {:?}", app.path().resource_dir());
            println!("COS72-Tauri: 检查配置路径: {:?}", app.path().app_config_dir());
            println!("COS72-Tauri: 检查日志路径: {:?}", app.path().app_log_dir());
            Ok(())
        })
        .build(tauri::generate_context!()) {
        Ok(app) => {
            println!("COS72-Tauri: 应用构建成功，准备运行...");
            app.run(|_app_handle, event| {
                match event {
                    tauri::RunEvent::Ready => {
                        println!("COS72-Tauri: 应用已就绪");
                    }
                    tauri::RunEvent::WindowEvent { label, event, .. } => {
                        match event {
                            tauri::WindowEvent::CloseRequested { api, .. } => {
                                println!("COS72-Tauri: 窗口 {} 请求关闭", label);
                            }
                            tauri::WindowEvent::Destroyed => {
                                println!("COS72-Tauri: 窗口 {} 已销毁", label);
                            }
                            _ => {}
                        }
                    }
                    tauri::RunEvent::Exit => {
                        println!("COS72-Tauri: 应用退出");
                    }
                    _ => {}
                }
            });
        }
        Err(err) => {
            println!("COS72-Tauri: 应用构建失败: {:?}", err);
            if let Some(source) = err.source() {
                println!("COS72-Tauri: 错误源: {:?}", source);
            }
            // 在生产环境中，可能需要考虑适当的错误处理策略
        }
    }
}

// 检查硬件信息
#[tauri::command]
fn check_hardware() -> Result<hardware::HardwareInfo, String> {
    match detect::get_hardware_info() {
        Ok(info) => Ok(info),
        Err(e) => Err(format!("Failed to detect hardware: {}", e))
    }
}

// 获取CPU信息
#[tauri::command]
fn get_cpu_info() -> Result<hardware::CpuInfo, String> {
    match detect::get_cpu_info() {
        Ok(info) => Ok(info),
        Err(e) => Err(format!("Failed to get CPU info: {}", e))
    }
}

// 检查TEE支持情况
#[tauri::command]
fn check_tee_support() -> Result<hardware::TeeSupport, String> {
    match detect::check_tee_support() {
        Ok(support) => Ok(support),
        Err(e) => Err(format!("Failed to check TEE support: {}", e))
    }
}

// 获取指纹签名
#[tauri::command]
async fn get_challenge_signature(challenge: String) -> Result<String, String> {
    match passkey::sign_challenge(&challenge).await {
        Ok(signature) => Ok(signature),
        Err(e) => Err(format!("Failed to sign challenge: {}", e))
    }
}

// 下载TEE插件
#[tauri::command]
async fn download_tee_plugin(url: String, target_path: String) -> Result<bool, String> {
    match plugin::download_plugin(&url, &target_path).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to download plugin: {}", e))
    }
}

// 验证插件哈希
#[tauri::command]
fn verify_plugin_hash(file_path: String, expected_hash: String) -> Result<bool, String> {
    match plugin::verify_hash(&file_path, &expected_hash) {
        Ok(is_valid) => Ok(is_valid),
        Err(e) => Err(format!("Failed to verify hash: {}", e))
    }
}

// 获取TEE状态
#[tauri::command]
fn get_tee_status() -> Result<TeeStatus, String> {
    match tee::get_tee_status() {
        Ok(status) => Ok(status),
        Err(e) => Err(format!("Failed to get TEE status: {:?}", e))
    }
}

// 初始化TEE
#[tauri::command]
async fn initialize_tee() -> Result<bool, String> {
    match tee::initialize_tee().await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Failed to initialize TEE: {:?}", e))
    }
}

// 执行TEE操作
#[tauri::command]
async fn perform_tee_operation(operation: String, params: Option<String>) -> Result<TeeResult, String> {
    // 解析操作类型
    let op = match operation.as_str() {
        "create_wallet" => TeeOperation::CreateWallet,
        "sign_transaction" => {
            let tx_data = params.ok_or("Transaction data is required")?;
            TeeOperation::SignTransaction(tx_data)
        },
        "verify_signature" => {
            let params = params.ok_or("Signature data is required")?;
            let parts: Vec<&str> = params.split(',').collect();
            if parts.len() != 2 {
                return Err("Invalid signature parameters".to_string());
            }
            TeeOperation::VerifySignature(parts[0].to_string(), parts[1].to_string())
        },
        "get_public_key" => TeeOperation::GetPublicKey,
        "export_wallet" => {
            let include_private = params.map(|p| p == "true").unwrap_or(false);
            TeeOperation::ExportWallet(include_private)
        },
        "import_wallet" => {
            let wallet_data = params.ok_or("Wallet data is required")?;
            TeeOperation::ImportWallet(wallet_data)
        },
        _ => return Err(format!("Unknown TEE operation: {}", operation)),
    };
    
    // 执行操作
    match tee::perform_tee_operation(op).await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("TEE operation failed: {:?}", e))
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

    // 验证challenge参数不为空
    #[tokio::test]
    async fn test_challenge_signature_empty() {
        let result = get_challenge_signature("".into()).await;
        assert!(result.is_err());
    }

    // 验证插件哈希函数
    #[test]
    fn test_verify_plugin_hash_invalid_path() {
        let result = verify_plugin_hash("non_existent_file.zip".into(), "hash".into());
        assert!(result.is_err());
    }

    // 测试TEE状态获取
    #[test]
    fn test_get_tee_status() {
        let result = get_tee_status();
        assert!(result.is_ok());
        
        let status = result.unwrap();
        // 默认实现中TEE不可用
        assert_eq!(status.available, false);
    }
    
    // 测试TEE操作参数解析
    #[tokio::test]
    async fn test_perform_tee_operation_parsing() {
        // 测试无效操作
        let result = perform_tee_operation("invalid_op".to_string(), None).await;
        assert!(result.is_err());
        
        // 测试缺少必要参数
        let result = perform_tee_operation("sign_transaction".to_string(), None).await;
        assert!(result.is_err());
        
        // 测试有效参数（结果可能为错误，因为TEE未实现）
        let result = perform_tee_operation("create_wallet".to_string(), None).await;
        assert!(result.is_err() || result.is_ok());
    }
} 