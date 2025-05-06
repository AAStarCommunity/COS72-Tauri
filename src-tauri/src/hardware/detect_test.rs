#[cfg(test)]
mod tests {
    use super::super::detect;
    use super::super::{CpuInfo, HardwareInfo, TeeSupport};

    #[test]
    fn test_get_hardware_info() {
        // 直接调用硬件检测函数
        let result = detect::get_hardware_info();
        
        // 确认函数返回成功
        assert!(result.is_ok(), "硬件检测应该成功返回");
        
        // 验证返回的数据结构完整性
        let hardware_info = result.unwrap();
        
        // 检查CPU信息是否有效
        assert!(!hardware_info.cpu.architecture.is_empty(), "CPU架构不应为空");
        assert!(!hardware_info.cpu.model_name.is_empty(), "CPU型号不应为空");
        assert!(hardware_info.cpu.cores > 0, "CPU核心数应大于0");
        
        // 检查内存信息是否有效
        assert!(hardware_info.memory > 0, "内存大小应大于0");
        
        // 内存信息打印
        println!("检测到的CPU: {}", hardware_info.cpu.model_name);
        println!("架构: {}", hardware_info.cpu.architecture);
        println!("核心数: {}", hardware_info.cpu.cores);
        println!("是ARM架构: {}", hardware_info.cpu.is_arm);
        println!("内存: {} MB", hardware_info.memory);
        println!("TEE类型: {}", hardware_info.tee.tee_type);
    }
    
    #[test]
    fn test_get_cpu_info() {
        let result = detect::get_cpu_info();
        assert!(result.is_ok(), "CPU信息检测应该成功");
        
        let cpu_info = result.unwrap();
        println!("CPU型号: {}", cpu_info.model_name);
        println!("架构: {}", cpu_info.architecture);
    }
    
    #[test]
    fn test_check_tee_support() {
        let result = detect::check_tee_support();
        assert!(result.is_ok(), "TEE支持检测应该成功");
        
        let tee_support = result.unwrap();
        println!("TEE类型: {}", tee_support.tee_type);
        println!("SGX支持: {}", tee_support.sgx_supported);
        println!("TrustZone支持: {}", tee_support.trustzone_supported);
        println!("Secure Enclave支持: {}", tee_support.secure_enclave_supported);
    }
} 