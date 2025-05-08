/**
 * Tauri API 封装模块 (v0.4.7)
 * 
 * 此模块提供了与Tauri后端通信的标准接口，遵循Tauri 2.0最佳实践
 * 优化后支持多种通信机制和优雅降级策略
 */

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
      metadata?: {
        version: string;
      };
    };
    __TAURI_INTERNALS__?: any;
    __IS_TAURI_APP__?: boolean;
    __TAURI_IPC_READY__?: boolean;
    __TAURI_API_INITIALIZED__?: boolean;
    ipcNative?: {
      postMessage: (message: string) => void;
    };
  }
}

// API状态追踪
let isWaitingForApi = false;
let apiReady = false;
let hasAttemptedRefresh = false;
let apiCheckCount = 0;

// API就绪事件监听器
const apiReadyListeners: Array<(ready: boolean) => void> = [];

/**
 * 检测当前环境是否为Tauri应用
 * @returns Boolean Tauri环境状态
 */
export async function isTauriEnvironment(): Promise<boolean> {
  // 直接检查标记 - 这是最可靠的方法
  if (typeof window !== 'undefined' && window.__IS_TAURI_APP__ === true) {
    return true;
  }
  
  // 检查全局对象 - 次可靠方法
  if (typeof window !== 'undefined' && (
      typeof window.__TAURI__ !== 'undefined' || 
      typeof window.__TAURI_IPC__ !== 'undefined' ||
      typeof window.ipcNative !== 'undefined')) {
    return true;
  }
  
  // 检查特殊协议 - 用于某些场景
  if (typeof window !== 'undefined' && window.location.protocol === 'tauri:') {
    return true;
  }

  // 检查环境变量 - 最不可靠但适用于某些情况
  if (typeof process !== 'undefined' && process.versions && 'tauri' in process.versions) {
    return true;
  }
  
  return false;
}

/**
 * 检查Tauri API是否已完全初始化
 * @returns Boolean API是否已准备就绪
 */
export function isApiAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // 1. 直接检查API对象是否可用
  const hasApiObject = typeof window.__TAURI__ !== 'undefined';
  const hasInvokeFunction = typeof window.__TAURI__?.invoke === 'function';
  
  if (hasApiObject && hasInvokeFunction) {
    return true;
  }
  
  // 2. 检查是否为Tauri环境但API未加载
  const isTauriEnv = window.__IS_TAURI_APP__ === true || 
                     typeof window.__TAURI_IPC__ !== 'undefined' ||
                     typeof window.ipcNative !== 'undefined';
  
  return false;
}

/**
 * 等待Tauri API可用
 * @param timeout 超时时间(ms)
 * @returns Promise<boolean> API是否可用
 */
export async function waitForTauriApi(timeout: number = 5000): Promise<boolean> {
  // 如果已经在等待，避免重复等待
  if (isWaitingForApi) {
    console.log(`[TAURI-API-0.4.7] - 已经在等待API初始化，跳过重复等待`);
    return new Promise<boolean>((resolve) => {
      apiReadyListeners.push(resolve);
    });
  }
  
  // 如果API已经可用，直接返回
  if (isApiAvailable()) {
    return true;
  }
  
  console.log(`[TAURI-API-0.4.7] - 等待Tauri API初始化，超时${timeout}ms`);
  isWaitingForApi = true;
  
  return new Promise<boolean>((resolve) => {
    // 添加到监听器列表
    apiReadyListeners.push(resolve);
    
    // 检测API是否可用
    const checkApiAvailable = () => {
      if (isApiAvailable()) {
        console.log(`[TAURI-API-0.4.7] - Tauri API已可用`);
        apiReady = true;
        isWaitingForApi = false;
        
        // 通知所有等待的监听器
        apiReadyListeners.forEach(listener => listener(true));
        apiReadyListeners.length = 0;
        
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        return true;
      }
      return false;
    };
    
    // 设置API就绪事件监听器，这是Tauri 2.0推荐方式
    const apiReadyHandler = () => {
      console.log(`[TAURI-API-0.4.7] - 收到tauri-api-ready事件`);
      if (checkApiAvailable()) {
        window.removeEventListener('tauri-api-ready', apiReadyHandler);
      }
    };
    
    // 监听API就绪事件
    window.addEventListener('tauri-api-ready', apiReadyHandler);
    
    // 轮询检查API状态
    const checkInterval = setInterval(() => {
      checkApiAvailable();
    }, 100);
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      console.log(`[TAURI-API-0.4.7] - tauri-api-ready事件超时`);
      clearInterval(checkInterval);
      window.removeEventListener('tauri-api-ready', apiReadyHandler);
      
      // 最后检查一次
      if (!checkApiAvailable()) {
        isWaitingForApi = false;
        
        // 通知所有等待的监听器API不可用
        apiReadyListeners.forEach(listener => listener(false));
        apiReadyListeners.length = 0;
      }
    }, timeout);
  });
}

/**
 * 尝试刷新Tauri API
 * 在API初始化失败时使用，触发事件尝试重新注入
 * @returns Promise<boolean> 刷新是否成功
 */
export async function refreshTauriApi(): Promise<boolean> {
  // 避免重复刷新
  if (hasAttemptedRefresh) {
    console.log(`[TAURI-API-0.4.7] - 已尝试刷新API，避免重复操作`);
    return isApiAvailable();
  }
  
  console.log(`[TAURI-API-0.4.7] - 尝试刷新Tauri API`);
  hasAttemptedRefresh = true;
  
  // 重置状态
  apiReady = false;
  isWaitingForApi = false;
  
  // 触发自定义事件，通知Rust端重新注入API
  try {
    window.dispatchEvent(new CustomEvent('tauri-reinject-api'));
    console.log(`[TAURI-API-0.4.7] - 已触发tauri-reinject-api事件`);
    
    // 等待API就绪
    const ready = await waitForTauriApi(10000);
    console.log(`API刷新${ready ? '成功' : '失败'}`);
    return ready;
  } catch (e) {
    console.error(`[TAURI-API-0.4.7] - 刷新API失败:`, e);
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
  console.log(`[TAURI-API-0.4.7] - 调用命令: ${command}`, args);
  
  // 检测Tauri环境
  const isTauri = await isTauriEnvironment();
  
  if (isTauri) {
    console.log(`[TAURI-API-0.4.7] - 检测到Tauri环境`);
    
    // 1. 检查API是否已加载
    if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') {
      try {
        return await window.__TAURI__.invoke(command, args);
      } catch (error) {
        console.error(`[TAURI-API-0.4.7] - API调用失败:`, error);
        // 继续尝试其他方法
      }
    }
    
    // 2. 尝试等待API就绪
    console.log(`[TAURI-API-0.4.7] - 等待Tauri API就绪...`);
    const apiReady = await waitForTauriApi(5000);
    
    if (apiReady && window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') {
      try {
        return await window.__TAURI__.invoke(command, args);
      } catch (error) {
        console.error(`[TAURI-API-0.4.7] - API就绪后调用失败:`, error);
        // 继续尝试其他方法
      }
    }
    
    // 3. 尝试刷新API
    console.log(`[TAURI-API-0.4.7] - 尝试刷新API...`);
    const refreshed = await refreshTauriApi();
    
    if (refreshed && window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') {
      try {
        return await window.__TAURI__.invoke(command, args);
      } catch (error) {
        console.error(`[TAURI-API-0.4.7] - 刷新API后调用失败:`, error);
        // 降级到模拟实现
      }
    }
    
    console.warn(`[TAURI-API-0.4.7] - 无法使用Tauri API，降级到模拟实现`);
    apiCheckCount++;
  } else {
    console.log(`[TAURI-API-0.4.7] - 非Tauri环境，使用模拟实现`);
  }
  
  // 降级到模拟实现
  return tauriMockInvoke(command, args);
}

/**
 * 检测硬件信息
 * @returns Promise<HardwareInfo> 硬件信息
 */
export interface HardwareInfo {
  cpu: {
    architecture: string;
    model_name: string;
    cores: number;
    is_arm: boolean;
  };
  memory: number;
  tee: {
    tee_type: string;
    sgx_supported: boolean;
    trustzone_supported: boolean;
    secure_enclave_supported: boolean;
  };
}

// 缓存硬件检测结果
let hardwareInfoCache: HardwareInfo | null = null;

/**
 * 检测硬件信息
 * @param forceRefresh 是否强制刷新缓存
 * @returns Promise<HardwareInfo> 硬件信息
 */
export async function detectHardware(forceRefresh: boolean = false): Promise<HardwareInfo> {
  // 如果有缓存且不强制刷新，直接返回缓存
  if (hardwareInfoCache && !forceRefresh) {
    return hardwareInfoCache;
  }
  
  try {
    const info = await invoke<HardwareInfo>('detect_hardware');
    hardwareInfoCache = info;
    return info;
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 硬件检测失败', error);
    throw error;
  }
}

/**
 * 清除硬件信息缓存
 */
export function clearHardwareCache(): void {
  hardwareInfoCache = null;
}

/**
 * 获取TEE状态
 */
export interface TeeStatus {
  available: boolean;
  initialized: boolean;
  type_name: string;
  version: string;
  wallet_created: boolean;
}

/**
 * 获取TEE状态
 * @returns Promise<TeeStatus> TEE状态
 */
export async function getTeeStatus(): Promise<TeeStatus> {
  try {
    return await invoke<TeeStatus>('get_tee_status');
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 获取TEE状态失败', error);
    throw error;
  }
}

/**
 * 初始化TEE环境
 * @returns Promise<boolean> 是否成功
 */
export async function initializeTee(): Promise<boolean> {
  try {
    return await invoke<boolean>('initialize_tee');
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 初始化TEE失败', error);
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
    console.error('[TAURI-API-0.4.7] - 执行TEE操作失败', error);
    throw error;
  }
}

/**
 * 检查WebAuthn支持
 * @returns Promise<boolean> 是否支持
 */
export async function isWebauthnSupported(): Promise<boolean> {
  try {
    return await invoke<boolean>('webauthn_supported');
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 检查WebAuthn支持失败', error);
    return false;
  }
}

/**
 * 检查生物识别支持
 * @returns Promise<boolean> 是否支持
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    return await invoke<boolean>('webauthn_biometric_supported');
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 检查生物识别支持失败', error);
    return false;
  }
}

/**
 * 开始Passkey注册
 * @param username 用户名
 */
export async function startPasskeyRegistration(username: string): Promise<any> {
  try {
    return await invoke<any>('webauthn_start_registration', { username });
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 开始Passkey注册失败', error);
    throw error;
  }
}

/**
 * 完成Passkey注册
 * @param user_id 用户ID
 * @param response 注册响应
 */
export async function finishPasskeyRegistration(user_id: string, response: string): Promise<any> {
  try {
    return await invoke<any>('webauthn_finish_registration', { user_id, response });
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 完成Passkey注册失败', error);
    throw error;
  }
}

/**
 * 获取用户凭证
 * @param user_id 用户ID
 */
export async function getPasskeyCredentials(user_id: string): Promise<any> {
  try {
    return await invoke<any>('webauthn_get_credentials', { user_id });
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 获取用户凭证失败', error);
    throw error;
  }
}

/**
 * 完成Passkey认证
 * @param response 认证响应
 */
export async function finishPasskeyAuthentication(response: string): Promise<any> {
  try {
    return await invoke<any>('webauthn_finish_authentication', { response });
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 完成Passkey认证失败', error);
    throw error;
  }
}

/**
 * 检查生物识别权限
 * @returns Promise<boolean> 是否有权限
 */
export async function checkBiometricPermission(): Promise<boolean> {
  try {
    return await invoke<boolean>('check_biometric_permission');
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 检查生物识别权限失败', error);
    return false;
  }
}

/**
 * 请求生物识别权限
 * @returns Promise<boolean> 是否获得权限
 */
export async function requestBiometricPermission(): Promise<boolean> {
  try {
    return await invoke<boolean>('request_biometric_permission');
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - 请求生物识别权限失败', error);
    return false;
  }
}

/**
 * 测试API连接
 * @returns Promise<string> 连接状态消息
 */
export async function testApiConnection(): Promise<string> {
  try {
    return await invoke<string>('test_api_connection');
  } catch (error) {
    console.error('[TAURI-API-0.4.7] - API测试失败', error);
    throw error;
  }
}

// 版本号
const VERSION = '0.4.7';

// 调试模式
const DEBUG = true;

// 调试日志函数
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log(`[TAURI-API-${VERSION}]`, ...args);
  }
}

// 设置硬件类型（仅用于测试）
export function setHardwareType(type: 'arm' | 'x86') {
  setMockHardwareType(type);
} 