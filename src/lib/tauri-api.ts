// Tauri API wrapper for compatibility
import { mockInvoke, setMockHardwareType } from './tauri-mock';

// 扩展Window接口，添加Tauri相关属性
declare global {
  interface Window {
    __IS_TAURI_APP__?: boolean;
    __TAURI__?: any;
    __TAURI_IPC__?: any;
  }
}

// 标记Tauri环境状态
let isTauriEnv: boolean | null = null;

// 版本号
const VERSION = '0.3.0';

// 调试模式
const DEBUG = true;

// 调试日志函数
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log(`[TAURI-API-${VERSION}]`, ...args);
  }
}

// 缓存检测结果
let cachedHardwareInfo: any = null;

// 检测是否在Tauri环境中运行
export async function isTauriEnvironment(): Promise<boolean> {
  // 如果已经检测过，直接返回结果
  if (isTauriEnv !== null) {
    return isTauriEnv;
  }
  
  try {
    debugLog('检测Tauri环境');
    
    // 检查基本标记
    if (typeof window !== 'undefined') {
      // 首先检查环境标记
      if (window.__IS_TAURI_APP__) {
        debugLog('检测到__IS_TAURI_APP__标记');
        
        // 检查官方API对象
        if (window.__TAURI__) {
          debugLog('检测到官方__TAURI__对象，确认Tauri环境');
          isTauriEnv = true;
          return true;
        }
        
        // 尝试动态导入官方API，即使没有window.__TAURI__
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          // 尝试执行一个简单命令以确认API可用
          await invoke('detect_hardware');
          debugLog('官方API可用，确认Tauri环境');
          isTauriEnv = true;
          return true;
        } catch (e) {
          debugLog('尝试导入官方API失败，但环境标记存在', e);
          // 因为环境标记存在，我们仍然认为在Tauri环境中
          isTauriEnv = true;
          return true;
        }
      }

      // 尝试动态导入官方API，即使没有环境标记
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        // 尝试执行一个简单命令以确认API可用
        await invoke('detect_hardware');
        debugLog('官方API可用，确认Tauri环境，尽管没有环境标记');
        isTauriEnv = true;
        return true;
      } catch (e) {
        debugLog('尝试导入官方API失败', e);
      }
    }
    
    debugLog('不在Tauri环境中');
    isTauriEnv = false;
    return false;
  } catch (error) {
    debugLog('环境检测出错:', error);
    isTauriEnv = false;
    return false;
  }
}

// 使用官方API进行调用
async function callWithOfficialApi<T>(command: string, args?: Record<string, any>): Promise<T> {
  try {
    debugLog(`使用官方API调用: ${command}`);
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(command, args);
  } catch (error) {
    debugLog(`官方API调用失败: ${command}`, error);
    throw error;
  }
}

// API调用函数
export async function invoke<T>(command: string, args?: Record<string, any>): Promise<T> {
  debugLog(`调用命令: ${command}`, args);
  
  // 快速检查 - 如果window.__TAURI__已直接可用，立即使用官方API
  if (typeof window !== 'undefined' && window.__TAURI__) {
    try {
      debugLog(`直接使用Tauri API: ${command}`);
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(command, args);
    } catch (error) {
      debugLog(`Tauri API直接调用失败: ${command}`, error);
      // 直接错误传递，不进行复杂的降级流程，简化逻辑提高性能
      throw error;
    }
  }
  
  // 如果没有直接可用的Tauri环境，完整检查环境
  const inTauriEnv = await isTauriEnvironment();
  
  // 在Tauri环境中使用官方API
  if (inTauriEnv) {
    try {
      return await callWithOfficialApi<T>(command, args);
    } catch (error) {
      debugLog(`官方API调用失败: ${command}`, error);
      
      // 在开发环境或测试环境中降级到模拟数据
      if (process.env.NODE_ENV !== 'production') {
        debugLog(`降级到模拟数据: ${command}`);
        return await mockInvoke(command, args);
      }
      
      throw error;
    }
  }
  
  // 非Tauri环境使用模拟数据
  debugLog(`使用模拟数据: ${command}`);
  return await mockInvoke(command, args);
}

// 等待Tauri API准备就绪
export async function waitForTauriAPI(timeout = 15000): Promise<boolean> {
  debugLog(`等待Tauri API准备就绪，超时时间: ${timeout}ms`);
  
  return new Promise((resolve) => {
    // 立即检查API是否可用
    if (typeof window !== 'undefined') {
      // 直接检查Tauri对象
      if (window.__TAURI__ || window.__TAURI_IPC__) {
        debugLog('Tauri API已就绪(直接检测到__TAURI__或__TAURI_IPC__)');
        return resolve(true);
      }
      
      // 设置环境标记 - 确保标记存在
      window.__IS_TAURI_APP__ = true;
      
      // 检查是否运行在Tauri环境中的简单方法
      try {
        // @ts-ignore - 这是Tauri特有的方法，用于检测环境
        if (window.__TAURI_INTERNALS__) {
          debugLog('检测到__TAURI_INTERNALS__，确认Tauri环境');
          return resolve(true);
        }
      } catch (e) {
        // 忽略错误
      }
    }
    
    // 定义一个监听器等待API就绪事件
    let apiReadyEventRegistered = false;
    
    // 监听API就绪事件
    if (typeof window !== 'undefined') {
      const apiReadyHandler = () => {
        debugLog('收到tauri-api-ready事件');
        window.removeEventListener('tauri-api-ready', apiReadyHandler);
        resolve(true);
      };
      
      window.addEventListener('tauri-api-ready', apiReadyHandler, { once: true });
      apiReadyEventRegistered = true;
      debugLog('已注册tauri-api-ready事件监听器');
    }
    
    // 后备机制：检查状态 - 减少检查次数提高性能
    let checkCount = 0;
    const maxChecks = 3; // 减少重试次数，提高性能
    const checkInterval = timeout / maxChecks;
    
    function checkApiAvailability() {
      // 再次检查是否已存在
      if (typeof window !== 'undefined') {
        if (window.__TAURI__ || window.__TAURI_IPC__) {
          debugLog(`API检测成功 (尝试 ${checkCount}): 找到Tauri对象`);
          return resolve(true);
        }
      }
      
      checkCount++;
      debugLog(`检查API可用性 (${checkCount}/${maxChecks})`);
      
      // 尝试加载API
      try {
        import('@tauri-apps/api/core').then(api => {
          debugLog('成功导入Tauri API');
          return resolve(true);
        }).catch(() => {
          // 导入失败，继续检查流程
          // 如果达到最大尝试次数，停止尝试
          if (checkCount >= maxChecks) {
            debugLog('等待Tauri API超时，降级到模拟模式');
            return resolve(false);
          }
          
          // 继续检查
          setTimeout(checkApiAvailability, checkInterval);
        });
      } catch (e) {
        // 导入出错，继续检查流程
        if (checkCount >= maxChecks) {
          debugLog('等待Tauri API超时，降级到模拟模式');
          return resolve(false);
        }
        
        // 继续检查
        setTimeout(checkApiAvailability, checkInterval);
      }
    }
    
    // 开始检查
    checkApiAvailability();
    
    // 设置总体超时 - 减少超时时间，提高响应速度
    setTimeout(() => {
      if (apiReadyEventRegistered) {
        window.removeEventListener('tauri-api-ready', () => {
          debugLog('移除过期的tauri-api-ready事件监听器');
        });
      }
      
      // 最后一次尝试
      if (typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_IPC__)) {
        debugLog('最终检查：找到Tauri对象');
        resolve(true);
      } else {
        debugLog('等待Tauri API超时，降级到模拟模式');
        resolve(false);
      }
    }, timeout * 0.8); // 提前结束等待，提高响应速度
  });
}

// 尝试刷新Tauri API状态
export async function refreshTauriAPI(): Promise<boolean> {
  debugLog('尝试刷新Tauri API状态');
  
  // 重置环境检测状态
  isTauriEnv = null;
  
  // 如果在浏览器环境中，尝试监听环境注入事件
  if (typeof window !== 'undefined') {
    window.addEventListener('tauri-api-ready', () => {
      debugLog('收到tauri-api-ready事件');
      isTauriEnv = null; // 强制重新检测
    }, { once: true });
  }
  
  // 重新检测环境
  return await isTauriEnvironment();
}

// 以下是具体的API方法，供前端直接调用

// 检测硬件信息
export async function detectHardware() {
  // 如果已经有缓存的硬件信息，直接返回缓存
  if (cachedHardwareInfo) {
    debugLog('返回缓存的硬件信息');
    return cachedHardwareInfo;
  }
  
  // 否则调用API获取硬件信息
  try {
    const hardwareInfo = await invoke('detect_hardware');
    // 缓存结果
    cachedHardwareInfo = hardwareInfo;
    return hardwareInfo;
  } catch (error) {
    debugLog('获取硬件信息失败，使用模拟数据', error);
    // 错误情况下也返回一个基本信息以避免前端错误
    const mockInfo = {
      cpu: { architecture: 'unknown', model_name: 'mocked', cores: 4, is_arm: false },
      memory: 8192,
      tee: { sgx_supported: false, trustzone_supported: false, secure_enclave_supported: false, tee_type: 'none' }
    };
    cachedHardwareInfo = mockInfo;
    return mockInfo;
  }
}

// 清除硬件信息缓存（用于测试或需要强制刷新时）
export function clearHardwareCache() {
  debugLog('清除硬件信息缓存');
  cachedHardwareInfo = null;
}

// 验证Passkey
export async function verifyPasskey(challenge: string) {
  return await invoke('verify_passkey', { challenge });
}

// 执行TEE操作
export async function performTeeOperation(operation: string | Record<string, any>) {
  return await invoke('perform_tee_operation', { operation });
}

// 获取TEE状态
export async function getTeeStatus() {
  return await invoke('get_tee_status');
}

// 初始化TEE环境
export async function initializeTee() {
  return await invoke('initialize_tee');
}

// 检查是否支持WebAuthn
export async function isWebAuthnSupported() {
  return await invoke('webauthn_supported');
}

// 检查是否支持生物识别
export async function isBiometricSupported() {
  return await invoke('webauthn_biometric_supported');
}

// 开始WebAuthn注册
export async function startWebAuthnRegistration(username: string) {
  return await invoke('webauthn_start_registration', { username });
}

// 完成WebAuthn注册
export async function finishWebAuthnRegistration(userId: string, response: any) {
  return await invoke('webauthn_finish_registration', {
    user_id: userId,
    response: JSON.stringify(response)
  });
}

// 获取WebAuthn凭证
export async function getWebAuthnCredentials(userId: string) {
  return await invoke('webauthn_get_credentials', { user_id: userId });
}

// 设置硬件类型（仅用于测试）
export function setHardwareType(type: 'arm' | 'x86') {
  setMockHardwareType(type);
} 