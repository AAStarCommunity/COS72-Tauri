pub mod detect;

use serde::{Serialize, Deserialize};

// 硬件信息结构
#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareInfo {
    pub cpu: CpuInfo,
    pub memory: u64, // Memory in MB
    pub tee: TeeSupport,
}

// CPU信息结构
#[derive(Debug, Serialize, Deserialize)]
pub struct CpuInfo {
    pub architecture: String,  // x86, x86_64, arm, arm64
    pub model_name: String,    // CPU型号
    pub cores: u32,            // 核心数
    pub is_arm: bool,          // 是否ARM架构
}

// TEE支持信息
#[derive(Debug, Serialize, Deserialize)]
pub struct TeeSupport {
    pub sgx_supported: bool,           // 是否支持Intel SGX
    pub trustzone_supported: bool,     // 是否支持ARM TrustZone
    pub secure_enclave_supported: bool, // 是否支持Apple Secure Enclave
    pub tee_type: String,              // 支持的TEE类型
}

impl Default for HardwareInfo {
    fn default() -> Self {
        HardwareInfo {
            cpu: CpuInfo::default(),
            memory: 0,
            tee: TeeSupport::default(),
        }
    }
}

impl Default for CpuInfo {
    fn default() -> Self {
        CpuInfo {
            architecture: String::from("unknown"),
            model_name: String::from("unknown"),
            cores: 0,
            is_arm: false,
        }
    }
}

impl Default for TeeSupport {
    fn default() -> Self {
        TeeSupport {
            sgx_supported: false,
            trustzone_supported: false,
            secure_enclave_supported: false,
            tee_type: String::from("none"),
        }
    }
} 