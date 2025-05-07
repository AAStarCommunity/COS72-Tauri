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

// 模拟WebAuthn状态
const mockWebAuthnState = {
  supportedPlatforms: ['macOS', 'Windows 10', 'Windows 11'],
  isBiometricSupported: navigator.platform.includes('Mac') || navigator.userAgent.includes('Windows'),
  registrations: new Map(),
  pendingChallenges: new Map()
};

// 生成随机字符串
function generateRandomString(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  return result;
}

// 生成模拟UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 设置模拟硬件配置类型的函数（用于调试）
export function setMockHardwareType(type: 'arm' | 'x86') {
  currentConfig = hardwareConfigs[type];
  console.log(`[MOCK] 设置硬件类型为: ${type}`);
  
  // 更新TEE状态
  mockTeeStatus.available = currentConfig.tee.tee_type !== 'none';
  mockTeeStatus.type_name = currentConfig.tee.tee_type !== 'none' ? currentConfig.tee.tee_type : 'Not Available';
}

// 模拟invoke函数
export async function mockInvoke(command: string, args?: Record<string, any>): Promise<any> {
  console.log(`[MOCK] Tauri invoke: ${command}`, args);
  
  switch (command) {
    case 'detect_hardware':
      // 正确处理detect_hardware命令
      console.log('[MOCK] 返回硬件信息:', currentConfig);
      return currentConfig;
    
    case 'check_hardware': // 兼容旧命名
      console.log('[MOCK] 处理旧命令名称check_hardware，返回硬件信息');
      return currentConfig;
    
    case 'get_tee_status':
      // 只有在支持TEE的设备上返回有效状态
      if (currentConfig.tee.tee_type === 'none') {
        throw new Error('TEE not supported on this device');
      }
      return mockTeeStatus;
    
    case 'initialize_tee':
      // 只有在支持TEE的设备上可以初始化
      if (currentConfig.tee.tee_type === 'none') {
        throw new Error('TEE not supported on this device');
      }
      mockTeeStatus.initialized = true;
      return true;
    
    case 'perform_tee_operation':
      // 只有在支持TEE的设备上可以执行操作
      if (currentConfig.tee.tee_type === 'none') {
        throw new Error('TEE not supported on this device');
      }
      
      // 检查操作类型 - 从Rust端接收的是字符串枚举
      if (args?.operation === 'CreateWallet') {
        mockTeeStatus.wallet_created = true;
        return { 
          success: true,
          message: "钱包创建成功",
          data: null
        };
      }
      return { 
        success: false, 
        message: "操作不支持",
        data: null
      };
    
    case 'verify_passkey':
      console.log('[MOCK] 处理verify_passkey命令，参数:', args);
      
      // 添加延迟模拟真实的生物识别过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 检查challenge是否有效
      if (!args?.challenge) {
        console.error('[MOCK] verify_passkey失败: 无效的challenge参数');
        throw new Error('缺少challenge参数');
      }
      
      console.log('[MOCK] verify_passkey执行成功');
      
      // 返回更完整的模拟签名结果，模拟WebAuthn响应格式
      return { 
        success: true, 
        signature: "MOCK_SIGNATURE:" + args.challenge.substring(0, 10) + "...", 
        authenticatorData: "mock_authenticator_data",
        clientDataJSON: {
          type: "webauthn.get",
          challenge: args.challenge,
          origin: window.location.origin
        },
        platform: navigator.platform,
        timestamp: new Date().toISOString()
      };
      
    // WebAuthn支持检测
    case 'webauthn_supported':
      return true;
    
    // 生物识别支持检测
    case 'webauthn_biometric_supported':
      return mockWebAuthnState.isBiometricSupported;
    
    // 开始WebAuthn注册流程
    case 'webauthn_start_registration':
      console.log('[MOCK] 开始WebAuthn注册流程，用户名:', args?.username);
      
      // 需要用户名参数
      if (!args?.username) {
        throw new Error('缺少username参数');
      }
      
      // 生成模拟用户ID
      const userId = generateUUID();
      console.log('[MOCK] 生成用户ID:', userId);
      
      // 创建模拟挑战
      const challenge = generateRandomString(32);
      
      // 保存挑战和用户关联，用于后续验证
      mockWebAuthnState.pendingChallenges.set(userId, {
        challenge,
        username: args.username,
        timestamp: Date.now()
      });
      
      // 创建模拟注册选项
      const registrationOptions = {
        challenge: {
          challenge: challenge,
          rp: {
            name: "COS72",
            id: window.location.hostname || "localhost"
          },
        },
        user_id: userId
      };
      
      console.log('[MOCK] 返回注册选项:', registrationOptions);
      return registrationOptions;
    
    // 完成WebAuthn注册流程
    case 'webauthn_finish_registration':
      console.log('[MOCK] 完成WebAuthn注册流程');
      
      // 需要用户ID和响应参数
      if (!args?.user_id) {
        throw new Error('缺少user_id参数');
      }
      
      if (!args?.response) {
        throw new Error('缺少response参数');
      }
      
      // 检查用户ID是否存在挂起的挑战
      if (!mockWebAuthnState.pendingChallenges.has(args.user_id)) {
        throw new Error('无效的用户ID或挑战已过期');
      }
      
      try {
        // 解析响应
        const parsedResponse = typeof args.response === 'string' 
          ? JSON.parse(args.response) 
          : args.response;
        
        // 模拟成功注册，保存凭证
        mockWebAuthnState.registrations.set(args.user_id, {
          credential: parsedResponse,
          username: mockWebAuthnState.pendingChallenges.get(args.user_id)?.username,
          created: new Date().toISOString()
        });
        
        // 清理挂起的挑战
        mockWebAuthnState.pendingChallenges.delete(args.user_id);
        
        console.log('[MOCK] 注册成功，保存凭证:', parsedResponse.id);
        
        // 返回成功结果
        return {
          status: "success",
          credential_id: parsedResponse.id
        };
      } catch (e) {
        console.error('[MOCK] 解析响应失败:', e);
        throw new Error('无效的响应格式');
      }
    
    // 获取用户凭证
    case 'webauthn_get_credentials':
      console.log('[MOCK] 获取用户凭证，用户ID:', args?.user_id);
      
      // 检查用户ID参数
      if (!args?.user_id) {
        throw new Error('缺少user_id参数');
      }
      
      // 查找用户注册的凭证
      const userCredential = mockWebAuthnState.registrations.get(args.user_id);
      
      if (userCredential) {
        console.log('[MOCK] 找到用户凭证:', userCredential);
        return {
          credentials: [
            {
              id: userCredential.credential.id,
              type: 'public-key',
              created: userCredential.created,
              lastUsed: new Date().toISOString()
            }
          ]
        };
      } else {
        console.log('[MOCK] 未找到用户凭证');
        // 返回空列表
        return { credentials: [] };
      }
    
    default:
      console.error(`[MOCK] 未实现的命令: ${command}`);
      throw new Error(`未实现的命令: ${command}`);
  }
}