use std::io::{Error as IoError, ErrorKind};
use std::path::Path;
use std::fs::{self, File};
use std::io::copy;
use reqwest;
use sha2::{Sha256, Digest};
use hex;

// 下载插件
pub async fn download_plugin(url: &str, target_path: &str) -> Result<(), IoError> {
    // 创建目标目录（如果不存在）
    if let Some(parent) = Path::new(target_path).parent() {
        fs::create_dir_all(parent)?;
    }

    // 发起HTTP请求下载文件
    let resp = reqwest::get(url).await
        .map_err(|e| IoError::new(ErrorKind::Other, format!("Download failed: {}", e)))?;
    
    // 检查响应状态
    if !resp.status().is_success() {
        return Err(IoError::new(
            ErrorKind::Other,
            format!("Download failed with status: {}", resp.status())
        ));
    }
    
    // 获取响应体字节流
    let bytes = resp.bytes().await
        .map_err(|e| IoError::new(ErrorKind::Other, format!("Failed to read response: {}", e)))?;
    
    // 写入文件
    let mut file = File::create(target_path)?;
    let mut content = bytes.as_ref();
    copy(&mut content, &mut file)?;
    
    Ok(())
}

// 验证插件哈希
pub fn verify_hash(file_path: &str, expected_hash: &str) -> Result<bool, IoError> {
    // 读取文件
    let mut file = File::open(file_path)?;
    
    // 计算SHA-256哈希
    let mut hasher = Sha256::new();
    copy(&mut file, &mut hasher)?;
    let hash = hasher.finalize();
    
    // 将哈希转换为十六进制字符串
    let hash_hex = hex::encode(hash);
    
    // 对比哈希值
    Ok(hash_hex.eq_ignore_ascii_case(expected_hash))
}

// 获取插件列表
pub fn get_available_plugins() -> Result<Vec<String>, IoError> {
    // 获取插件目录
    let plugin_dir = get_plugin_dir()?;
    
    // 如果目录不存在，创建它
    if !plugin_dir.exists() {
        fs::create_dir_all(&plugin_dir)?;
        return Ok(Vec::new());
    }
    
    // 读取目录内容
    let entries = fs::read_dir(&plugin_dir)?;
    let mut plugins = Vec::new();
    
    // 收集.so或.dll或.dylib文件
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "so" || ext == "dll" || ext == "dylib" {
                        if let Some(name) = path.file_name() {
                            if let Some(name_str) = name.to_str() {
                                plugins.push(name_str.to_string());
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(plugins)
}

// 获取插件目录
fn get_plugin_dir() -> Result<std::path::PathBuf, IoError> {
    // 获取应用数据目录
    let app_data_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or_else(|| IoError::new(ErrorKind::NotFound, "Could not determine app data directory"))?;
    
    // 创建插件子目录
    let plugin_dir = app_data_dir.join("plugins");
    
    Ok(plugin_dir)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use tempfile::tempdir;
    
    #[test]
    fn test_get_plugin_dir() {
        let result = get_plugin_dir();
        assert!(result.is_ok());
        
        let dir = result.unwrap();
        assert!(dir.to_str().unwrap().contains("plugins"));
    }
    
    #[test]
    fn test_verify_hash_success() {
        // 创建临时目录和文件
        let temp_dir = tempdir().unwrap();
        let file_path = temp_dir.path().join("test_file.txt");
        
        // 写入测试数据
        let test_data = b"test data for hash verification";
        let mut file = File::create(&file_path).unwrap();
        file.write_all(test_data).unwrap();
        
        // 计算预期哈希
        let mut hasher = Sha256::new();
        hasher.update(test_data);
        let expected_hash = hex::encode(hasher.finalize());
        
        // 验证哈希
        let result = verify_hash(file_path.to_str().unwrap(), &expected_hash);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
    
    #[test]
    fn test_verify_hash_failure() {
        // 创建临时目录和文件
        let temp_dir = tempdir().unwrap();
        let file_path = temp_dir.path().join("test_file.txt");
        
        // 写入测试数据
        let test_data = b"test data for hash verification";
        let mut file = File::create(&file_path).unwrap();
        file.write_all(test_data).unwrap();
        
        // 使用错误的哈希
        let wrong_hash = "0000000000000000000000000000000000000000000000000000000000000000";
        
        // 验证哈希
        let result = verify_hash(file_path.to_str().unwrap(), wrong_hash);
        assert!(result.is_ok());
        assert!(!result.unwrap());
    }
    
    #[test]
    fn test_verify_hash_nonexistent_file() {
        let result = verify_hash("nonexistent_file.txt", "hash");
        assert!(result.is_err());
    }
} 