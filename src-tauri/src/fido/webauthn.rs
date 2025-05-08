// WebAuthn-rs Implementation
// Based on WebAuthn-rs library 0.5.1 and webauthn-authenticator-rs 0.5.1
// Implementation of FIDO2/Passkey registration and verification

use std::time::Duration;
use std::collections::HashMap;
use std::sync::Mutex;
use base64::{Engine as _, engine::general_purpose};
use serde_json::Value;
use url::Url;
use webauthn_rs::prelude::*;
use tracing::info;
use uuid::Uuid;
use serde_json::json;
use webauthn_rs::Webauthn;
use webauthn_rs_core::proto::UserVerificationPolicy;

// Global registration state store (for testing only)
// In a real application, this would be persisted in a database
lazy_static::lazy_static! {
    static ref REGISTRATION_STATES: Mutex<HashMap<String, PasskeyRegistration>> = Mutex::new(HashMap::new());
    static ref REGISTERED_PASSKEYS: Mutex<HashMap<String, Passkey>> = Mutex::new(HashMap::new());

    // WebAuthn context
    static ref WEBAUTHN_INSTANCE: Webauthn = {
        // Create valid configuration for RP (Relying Party/Server)
        // Empty rp_id will use effective domain 
        let rp_id = "";  // Empty to let browser use current domain
        let rp_origin = Url::parse("https://cos72.app").expect("Invalid URL");
        
        // Create WebAuthn builder
        let builder = WebauthnBuilder::new(rp_id, &rp_origin)
            .expect("Failed to create WebAuthn builder")
            // Set RP name
            .rp_name("COS72-Tauri")
            // Timeout setting
            .timeout(Duration::from_secs(60));

        builder.build().expect("Failed to build WebAuthn")
    };
}

// Helper function to convert credential ID to string
fn credential_id_to_string(cred_id: &webauthn_rs::prelude::CredentialID) -> String {
    // Use Base64 encoding for credential ID
    general_purpose::URL_SAFE_NO_PAD.encode(cred_id.as_ref())
}

// Start registration process
pub fn start_registration(username: &str) -> Result<Value, String> {
    println!("COS72-Tauri: 开始WebAuthn注册流程，用户名: {}", username);
    
    // 创建更安全的用户ID
    let user_id = Uuid::new_v4();
    println!("COS72-Tauri: 生成用户ID: {}", user_id);
    
    // 创建WebAuthn实例
    println!("COS72-Tauri: 创建WebAuthn配置，使用自动RP ID");
    
    // 使用已存在的WebAuthn实例
    println!("COS72-Tauri: 使用已存在的WebAuthn实例");
    
    let webauthn = &*WEBAUTHN_INSTANCE;
    
    println!("COS72-Tauri: WebAuthn实例获取成功");
    
    // 改进注册选项，明确需要平台验证器
    println!("COS72-Tauri: 创建注册选项...");
    let policy = UserVerificationPolicy::Required;
    let (ccr, reg_state) = match webauthn.start_passkey_registration(
        user_id,
        username,
        username,
        None,
    ) {
        Ok(result) => result,
        Err(e) => {
            println!("COS72-Tauri: 注册开始失败: {}", e);
            return Err(format!("注册开始失败: {}", e));
        }
    };
    
    println!("COS72-Tauri: 成功创建注册请求");
    println!("COS72-Tauri: 注册状态类型: {:?}", reg_state);
    
    // 保存注册状态到全局存储
    let mut states = REGISTRATION_STATES.lock().unwrap();
    states.insert(user_id.to_string(), reg_state);
    
    // 将注册挑战数据转换为前端格式
    println!("COS72-Tauri: 构建前端注册数据...");
    
    // 将ccr转换为JSON值
    let ccr_json = match serde_json::to_value(&ccr) {
        Ok(v) => v,
        Err(e) => {
            println!("COS72-Tauri: 序列化挑战数据失败: {}", e);
            return Err(format!("序列化挑战数据失败: {}", e));
        }
    };
    
    // 构建结果JSON，包含挑战和用户ID
    let result = json!({
        "challenge": ccr_json,
        "user_id": user_id.to_string()
    });
    
    println!("COS72-Tauri: 返回注册信息: {}", result);
    Ok(result)
}

// Complete registration process
pub fn finish_registration(user_id: &str, response: &str) -> Result<serde_json::Value, String> {
    info!("COS72-Tauri: Completing registration process, user ID: {}", user_id);
    
    // Parse user ID to UUID (underscore prefix to indicate it's not directly used)
    let _uuid = Uuid::parse_str(user_id)
        .map_err(|e| format!("Failed to parse user_id as UUID: {}", e))?;
    
    // Parse response JSON
    let reg_response: RegisterPublicKeyCredential = serde_json::from_str(response)
        .map_err(|e| format!("Failed to parse response JSON: {}", e))?;
    
    // Retrieve registration state
    let reg_state = {
        let states = REGISTRATION_STATES.lock().unwrap();
        match states.get(user_id) {
            Some(state) => state.clone(),
            None => return Err(format!("No registration state found for user ID: {}", user_id))
        }
    };
    
    // Complete registration
    match WEBAUTHN_INSTANCE.finish_passkey_registration(&reg_response, &reg_state) {
        Ok(passkey) => {
            info!("COS72-Tauri: Registration completed successfully for user ID: {}", user_id);
            
            // Store the passkey
            {
                let mut passkeys = REGISTERED_PASSKEYS.lock().unwrap();
                passkeys.insert(user_id.to_string(), passkey.clone());
            }
            
            // Remove registration state
            {
                let mut states = REGISTRATION_STATES.lock().unwrap();
                states.remove(user_id);
            }
            
            // Return success
            let result = serde_json::json!({
                "status": "success",
                "user_id": user_id,
                "credential_id": credential_id_to_string(passkey.cred_id()),
                "registered_at": chrono::Utc::now().to_rfc3339(),
            });
            
            Ok(result)
        },
        Err(e) => {
            info!("COS72-Tauri: Registration failed: {}", e);
            Err(format!("Registration failed: {}", e))
        }
    }
}

// Create authentication challenge - simplified for current project's verify_passkey command
pub fn create_auth_challenge() -> Result<String, String> {
    // Generate a random challenge
    let mut challenge = [0u8; 32];
    getrandom::getrandom(&mut challenge).expect("Failed to generate random challenge");
    
    // Base64 encode
    Ok(general_purpose::STANDARD.encode(challenge))
}

// Verify challenge - compatible with current project's verify_passkey command
pub async fn verify_challenge(challenge: &str) -> Result<String, String> {
    info!("COS72-Tauri: Verifying challenge: {}", challenge);
    println!("COS72-Tauri: Challenge length: {} characters", challenge.len());
    println!("COS72-Tauri: First 16 characters of challenge: {}", challenge.chars().take(16).collect::<String>());
    
    // Check OS type
    let os = std::env::consts::OS;
    println!("COS72-Tauri: Current OS: {}", os);
    println!("COS72-Tauri: Current architecture: {}", std::env::consts::ARCH);
    
    // Check permissions on macOS
    if os == "macos" {
        println!("COS72-Tauri: Running on macOS, checking Touch ID permissions");
        
        // We can't directly check permissions, but we can check if biometric is supported
        let bio_supported = is_biometric_supported();
        println!("COS72-Tauri: Biometric support status: {}", bio_supported);
        
        // Check WebAuthn support
        let webauthn_supported = is_webauthn_supported();
        println!("COS72-Tauri: WebAuthn support status: {}", webauthn_supported);
        
        if !bio_supported || !webauthn_supported {
            return Err(format!("System environment doesn't support necessary biometric functions: bio_supported={}, webauthn_supported={}", 
                              bio_supported, webauthn_supported));
        }
    }
    
    // Get registered passkeys
    let passkeys = {
        let registered = REGISTERED_PASSKEYS.lock().unwrap();
        registered.values().cloned().collect::<Vec<Passkey>>()
    };
    
    println!("COS72-Tauri: Ready to start WebAuthn verification, passkeys count: {}", passkeys.len());
    
    // Start WebAuthn verification
    match WEBAUTHN_INSTANCE.start_passkey_authentication(&passkeys) {
        Ok((rcr, _auth_state)) => {
            // Return serializable challenge
            let challenge_json = serde_json::to_string(&rcr)
                .map_err(|e| format!("Failed to serialize challenge: {}", e))?;
            
            info!("COS72-Tauri: Created verification challenge, waiting for user response");
            println!("COS72-Tauri: Verification challenge created successfully, length: {}", challenge_json.len());
            println!("COS72-Tauri: First 50 characters of verification challenge: {}...", challenge_json.chars().take(50).collect::<String>());
            
            // Return challenge info, frontend should use it to call navigator.credentials.get
            Ok(challenge_json)
        },
        Err(e) => {
            info!("COS72-Tauri: Failed to create verification challenge: {}", e);
            println!("COS72-Tauri: Error details: {:?}", e);
            Err(format!("Failed to create verification challenge: {}", e))
        }
    }
}

// Complete authentication process
pub fn finish_authentication(response: &str) -> Result<serde_json::Value, String> {
    info!("COS72-Tauri: Completing authentication process");
    
    // Parse authentication response
    let auth_response: PublicKeyCredential = serde_json::from_str(response)
        .map_err(|e| format!("Failed to parse authentication response: {}", e))?;
    
    // Get registered passkeys
    let passkeys = {
        let registered = REGISTERED_PASSKEYS.lock().unwrap();
        registered.values().cloned().collect::<Vec<Passkey>>()
    };
    
    // Create an authentication state - for actual implementation this would be retrieved from storage
    let auth_state = WEBAUTHN_INSTANCE.start_passkey_authentication(&passkeys)
        .map_err(|e| format!("Failed to create authentication state: {}", e))?
        .1;
    
    // Finish authentication
    match WEBAUTHN_INSTANCE.finish_passkey_authentication(&auth_response, &auth_state) {
        Ok(auth_result) => {
            // Use the method to get credential ID and convert it to string
            let cred_id_str = credential_id_to_string(auth_result.cred_id());
            info!("COS72-Tauri: Authentication successful for credential ID: {}", cred_id_str);
            
            // Return success result
            let result = serde_json::json!({
                "status": "success",
                "credential_id": cred_id_str,
                "user_verified": auth_result.user_verified(),
                "authenticated_at": chrono::Utc::now().to_rfc3339(),
            });
            
            Ok(result)
        },
        Err(e) => {
            info!("COS72-Tauri: Authentication failed: {}", e);
            Err(format!("Authentication failed: {}", e))
        }
    }
}

// Check if WebAuthn is supported
pub fn is_webauthn_supported() -> bool {
    // Check if current platform supports WebAuthn
    // Simplified to check OS type
    let os = std::env::consts::OS;
    match os {
        "macos" | "windows" | "linux" => true,
        _ => false,
    }
}

// Check if platform supports biometric
pub fn is_biometric_supported() -> bool {
    // Check if current platform supports biometric
    // Simplified to check OS type
    let os = std::env::consts::OS;
    
    match os {
        "macos" => true,  // macOS typically supports Touch ID
        "windows" => true, // Windows Hello
        "linux" => false,  // Linux typically requires external device
        "android" => true, // Android typically supports fingerprint
        "ios" => true,     // iOS supports Touch ID/Face ID
        _ => false,
    }
}

// Get Passkey credentials from context
pub fn get_credentials(user_id: &str) -> Result<serde_json::Value, String> {
    // In a real application, this would retrieve credentials from database
    // Get credentials for the specified user ID
    let passkeys = {
        let registered = REGISTERED_PASSKEYS.lock().unwrap();
        match registered.get(user_id) {
            Some(passkey) => vec![passkey.clone()],
            None => Vec::new()
        }
    };
    
    // Return all registered passkeys for debug purposes
    let all_passkeys = {
        let registered = REGISTERED_PASSKEYS.lock().unwrap();
        registered.len()
    };
    
    println!("COS72-Tauri: Retrieving credentials for user ID: {}", user_id);
    println!("COS72-Tauri: Found {} passkeys for this user (total registered: {})", 
             passkeys.len(), all_passkeys);
    
    match serde_json::to_value(passkeys) {
        Ok(value) => Ok(value),
        Err(e) => Err(format!("Failed to serialize credentials: {}", e)),
    }
} 