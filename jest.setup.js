// 导入Testing Library的自定义匹配器
import '@testing-library/jest-dom';

// jest.setup.js
global.window = global;

// 模拟Tauri API，不再依赖@tauri-apps/api/tauri
jest.mock('./src/lib/tauri-api', () => ({
  invoke: jest.fn().mockImplementation(async (cmd, args) => {
    // 默认模拟数据
    const mockData = {
      detect_hardware: {
        cpu: {
          architecture: "arm64",
          model_name: "Apple M1",
          cores: 8,
          is_arm: true
        },
        memory: 17179869184, // 16GB
        tee: {
          tee_type: "secure_enclave",
          sgx_supported: false,
          trustzone_supported: false,
          secure_enclave_supported: true
        }
      },
      get_tee_status: {
        available: true,
        initialized: false,
        type_name: "Apple Secure Enclave",
        version: "1.0",
        wallet_created: false
      },
      test_api_connection: "API连接正常工作，版本0.4.7"
    };

    // 返回对应命令的模拟数据
    return mockData[cmd] || { success: true, message: "Operation completed" };
  }),
  isTauriEnvironment: jest.fn().mockReturnValue(false),
  waitForTauriApi: jest.fn().mockResolvedValue(false),
  refreshTauriApi: jest.fn().mockResolvedValue(false),
  detectHardware: jest.fn().mockImplementation(async () => {
    return {
      cpu: {
        architecture: "arm64",
        model_name: "Apple M1",
        cores: 8,
        is_arm: true
      },
      memory: 17179869184, // 16GB
      tee: {
        tee_type: "secure_enclave",
        sgx_supported: false,
        trustzone_supported: false,
        secure_enclave_supported: true
      }
    };
  }),
  getTeeStatus: jest.fn().mockResolvedValue({
    available: true,
    initialized: false,
    type_name: "Apple Secure Enclave",
    version: "1.0",
    wallet_created: false
  })
}));

// 全局模拟
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    ok: true
  })
);

// 模拟窗口对象
global.__IS_TAURI_APP__ = false;

// 模拟window API - 不再依赖@tauri-apps/api/window
jest.mock('./src/lib/tauri-window', () => ({
  appWindow: {
    close: jest.fn(),
    maximize: jest.fn(),
    minimize: jest.fn(),
    setTitle: jest.fn(),
  }
})); 