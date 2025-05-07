// WebAuthn-rs 实现
// 基于 WebAuthn-rs 库 0.5.1 和 webauthn-authenticator-rs 0.5.0 的FIDO2/Passkey注册和验证实现

use std::time::Duration;
use base64::{Engine as _, engine::general_purpose};
use serde_json;
use url::Url;
use webauthn_rs::prelude::*;
use tracing::info;

// WebAuthn上下文
// 使用lazy_static创建全局单例
lazy_static::lazy_static! {
    static ref WEBAUTHN_INSTANCE: Webauthn = {
        // 为RP (依赖方/服务器)创建有效配置
        let rp_id = "localhost";  // 使用localhost以兼容本地开发环境
        let rp_origin = Url::parse("http://localhost:3000").expect("Invalid URL");
        
        // 创建WebAuthn构建器
        let builder = WebauthnBuilder::new(rp_id, &rp_origin)
            .expect("Failed to create WebAuthn builder")
            // 设置RP名称
            .rp_name("COS72-Tauri")
            // 超时设置
            .timeout(Duration::from_secs(60));

        builder.build().expect("Failed to build WebAuthn")
    };
}

// 创建注册挑战 - 仅供内部测试
pub fn start_registration(username: &str) -> Result<serde_json::Value, String> {
    info!("COS72-Tauri: 开始注册流程，用户名: {}", username);
    
    // 创建用户ID
    let user_id = Uuid::new_v4();
    
    // 创建注册挑战，使用PassKey流程
    match WEBAUTHN_INSTANCE.start_passkey_registration(
        user_id,
        username,
        username,
        None,  // 不附加附加凭据
    ) {
        Ok((ccr, _reg_state)) => {
            // 转换为前端需要的格式
            let challenge_json = serde_json::to_value(&ccr).map_err(|e| format!("Failed to serialize challenge: {}", e))?;
            info!("COS72-Tauri: 注册挑战创建成功，用户ID: {}", user_id);
            
            // 返回挑战和用户ID
            let mut res = serde_json::Map::new();
            res.insert("challenge".to_string(), challenge_json);
            res.insert("user_id".to_string(), serde_json::Value::String(user_id.to_string()));
            
            Ok(serde_json::Value::Object(res))
        },
        Err(e) => {
            info!("COS72-Tauri: 注册挑战创建失败: {}", e);
            Err(format!("Failed to create registration challenge: {}", e))
        }
    }
}

// 完成注册流程 - 仅供内部测试
pub fn finish_registration(user_id: &str, response: &str) -> Result<serde_json::Value, String> {
    info!("COS72-Tauri: 完成注册流程，用户ID: {}", user_id);
    
    // 将用户ID解析为UUID
    let _user_id = Uuid::parse_str(user_id)
        .map_err(|e| format!("Failed to parse user_id as UUID: {}", e))?;
    
    // 解析响应JSON
    let _reg_response: RegisterPublicKeyCredential = serde_json::from_str(response)
        .map_err(|e| format!("Failed to parse response JSON: {}", e))?;
    
    // 这里我们假设有一个存储的注册状态，但在实际应用中，这应该从数据库检索
    // 由于我们只是演示，所以这部分将失败
    Err("完成注册需要注册状态，这只是一个演示示例".to_string())
}

// 简化的验证挑战生成函数 - 用于兼容当前项目的verify_passkey命令
pub fn create_auth_challenge() -> Result<String, String> {
    // 生成一个随机挑战
    let mut challenge = [0u8; 32];
    getrandom::getrandom(&mut challenge).expect("Failed to generate random challenge");
    
    // Base64编码
    Ok(general_purpose::STANDARD.encode(challenge))
}

// 简化的验证函数 - 用于兼容当前项目的verify_passkey命令
pub async fn verify_challenge(challenge: &str) -> Result<String, String> {
    info!("COS72-Tauri: 验证挑战: {}", challenge);
    println!("COS72-Tauri: 验证挑战长度: {} 字符", challenge.len());
    println!("COS72-Tauri: 验证挑战前16字符: {}", challenge.chars().take(16).collect::<String>());
    
    // 检查操作系统类型
    let os = std::env::consts::OS;
    println!("COS72-Tauri: 当前操作系统: {}", os);
    println!("COS72-Tauri: 当前架构: {}", std::env::consts::ARCH);
    
    // 检查macOS上的权限状态
    if os == "macos" {
        println!("COS72-Tauri: 运行在macOS上，检查Touch ID权限");
        
        // 这里我们不能直接检查权限，但可以检查是否支持生物识别
        let bio_supported = is_biometric_supported();
        println!("COS72-Tauri: 生物识别支持状态: {}", bio_supported);
        
        // 检查WebAuthn支持
        let webauthn_supported = is_webauthn_supported();
        println!("COS72-Tauri: WebAuthn支持状态: {}", webauthn_supported);
        
        if !bio_supported || !webauthn_supported {
            return Err(format!("系统环境不支持必要的生物识别功能: 生物识别支持={}, WebAuthn支持={}", 
                              bio_supported, webauthn_supported));
        }
    }
    
    // 在实际应用中，我们需要从数据库检索已注册的凭证
    // 由于这是一个演示，我们将创建一个空的凭证列表并使用"userless"认证
    let passkeys: Vec<Passkey> = Vec::new();
    println!("COS72-Tauri: 准备开始WebAuthn验证，passkeys数量: {}", passkeys.len());
    
    // 开始WebAuthn验证
    match WEBAUTHN_INSTANCE.start_passkey_authentication(&passkeys) {
        Ok((rcr, _auth_state)) => {
            // 返回可序列化的挑战
            let challenge_json = serde_json::to_string(&rcr)
                .map_err(|e| format!("Failed to serialize challenge: {}", e))?;
            
            info!("COS72-Tauri: 已创建验证挑战，等待用户响应");
            println!("COS72-Tauri: 验证挑战创建成功，长度: {}", challenge_json.len());
            println!("COS72-Tauri: 验证挑战前50字符: {}...", challenge_json.chars().take(50).collect::<String>());
            
            // 返回挑战信息，前端应该使用它调用navigator.credentials.get
            Ok(challenge_json)
        },
        Err(e) => {
            info!("COS72-Tauri: 创建验证挑战失败: {}", e);
            println!("COS72-Tauri: 错误详情: {:?}", e);
            Err(format!("创建验证挑战失败: {}", e))
        }
    }
}

// 检查是否支持WebAuthn
pub fn is_webauthn_supported() -> bool {
    // 检查当前平台是否支持WebAuthn
    // 这里简化为检查操作系统类型
    let os = std::env::consts::OS;
    match os {
        "macos" | "windows" | "linux" => true,
        _ => false,
    }
}

// 检查平台是否支持生物识别
pub fn is_biometric_supported() -> bool {
    // 检查当前平台是否支持生物识别
    // 这里简化为检查操作系统类型
    let os = std::env::consts::OS;
    
    match os {
        "macos" => true,  // macOS 通常支持 Touch ID
        "windows" => true, // Windows Hello
        "linux" => false,  // Linux 通常需要外部设备
        "android" => true, // Android 通常支持指纹
        "ios" => true,     // iOS 支持 Touch ID/Face ID
        _ => false,
    }
}

// 从上下文中获取Passkey凭证
pub fn get_credentials(_user_id: &str) -> Result<serde_json::Value, String> {
    // 在实际应用中，这应该从数据库中检索用户的凭证
    // 由于这是一个演示，我们返回一个空列表
    let passkeys: Vec<Passkey> = Vec::new();
    
    match serde_json::to_value(passkeys) {
        Ok(value) => Ok(value),
        Err(e) => Err(format!("Failed to serialize credentials: {}", e)),
    }
} 