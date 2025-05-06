// 导入Testing Library的自定义匹配器
import '@testing-library/jest-dom';

// 模拟Tauri API
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: jest.fn().mockImplementation(async (cmd, args) => {
    // 默认模拟数据
    const mockData = {
      check_hardware: {
        cpu: {
          architecture: 'x86_64',
          model_name: 'Mock CPU',
          cores: 8,
          is_arm: false
        },
        memory: 16384,
        tee: {
          sgx_supported: false,
          trustzone_supported: false,
          secure_enclave_supported: false,
          tee_type: 'none'
        }
      },
      get_cpu_info: {
        architecture: 'x86_64',
        model_name: 'Mock CPU',
        cores: 8,
        is_arm: false
      },
      check_tee_support: {
        sgx_supported: false,
        trustzone_supported: false,
        secure_enclave_supported: false,
        tee_type: 'none'
      },
      get_challenge_signature: 'mock_signature_data',
      download_tee_plugin: true,
      verify_plugin_hash: true,
    };

    // 根据命令返回不同的模拟数据
    if (cmd in mockData) {
      return mockData[cmd];
    }
    
    return null;
  })
}));

// 模拟window API
jest.mock('@tauri-apps/api/window', () => ({
  appWindow: {
    close: jest.fn(),
    maximize: jest.fn(),
    minimize: jest.fn(),
    setTitle: jest.fn(),
  }
})); 