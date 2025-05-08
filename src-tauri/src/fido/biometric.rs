// 生物识别权限管理功能
// 支持检查和请求Touch ID权限

#[cfg(target_os = "macos")]
pub fn check_biometric_permission() -> Result<bool, String> {
    use std::process::Command;
    
    println!("COS72-Tauri: 开始检查Touch ID权限状态");
    
    // 检查系统版本
    let os_version = Command::new("sw_vers")
        .arg("-productVersion")
        .output()
        .map(|output| String::from_utf8_lossy(&output.stdout).trim().to_string())
        .unwrap_or_else(|_| "未知".to_string());
    
    println!("COS72-Tauri: macOS版本: {}", os_version);
    
    // 在macOS上，使用一个简单的测试命令来检测权限
    println!("COS72-Tauri: 执行权限测试命令...");
    let output = Command::new("sh")
        .arg("-c")
        .arg("security -v auth-external")
        .output();
    
    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let status = output.status;
            
            println!("COS72-Tauri: 命令执行完成，状态码: {}", status);
            println!("COS72-Tauri: 标准输出: {}", stdout);
            println!("COS72-Tauri: 错误输出: {}", stderr);
            
            // 详细分析输出
            if stderr.contains("not authorized") || stderr.contains("denied") {
                println!("COS72-Tauri: Touch ID权限状态: 未授权 (拒绝访问)");
                Ok(false)
            } else if output.status.success() {
                println!("COS72-Tauri: Touch ID权限状态: 已授权 (允许访问)");
                Ok(true)
            } else {
                println!("COS72-Tauri: Touch ID权限检查结果不明确，假设未授权");
                Ok(false)
            }
        },
        Err(e) => {
            println!("COS72-Tauri: Touch ID权限检查错误: {}", e);
            Err(format!("Touch ID检查失败: {}", e))
        }
    }
}

#[cfg(not(target_os = "macos"))]
pub fn check_biometric_permission() -> Result<bool, String> {
    println!("COS72-Tauri: 非macOS平台，不支持Touch ID权限检查");
    // 非macOS平台，认为不需要特殊权限
    Ok(true)
}

// 请求Touch ID权限
#[cfg(target_os = "macos")]
pub fn request_biometric_permission() -> Result<bool, String> {
    println!("COS72-Tauri: 开始请求Touch ID权限");
    
    // 在macOS上，通常通过尝试使用Touch ID来触发系统权限请求
    println!("COS72-Tauri: 执行权限请求命令...");
    
    // 注意：在实际项目中，可能需要使用macOS的Security框架
    // 这里使用命令行工具只是为了演示
    let output = std::process::Command::new("sh")
        .arg("-c")
        .arg("security -v auth-external")
        .output()
        .map_err(|e| format!("请求Touch ID权限失败: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    println!("COS72-Tauri: 权限请求命令执行完成，状态码: {}", output.status);
    println!("COS72-Tauri: 标准输出: {}", stdout);
    println!("COS72-Tauri: 错误输出: {}", stderr);
    
    if output.status.success() {
        println!("COS72-Tauri: Touch ID权限请求成功");
        Ok(true)
    } else {
        println!("COS72-Tauri: Touch ID权限请求失败: {}", stderr);
        // 返回false表示请求失败，但不是错误
        Ok(false)
    }
}

#[cfg(not(target_os = "macos"))]
pub fn request_biometric_permission() -> Result<bool, String> {
    println!("COS72-Tauri: 非macOS平台，不支持Touch ID权限请求");
    // 非macOS平台，直接返回成功，避免阻塞流程
    Ok(true)
} 