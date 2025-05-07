/**
 * FIDO2/Passkey 直接测试示例
 * 使用: cargo run --example passkey_test "挑战字符串"
 */

use std::env;
use std::io;
use std::time::Duration;
use webauthn_rs::prelude::*;
use url::Url;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("===== WebAuthn/Passkey测试程序 =====");
    println!("操作系统: {}", std::env::consts::OS);
    println!("架构: {}", std::env::consts::ARCH);
    
    // 检查操作系统兼容性
    let os_compatible = match std::env::consts::OS {
        "macos" => true,
        "windows" => true,
        "linux" => true,
        _ => false
    };
    
    if !os_compatible {
        println!("警告: 此操作系统可能不支持WebAuthn API");
    }
    
    // macOS特定检查
    if std::env::consts::OS == "macos" {
        println!("macOS平台检测:");
        
        // 检查是否支持Touch ID
        println!("检查生物识别支持...");
        let bio_supported = check_biometric_support();
        println!("生物识别支持: {}", bio_supported);
        
        if !bio_supported {
            println!("警告: 此设备可能不支持Touch ID或生物识别功能未启用");
            println!("请确认:");
            println!("1. 设备有Touch ID传感器");
            println!("2. 已在系统偏好设置中设置Touch ID");
            println!("3. 已在系统偏好设置中允许应用使用Touch ID");
        }
    }
    
    // 尝试创建WebAuthn实例
    println!("\n正在初始化WebAuthn...");
    // 为RP (依赖方/服务器)创建有效配置
    let rp_id = "localhost";  // 使用localhost以兼容本地开发环境
    let rp_origin = Url::parse("http://localhost:3000").expect("Invalid URL");
    
    // 创建WebAuthn构建器
    let builder = WebauthnBuilder::new(rp_id, &rp_origin)
        .expect("Failed to create WebAuthn builder")
        // 设置RP名称
        .rp_name("COS72-Tauri Passkey Test")
        // 超时设置
        .timeout(Duration::from_secs(60));
    
    // 构建WebAuthn实例
    let webauthn = builder.build()
        .expect("Failed to build WebAuthn");
    
    println!("WebAuthn实例创建成功");
    
    // 手动测试验证流程
    println!("\n是否要测试WebAuthn验证流程? (y/n)");
    let mut input = String::new();
    io::stdin().read_line(&mut input)?;
    
    if input.trim().to_lowercase() == "y" {
        test_auth_flow(&webauthn)?;
    } else {
        println!("跳过验证流程测试");
    }
    
    println!("\n===== 测试完成 =====");
    Ok(())
}

// 检查生物识别支持
fn check_biometric_support() -> bool {
    // 简化的检查，在实际应用中应该有更复杂的检测
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

// 测试WebAuthn验证流程
fn test_auth_flow(webauthn: &Webauthn) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n----- 开始WebAuthn验证流程测试 -----");
    
    // 由于这是独立测试，我们使用空凭证列表
    let passkeys: Vec<Passkey> = Vec::new();
    println!("使用空凭证列表进行测试");
    
    // 开始WebAuthn验证
    match webauthn.start_passkey_authentication(&passkeys) {
        Ok((rcr, _auth_state)) => {
            // 将挑战序列化为JSON
            let challenge_json = serde_json::to_string(&rcr)
                .map_err(|e| format!("Failed to serialize challenge: {}", e))?;
            
            println!("WebAuthn挑战创建成功，长度: {}", challenge_json.len());
            println!("挑战前50字符: {}...", challenge_json.chars().take(50).collect::<String>());
            
            println!("\n在实际应用中，这个挑战将发送到前端，前端会使用navigator.credentials.get调用浏览器的WebAuthn API");
            println!("然后用户将使用生物识别确认身份，并返回签名响应");
            
            // 在实际应用中，我们会将响应发送回服务器验证
        },
        Err(e) => {
            println!("创建验证挑战失败: {}", e);
            println!("错误详情: {:?}", e);
        }
    }
    
    println!("----- WebAuthn验证流程测试完成 -----");
    Ok(())
} 