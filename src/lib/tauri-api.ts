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

// 检测是否在Tauri环境中运行 - 兼容Tauri 2.0
export const isTauriEnvironment = (): boolean => {
  // Tauri 2.0 和 1.0 的检测有所不同
  const isTauri = typeof window !== 'undefined' && 
         (window.__TAURI_IPC__ !== undefined || window.__TAURI__ !== undefined);
  
  debugLog('环境检测:', isTauri ? 'Tauri应用' : '网页浏览器');
  
  // 检查window.__TAURI__对象
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
    debugLog('已设置模拟硬件类型为:', type);
  } else {
    debugLog('无法在Tauri环境中设置模拟硬件类型');
  }
}

// 统一的invoke函数，支持Tauri环境和浏览器环境
export async function invokeCommand(command: string, args?: Record<string, any>): Promise<any> {
  debugLog(`调用命令: ${command}`, args);
  
  try {
    if (isTauriEnvironment()) {
      // 使用真实的Tauri API
      debugLog('通过Tauri执行命令');
      try {
        // 使用Tauri 2.0的导入路径
        const { invoke } = await import('@tauri-apps/api/tauri');
        const result = await invoke(command, args);
        debugLog(`命令 ${command} 执行成功:`, result);
        return result;
      } catch (importError) {
        debugLog('Tauri API导入失败:', importError);
        throw new Error(`Tauri API导入失败: ${importError instanceof Error ? importError.message : String(importError)}`);
      }
    } else {
      // 使用模拟的API
      debugLog('通过模拟API执行命令');
      const result = await mockInvoke(command, args);
      debugLog(`模拟命令 ${command} 执行成功:`, result);
      return result;
    }
  } catch (error) {
    debugLog(`命令 ${command} 执行失败:`, error);
    console.error(`Error invoking ${command}:`, error);
    
    // 增强的错误信息
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.stack) {
        debugLog('错误堆栈:', error.stack);
      }
    } else {
      errorMessage = String(error);
    }
    
    throw new Error(`执行 ${command} 失败: ${errorMessage}`);
  }
} 