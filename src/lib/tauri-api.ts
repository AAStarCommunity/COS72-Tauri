// Tauri API wrapper for compatibility
import { mockInvoke, setMockHardwareType } from './tauri-mock';

// 调试模式
const DEBUG = true;

// 调试日志函数
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[TAURI-API]', ...args);
  }
}

// 为Tauri全局变量增加类型声明
declare global {
  interface Window {
    __TAURI_IPC__?: unknown;
    __TAURI__?: {
      invoke?: (cmd: string, args?: any) => Promise<any>;
      tauri?: any;
    };
  }
}

// 检测是否在Tauri环境中运行 - 兼容Tauri 2.0
export const isTauriEnvironment = (): boolean => {
  // Tauri 2.0 和 1.0 的检测有所不同
  const isTauri = typeof window !== 'undefined' && 
         (window.__TAURI_IPC__ !== undefined || window.__TAURI__ !== undefined);
  
  debugLog('环境检测:', isTauri ? 'Tauri应用' : '网页浏览器');
  
  // 检查Tauri对象
  if (typeof window !== 'undefined') {
    debugLog('window.__TAURI__:', window.__TAURI__);
    debugLog('window.__TAURI_IPC__类型:', typeof window.__TAURI_IPC__);
  }
  
  return isTauri;
};

// 设置测试用的硬件类型（仅在浏览器模式下有效）
export function setHardwareType(type: 'arm' | 'x86') {
  if (!isTauriEnvironment()) {
    setMockHardwareType(type);
    debugLog('已设置模拟硬件类型:', type);
  } else {
    debugLog('警告: 尝试在Tauri环境中设置模拟硬件类型');
  }
}

// 通用invoke调用，兼容Tauri 2.0和浏览器环境
export async function invoke<T>(command: string, args?: Record<string, any>): Promise<T> {
  debugLog(`调用命令: ${command}`, args);
  
  // 检查是否在Tauri环境中
  if (isTauriEnvironment()) {
    try {
      // Tauri 2.0支持 - 首选window.__TAURI__直接调用
      if (window.__TAURI__?.invoke) {
        const result = await window.__TAURI__.invoke(command, args);
        debugLog(`命令 ${command} 执行成功:`, result);
        return result as T;
      }
      
      // 动态导入 - 避免类型检查问题
      try {
        const tauriModule = await import('@tauri-apps/api');
        // 使用索引访问以避免TypeScript类型检查错误
        const tauriInvoke = (tauriModule as any).invoke;
        if (typeof tauriInvoke === 'function') {
          const result = await tauriInvoke(command, args);
          debugLog(`命令 ${command} 执行成功(动态导入):`, result);
          return result as T;
        }
      } catch (importError) {
        debugLog('Tauri API导入失败:', importError);
      }
      
      throw new Error('找不到有效的Tauri invoke方法');
    } catch (error) {
      debugLog(`命令 ${command} 执行失败:`, error);
      throw new Error(`Tauri命令执行失败: ${error}`);
    }
  } else {
    debugLog(`在浏览器环境中使用mock数据`);
    
    // 在浏览器环境中使用模拟数据
    try {
      const result = await mockInvoke(command, args);
      debugLog(`mock命令 ${command} 执行成功:`, result);
      return result as T;
    } catch (error) {
      debugLog(`mock命令 ${command} 执行失败:`, error);
      throw error;
    }
  }
}

// 检测硬件信息
export async function detectHardware() {
  return invoke('detect_hardware');
}

// 验证FIDO2密钥
export async function verifyPasskey(challenge: string) {
  return invoke('verify_passkey', { challenge });
}

// 执行TEE操作
export async function performTeeOperation(operation: any) {
  return invoke('perform_tee_operation', { operation });
}

// 以下是特定功能的API封装
// ...可以根据需要扩展更多API 