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
const VERSION = '0.2.11';

// 调试模式
const DEBUG = true;

// 调试日志函数
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log(`[TAURI-API-${VERSION}]`, ...args);
  }
}

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
      if (window.__IS_TAURI_APP__) {
        debugLog('检测到__IS_TAURI_APP__标记');
        isTauriEnv = true;
        return true;
      }

      // 尝试动态导入官方API
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        // 尝试执行一个简单命令以确认API可用
        await invoke('detect_hardware');
        debugLog('官方API可用，确认Tauri环境');
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
  
  // 首先检查是否在Tauri环境中
  const inTauriEnv = await isTauriEnvironment();
  
  // 在Tauri环境中使用官方API
  if (inTauriEnv) {
    try {
      return await callWithOfficialApi<T>(command, args);
    } catch (error) {
      debugLog(`官方API调用失败，尝试降级: ${command}`, error);
      
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
export async function waitForTauriAPI(timeout = 10000): Promise<boolean> {
  debugLog(`等待Tauri API准备就绪，超时时间: ${timeout}ms`);
  
  return new Promise((resolve) => {
    let checkCount = 0;
    const maxChecks = 5;
    const checkInterval = timeout / maxChecks;
    
    // 立即尝试一次
    checkApiAvailability();
    
    function checkApiAvailability() {
      checkCount++;
      debugLog(`检查API可用性 (${checkCount}/${maxChecks})`);
      
      isTauriEnvironment().then(isAvailable => {
        if (isAvailable) {
          debugLog('Tauri API已就绪');
          resolve(true);
        } else if (checkCount < maxChecks) {
          debugLog(`API未就绪，将在${checkInterval}ms后重试`);
          setTimeout(checkApiAvailability, checkInterval);
        } else {
          debugLog('等待Tauri API超时');
          resolve(false);
        }
      }).catch(error => {
        debugLog('检查API可用性出错:', error);
        if (checkCount < maxChecks) {
          setTimeout(checkApiAvailability, checkInterval);
        } else {
          resolve(false);
        }
      });
    }
  });
}

// 尝试刷新Tauri API状态
export async function refreshTauriAPI(): Promise<boolean> {
  debugLog('尝试刷新Tauri API状态');
  
  // 重置环境检测状态
  isTauriEnv = null;
  
  // 重新检测环境
  return await isTauriEnvironment();
}

// 以下是具体的API方法，供前端直接调用

// 检测硬件信息
export async function detectHardware() {
  return await invoke('detect_hardware');
}

// 验证Passkey
export async function verifyPasskey(challenge: string) {
  return await invoke('verify_passkey', { challenge });
}

// 执行TEE操作
export async function performTeeOperation(operation: string) {
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