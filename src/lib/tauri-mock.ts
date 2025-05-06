// Tauri API mock for browser environments
// 当在非Tauri环境中运行时，提供mock实现

// 模拟不同的硬件配置
// 默认为ARM架构(Apple M4)配置
const hardwareConfigs = {
  // ARM架构 - 支持TEE
  arm: {
    cpu: {
      architecture: "aarch64",
      model_name: "Apple M4",
      cores: 10,
      is_arm: true
    },
    memory: 16384,
    tee: {
      tee_type: "SecureEnclave",
      sgx_supported: false,
      trustzone_supported: false,
      secure_enclave_supported: true
    }
  },
  // x86架构 - 不支持TEE
  x86: {
    cpu: {
      architecture: "x86_64",
      model_name: "Intel Core i7",
      cores: 8,
      is_arm: false
    },
    memory: 16384,
    tee: {
      tee_type: "none",
      sgx_supported: false,
      trustzone_supported: false,
      secure_enclave_supported: false
    }
  }
};

// 默认使用检测到的系统架构
let currentConfig = navigator.platform.includes('Mac') ? 
  (navigator.userAgent.includes('Mac OS X') && navigator.userAgent.includes('AppleWebKit') ? hardwareConfigs.arm : hardwareConfigs.x86) : 
  hardwareConfigs.x86;

// 模拟硬件信息 - 默认使用当前配置
const mockHardwareInfo = currentConfig;

// 模拟TEE状态
const mockTeeStatus = {
  available: currentConfig.tee.tee_type !== 'none',
  initialized: false,
  type_name: currentConfig.tee.tee_type !== 'none' ? currentConfig.tee.tee_type : 'Not Available',
  version: "1.0",
  wallet_created: false
};

// 设置模拟硬件配置类型的函数（用于调试）
export function setMockHardwareType(type: 'arm' | 'x86') {
  currentConfig = hardwareConfigs[type];
  console.log(`[MOCK] 设置硬件类型为: ${type}`);
  
  // 更新TEE状态
  mockTeeStatus.available = currentConfig.tee.tee_type !== 'none';
  mockTeeStatus.type_name = currentConfig.tee.tee_type !== 'none' ? currentConfig.tee.tee_type : 'Not Available';
}

// 模拟invoke函数
export function mockInvoke(command: string, args?: Record<string, any>): Promise<any> {
  console.log(`[MOCK] Tauri invoke: ${command}`, args);
  
  switch (command) {
    case 'check_hardware':
      return Promise.resolve(currentConfig);
    
    case 'get_tee_status':
      // 只有在支持TEE的设备上返回有效状态
      if (currentConfig.tee.tee_type === 'none') {
        return Promise.reject(new Error('TEE not supported on this device'));
      }
      return Promise.resolve(mockTeeStatus);
    
    case 'initialize_tee':
      // 只有在支持TEE的设备上可以初始化
      if (currentConfig.tee.tee_type === 'none') {
        return Promise.reject(new Error('TEE not supported on this device'));
      }
      mockTeeStatus.initialized = true;
      return Promise.resolve(true);
    
    case 'perform_tee_operation':
      // 只有在支持TEE的设备上可以执行操作
      if (currentConfig.tee.tee_type === 'none') {
        return Promise.reject(new Error('TEE not supported on this device'));
      }
      
      if (args?.operation === 'create_wallet') {
        mockTeeStatus.wallet_created = true;
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: false, message: "操作不支持" });
    
    case 'get_challenge_signature':
      return Promise.resolve("模拟签名结果 - 实际Tauri环境中会返回真实签名");
    
    default:
      return Promise.reject(new Error(`未实现的命令: ${command}`));
  }
} 