/**
 * Tauri API 封装模块 (v0.4.1)
 * 
 * 此模块提供了与Tauri后端通信的标准接口，遵循Tauri 2.0最佳实践
 * 优化后支持多种通信机制和优雅降级策略
 */

import { isBoolean } from 'util';
import { mockInvoke as tauriMockInvoke, setMockHardwareType } from './tauri-mock';

// 定义全局Window接口，添加Tauri相关属性
declare global {
  interface Window {
    __TAURI__?: {
      invoke?: (cmd: string, args?: any) => Promise<any>;
      convertFileSrc?: (filePath: string, protocol?: string) => string;
      event?: {
        listen: (event: string, callback: (event: any) => void) => (() => void);
        once: (event: string, callback: (event: any) => void) => (() => void);
        emit: (event: string, payload?: any) => Promise<void>;
      };
      [key: string]: any;
    };
    __TAURI_IPC__?: {
      postMessage: (message: string) => void;
    };
    __TAURI_INTERNALS__?: any;
    __IS_TAURI_APP__?: boolean;
  }
}

// API状态追踪
let isWaitingForApi = false;
let apiReady = false;
let hasAttemptedRefresh = false;

/**
 * 检测当前是否处于Tauri环境
 * 使用多重检测策略确保准确性
 */
export async function isTauriEnvironment(): Promise<boolean> {
  // 记录检测开始
  console.log(`[TAURI-API-0.4.1] - 检测Tauri环境`);
  
  // 1. 检查环境标记 (快速检测)
  if (typeof window.__IS_TAURI_APP__ !== 'undefined' && window.__IS_TAURI_APP__ === true) {
    console.log(`[TAURI-API-0.4.1] - 检测到__IS_TAURI_APP__标记`);
    return true;
  }
  
  // 2. 检查Tauri对象 (官方推荐)
  if (typeof window.__TAURI__ !== 'undefined') {
    console.log(`[TAURI-API-0.4.1] - 检测到__TAURI__对象，确认Tauri环境`);
    return true;
  }
  
  // 3. 检查Tauri内部对象
  if (typeof window.__TAURI_INTERNALS__ !== 'undefined') {
    console.log(`[TAURI-API-0.4.1] - 检测到__TAURI_INTERNALS__，确认Tauri环境`);
    return true;
  }
  
  // 4. 检查Tauri IPC对象
  if (typeof window.__TAURI_IPC__ !== 'undefined') {
    console.log(`[TAURI-API-0.4.1] - 检测到__TAURI_IPC__对象，确认Tauri环境`);
    return true;
  }
  
  // 未检测到Tauri环境
  console.log(`[TAURI-API-0.4.1] - 未检测到Tauri环境标记`);
  return false;
}

/**
 * 检查Tauri API对象的可用性
 * @returns 如果API可用返回true
 */
function isApiAvailable(): boolean {
  return (
    typeof window.__TAURI__ !== 'undefined' &&
    typeof window.__TAURI__.invoke === 'function'
  );
}

/**
 * 尝试通过直接IPC通道实现invoke功能
 * 当__TAURI_IPC__存在但__TAURI__API缺失时使用
 * @param command 要调用的命令
 * @param args 命令参数
 * @returns Promise<T> 命令执行结果
 */
async function invokeViaIpc<T>(command: string, args?: Record<string, any>): Promise<T> {
  if (typeof window.__TAURI_IPC__ === 'undefined' || typeof window.__TAURI_IPC__.postMessage !== 'function') {
    throw new Error('IPC通道不可用');
  }
  
  console.log(`[TAURI-API-0.4.1] - 通过IPC通道调用命令: ${command}`, args);
  
  return new Promise<T>((resolve, reject) => {
    // 生成唯一请求ID
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    
    // 响应处理程序
    const responseHandler = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string') {
          const response = JSON.parse(event.data);
          if (response && response.id === requestId) {
            window.removeEventListener('message', responseHandler);
            clearTimeout(timeoutId);
            if (response.success) {
              resolve(response.data as T);
            } else {
              reject(response.error || new Error('调用失败'));
            }
          }
        }
      } catch (e) {
        // 忽略非预期的消息格式
      }
    };
    
    // 注册响应监听
    window.addEventListener('message', responseHandler);
    
    // 超时处理
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', responseHandler);
      reject(new Error(`命令 ${command} 调用超时`));
    }, 30000); // 30秒超时
    
    // 准备请求
    const request = {
      cmd: '__tauri_invoke',
      id: requestId,
      command,
      ...args
    };
    
    // 发送请求
    try {
      window.__TAURI_IPC__!.postMessage(JSON.stringify(request));
    } catch (error) {
      clearTimeout(timeoutId);
      window.removeEventListener('message', responseHandler);
      reject(error);
    }
  });
}

/**
 * 等待Tauri API就绪
 * 遵循官方文档推荐的实践，确保API可用后再调用
 * @param timeout 超时时间(毫秒)
 * @param retryAttempt 当前重试次数
 * @returns Promise<boolean> API是否就绪
 */
export async function waitForTauriApi(timeout = 10000, retryAttempt = 0): Promise<boolean> {
  // 防止多个调用同时等待
  if (isWaitingForApi) {
    console.log(`[TAURI-API-0.4.1] - 已有等待中的API就绪请求，共享结果`);
    await new Promise<void>(resolve => {
      const checkInterval = setInterval(() => {
        if (!isWaitingForApi) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
    return apiReady;
  }
  
  // 如果API已经就绪，立即返回
  if (apiReady && isApiAvailable()) {
    console.log(`[TAURI-API-0.4.1] - Tauri API已就绪`);
    return true;
  }
  
  // 设置等待状态
  isWaitingForApi = true;
  
  // 调整超时时间(重试时增加)
  const adjustedTimeout = timeout * (1 + Math.min(retryAttempt, 3) * 0.5);
  
  console.log(`[TAURI-API-0.4.1] - 等待Tauri API准备就绪，超时时间: ${adjustedTimeout}ms，重试次数: ${retryAttempt}`);
  
  try {
    // 创建Promise等待API就绪
    const result = await new Promise<boolean>((resolve) => {
      // 设置超时
      const timeoutId = setTimeout(() => {
        console.log(`[TAURI-API-0.4.1] - 等待Tauri API超时`);
        window.removeEventListener('tauri-api-ready', apiReadyHandler);
        
        // 超时后尝试发起API重新注入请求
        if (!hasAttemptedRefresh && retryAttempt < 2) {
          console.log(`[TAURI-API-0.4.1] - 尝试请求API重新注入`);
          
          try {
            const event = new CustomEvent('tauri-reinject-api');
            window.dispatchEvent(event);
            hasAttemptedRefresh = true;
            
            // 给重新注入一些额外时间
            setTimeout(() => {
              if (isApiAvailable()) {
                console.log(`[TAURI-API-0.4.1] - 重新注入后API可用`);
                resolve(true);
              } else {
                console.log(`[TAURI-API-0.4.1] - 重新注入后API仍不可用`);
                resolve(false);
              }
              isWaitingForApi = false;
            }, 2000);
          } catch (e) {
            console.error(`[TAURI-API-0.4.1] - 重新注入请求失败`, e);
            resolve(false);
            isWaitingForApi = false;
          }
        } else {
          // 重试次数过多，放弃等待
          resolve(isApiAvailable());
          isWaitingForApi = false;
        }
      }, adjustedTimeout);
      
      // API就绪事件处理
      const apiReadyHandler = () => {
        clearTimeout(timeoutId);
        console.log(`[TAURI-API-0.4.1] - 收到Tauri API就绪事件`);
        
        if (isApiAvailable()) {
          console.log(`[TAURI-API-0.4.1] - 确认Tauri API可用`);
          resolve(true);
        } else {
          console.log(`[TAURI-API-0.4.1] - 尽管收到就绪事件，但API仍不可用`);
          
          // 如果API仍不可用但有IPC通道，可以继续
          if (typeof window.__TAURI_IPC__ !== 'undefined') {
            console.log(`[TAURI-API-0.4.1] - 检测到IPC通道，视为可用`);
            resolve(true);
          } else {
            resolve(false);
          }
        }
        isWaitingForApi = false;
      };
      
      // 注册API就绪事件监听
      window.addEventListener('tauri-api-ready', apiReadyHandler, { once: true });
      
      // 尝试触发IPC检查
      try {
        const checkEvent = new CustomEvent('tauri://ipc-check');
        window.dispatchEvent(checkEvent);
      } catch (e) {
        console.error(`[TAURI-API-0.4.1] - IPC检查事件发送失败`, e);
      }
      
      // 立即检查一次
      if (isApiAvailable()) {
        clearTimeout(timeoutId);
        window.removeEventListener('tauri-api-ready', apiReadyHandler);
        console.log(`[TAURI-API-0.4.1] - 立即检查确认Tauri API已就绪`);
        resolve(true);
        isWaitingForApi = false;
      }
    });
    
    // 更新API状态并返回
    apiReady = result;
    return result;
    
  } catch (error) {
    console.error(`[TAURI-API-0.4.1] - 等待API就绪时发生错误:`, error);
    isWaitingForApi = false;
    apiReady = false;
    return false;
  }
}

/**
 * 遵循Tauri官方推荐的命令调用方式
 * 支持多种通信机制，优先使用官方API，失败时自动尝试替代方案
 * @param command 命令名称
 * @param args 命令参数
 * @returns Promise<T> 命令执行结果
 */
export async function invoke<T>(command: string, args?: Record<string, any>): Promise<T> {
  console.log(`[TAURI-API-0.4.1] - 调用命令: ${command}`, args);
  
  // 检测Tauri环境
  const isTauri = await isTauriEnvironment();
  
  if (isTauri) {
    console.log(`[TAURI-API-0.4.1] - 在Tauri环境中调用: ${command}`);
    
    // 等待API就绪 (增加超时时间确保有足够时间初始化)
    let apiReady = await waitForTauriApi(10000);
    let retryCount = 0;
    
    // 如果API未就绪，尝试重试
    while (!apiReady && retryCount < 2) {
      console.log(`[TAURI-API-0.4.1] - API未就绪，尝试重试 ${retryCount + 1}/2`);
      retryCount++;
      
      // 二次尝试刷新API
      await refreshTauriApi();
      
      // 再次等待API，递增超时时间
      apiReady = await waitForTauriApi(10000 + retryCount * 5000, retryCount);
    }
    
    if (apiReady) {
      try {
        // 1. 首选: 使用官方标准API (最推荐的调用方式)
        if (isApiAvailable()) {
          console.log(`[TAURI-API-0.4.1] - 使用标准API调用: ${command}`);
          return await window.__TAURI__!.invoke!(command, args) as T;
        }
        
        // 2. 次选: 使用内部API (如果可用)
        if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
          console.log(`[TAURI-API-0.4.1] - 使用内部API调用: ${command}`);
          return await window.__TAURI_INTERNALS__.invoke(command, args) as T;
        }
        
        // 3. 最后选择: 使用IPC通道
        if (window.__TAURI_IPC__ && typeof window.__TAURI_IPC__.postMessage === 'function') {
          console.log(`[TAURI-API-0.4.1] - 通过IPC通道调用: ${command}`);
          return await invokeViaIpc<T>(command, args);
        }
        
        // 所有方法都失败，抛出错误
        throw new Error(`没有可用的Tauri API调用机制。 command=${command}`);
      } catch (error) {
        console.error(`[TAURI-API-0.4.1] - 调用失败: ${command}`, error);
        
        // 如果是首次调用失败，尝试刷新API后重试一次
        if (!hasAttemptedRefresh) {
          console.log(`[TAURI-API-0.4.1] - 尝试刷新API后重试命令: ${command}`);
          hasAttemptedRefresh = true;
          
          const refreshed = await refreshTauriApi();
          
          if (refreshed && isApiAvailable()) {
            console.log(`[TAURI-API-0.4.1] - API刷新成功，重试命令: ${command}`);
            return await window.__TAURI__!.invoke!(command, args) as T;
          }
        }
        
        throw error;
      }
    }
    
    console.log(`[TAURI-API-0.4.1] - API未就绪，降级到模拟实现: ${command}`);
  } else {
    console.log(`[TAURI-API-0.4.1] - 非Tauri环境，使用模拟实现: ${command}`);
  }
  
  // 降级到模拟实现
  return tauriMockInvoke(command, args);
}

/**
 * 主动监听Tauri事件
 * 遵循官方文档推荐的事件监听模式
 * @param event 事件名称
 * @param callback 回调函数
 * @returns 用于注销监听的函数
 */
export async function listen<T>(event: string, callback: (event: { event: string; payload: T }) => void): Promise<() => void> {
  console.log(`[TAURI-API-0.4.1] - 注册事件监听: ${event}`);
  
  // 等待API就绪
  const apiReady = await waitForTauriApi();
  
  if (apiReady && window.__TAURI__?.event?.listen) {
    try {
      // 使用官方API注册事件监听
      console.log(`[TAURI-API-0.4.1] - 使用官方API注册事件监听: ${event}`);
      return window.__TAURI__.event.listen(event, callback);
    } catch (error) {
      console.error(`[TAURI-API-0.4.1] - 注册事件监听失败: ${event}`, error);
    }
  }
  
  // 创建模拟的事件监听(空实现)
  console.log(`[TAURI-API-0.4.1] - 创建模拟事件监听: ${event}`);
  return () => {
    console.log(`[TAURI-API-0.4.1] - 注销模拟事件监听: ${event}`);
  };
}

/**
 * 请求重新注入Tauri API
 * 当检测到API不可用时可以调用此函数尝试恢复
 */
export async function refreshTauriApi(): Promise<boolean> {
  console.log(`[TAURI-API-0.4.1] - 请求重新注入Tauri API`);
  
  // 重置状态
  apiReady = false;
  isWaitingForApi = false;
  
  // 发送重新注入事件
  try {
    const reinjectionEvent = new CustomEvent('tauri-reinject-api');
    window.dispatchEvent(reinjectionEvent);
  } catch (error) {
    console.error(`[TAURI-API-0.4.1] - 发送重新注入事件失败`, error);
    return false;
  }
  
  // 等待API就绪 (最多等待5秒)
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(isApiAvailable());
    }, 5000);
    
    const apiReadyHandler = () => {
      clearTimeout(timeoutId);
      setTimeout(() => {
        resolve(isApiAvailable());
      }, 500); // 给API对象初始化一些时间
    };
    
    window.addEventListener('tauri-api-ready', apiReadyHandler, { once: true });
  });
}

/**
 * 检测硬件信息
 */
export async function detectHardware(): Promise<any> {
  try {
    return await invoke('detect_hardware');
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 硬件检测失败', error);
    throw error;
  }
}

/**
 * 获取TEE状态
 */
export async function getTeeStatus(): Promise<any> {
  try {
    return await invoke('get_tee_status');
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 获取TEE状态失败', error);
    throw error;
  }
}

/**
 * 初始化TEE环境
 */
export async function initializeTee(): Promise<boolean> {
  try {
    return await invoke<boolean>('initialize_tee');
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 初始化TEE失败', error);
    throw error;
  }
}

/**
 * 执行TEE操作
 * @param operation 操作名称或参数对象
 */
export async function performTeeOperation(operation: string | Record<string, any>): Promise<any> {
  try {
    // 如果是对象，转换为JSON字符串
    const operationParam = typeof operation === 'string' 
      ? operation 
      : JSON.stringify(operation);
      
    return await invoke('perform_tee_operation', { operation: operationParam });
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 执行TEE操作失败', error);
    throw error;
  }
}

/**
 * 验证Passkey
 * @param challenge 挑战字符串
 */
export async function verifyPasskey(challenge: string): Promise<any> {
  try {
    return await invoke('verify_passkey', { challenge });
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 验证Passkey失败', error);
    throw error;
  }
}

/**
 * 检查WebAuthn支持状态
 */
export async function isWebauthnSupported(): Promise<boolean> {
  try {
    return await invoke<boolean>('webauthn_supported');
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 检查WebAuthn支持失败', error);
    // 降级到浏览器API检测
    return typeof navigator.credentials !== 'undefined' && 
           typeof navigator.credentials.create === 'function';
  }
}

/**
 * 检查生物识别支持状态
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    return await invoke<boolean>('webauthn_biometric_supported');
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 检查生物识别支持失败', error);
    // 降级到简单的平台检测
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('mac') || 
           userAgent.includes('windows') || 
           userAgent.includes('android') || 
           userAgent.includes('iphone') || 
           userAgent.includes('ipad');
  }
}

/**
 * 开始WebAuthn注册
 * @param username 用户名
 */
export async function startWebauthnRegistration(username: string): Promise<any> {
  try {
    return await invoke('webauthn_start_registration', { username });
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 开始WebAuthn注册失败', error);
    throw error;
  }
}

/**
 * 完成WebAuthn注册
 * @param userId 用户ID
 * @param response 注册响应
 */
export async function finishWebauthnRegistration(userId: string, response: string): Promise<any> {
  try {
    return await invoke('webauthn_finish_registration', { user_id: userId, response });
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 完成WebAuthn注册失败', error);
    throw error;
  }
}

/**
 * 获取WebAuthn凭证
 * @param userId 用户ID
 */
export async function getWebauthnCredentials(userId: string): Promise<any> {
  try {
    return await invoke('webauthn_get_credentials', { user_id: userId });
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 获取WebAuthn凭证失败', error);
    throw error;
  }
}

/**
 * 完成WebAuthn认证
 * @param response 认证响应
 */
export async function finishWebauthnAuthentication(response: string): Promise<any> {
  try {
    return await invoke('webauthn_finish_authentication', { response });
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 完成WebAuthn认证失败', error);
    throw error;
  }
}

/**
 * 检查生物识别权限
 */
export async function checkBiometricPermission(): Promise<boolean> {
  try {
    return await invoke<boolean>('check_biometric_permission');
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 检查生物识别权限失败', error);
    return false;
  }
}

/**
 * 请求生物识别权限
 */
export async function requestBiometricPermission(): Promise<boolean> {
  try {
    return await invoke<boolean>('request_biometric_permission');
  } catch (error) {
    console.error('[TAURI-API-0.4.1] - 请求生物识别权限失败', error);
    return false;
  }
}

// 版本号
const VERSION = '0.4.1';

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

// 清除硬件信息缓存（用于测试或需要强制刷新时）
export function clearHardwareCache() {
  debugLog('清除硬件信息缓存');
  cachedHardwareInfo = null;
}

// 设置硬件类型（仅用于测试）
export function setHardwareType(type: 'arm' | 'x86') {
  setMockHardwareType(type);
} 