use crate::hardware::{HardwareInfo, CpuInfo, TeeSupport};
use std::io::Error as IoError;
use sysinfo::{System, SystemExt, CpuExt};

// 获取系统硬件信息
pub fn get_hardware_info() -> Result<HardwareInfo, IoError> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let cpu_info = get_cpu_info()?;
    let memory = sys.total_memory() / 1024 / 1024; // Convert to MB
    let tee_support = check_tee_support()?;
    
    Ok(HardwareInfo {
        cpu: cpu_info,
        memory,
        tee: tee_support,
    })
}

// 获取CPU信息
pub fn get_cpu_info() -> Result<CpuInfo, IoError> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let cpu = sys.global_cpu_info();
    let name = cpu.brand().to_string();
    let cores = sys.physical_core_count().unwrap_or(0) as u32;
    
    // 检测CPU架构
    #[cfg(target_arch = "x86_64")]
    let architecture = String::from("x86_64");
    #[cfg(target_arch = "x86")]
    let architecture = String::from("x86");
    #[cfg(target_arch = "arm")]
    let architecture = String::from("arm");
    #[cfg(target_arch = "aarch64")]
    let architecture = String::from("arm64");
    
    // 是否ARM架构
    #[cfg(any(target_arch = "arm", target_arch = "aarch64"))]
    let is_arm = true;
    #[cfg(not(any(target_arch = "arm", target_arch = "aarch64")))]
    let is_arm = false;
    
    Ok(CpuInfo {
        architecture,
        model_name: name,
        cores,
        is_arm,
    })
}

// 检查TEE支持情况
pub fn check_tee_support() -> Result<TeeSupport, IoError> {
    let mut tee = TeeSupport::default();

    // Intel SGX 检测
    #[cfg(target_arch = "x86_64")]
    {
        // 这里应该使用sgx-detect库或类似工具
        // 简化实现 - 实际中应该调用相关库进行检测
        tee.sgx_supported = detect_sgx_support();
        if tee.sgx_supported {
            tee.tee_type = String::from("SGX");
        }
    }
    
    // ARM TrustZone 检测
    #[cfg(any(target_arch = "arm", target_arch = "aarch64"))]
    {
        // 这里应该使用相关库进行TrustZone检测
        // 简化实现
        tee.trustzone_supported = detect_trustzone_support();
        if tee.trustzone_supported {
            tee.tee_type = String::from("TrustZone");
        }
    }
    
    // Apple Secure Enclave 检测
    #[cfg(target_os = "macos")]
    {
        // macOS上检测Secure Enclave
        tee.secure_enclave_supported = detect_secure_enclave_support();
        if tee.secure_enclave_supported {
            tee.tee_type = String::from("SecureEnclave");
        }
    }
    
    Ok(tee)
}

// Intel SGX支持检测 (简化实现)
#[cfg(target_arch = "x86_64")]
fn detect_sgx_support() -> bool {
    // 实际中应当使用CPUID指令或SGX库来检测
    // 这里简化为检查/dev/sgx是否存在
    std::path::Path::new("/dev/sgx").exists() ||
    std::path::Path::new("/dev/sgx_enclave").exists()
}

// ARM TrustZone支持检测 (简化实现)
#[cfg(any(target_arch = "arm", target_arch = "aarch64"))]
fn detect_trustzone_support() -> bool {
    // 实际中应检查Linux下OP-TEE设备节点或Android Keymaster
    // 这里简化实现为检查特定文件
    std::path::Path::new("/dev/tee0").exists() ||
    std::path::Path::new("/dev/opteearmtz00").exists()
}

// Apple Secure Enclave支持检测 (简化实现)
#[cfg(target_os = "macos")]
fn detect_secure_enclave_support() -> bool {
    // 实际中应当使用Security.framework API检测
    // 这里简化为检查是否是较新的Apple Silicon或Touch ID设备
    let cpu_info = System::new_all().global_cpu_info();
    cpu_info.brand().contains("Apple") && (
        std::env::consts::ARCH == "aarch64" || // Apple Silicon
        cpu_info.brand().contains("T1") || // Apple T1
        cpu_info.brand().contains("T2")    // Apple T2
    )
}

// 为不支持的平台提供空实现
#[cfg(not(target_arch = "x86_64"))]
fn detect_sgx_support() -> bool {
    false
}

#[cfg(not(any(target_arch = "arm", target_arch = "aarch64")))]
fn detect_trustzone_support() -> bool {
    false
}

#[cfg(not(target_os = "macos"))]
fn detect_secure_enclave_support() -> bool {
    false
} 