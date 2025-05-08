import React, { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { waitForTauriApi, isTauriEnvironment, refreshTauriApi } from '../lib/tauri-api'

// 扩展Window类型
declare global {
  interface Window {
    __IS_TAURI_APP__?: boolean;
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
    __TAURI_API_INITIALIZED__?: boolean;
    ipcNative?: {
      postMessage: (message: string) => void;
    };
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const [tauriApiReady, setTauriApiReady] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  
  // 监听Tauri API初始化
  useEffect(() => {
    console.log('应用初始化，开始等待Tauri API...');
    
    // 监听API就绪事件
    const handleApiReady = () => {
      console.log('收到tauri-api-ready事件');
      setTauriApiReady(true);
    };
    
    window.addEventListener('tauri-api-ready', handleApiReady);
    
    // 主动检查API状态
    const checkApi = async () => {
      // 检查环境
      const isTauri = await isTauriEnvironment();
      if (isTauri) {
        console.log('检测到Tauri环境');
        
        // 等待API就绪，增加超时时间
        const isReady = await waitForTauriApi(10000);
        if (isReady) {
          console.log('Tauri API初始化成功');
          setTauriApiReady(true);
        } else {
          console.log('Tauri API初始化超时，尝试刷新');
          
          // 如果初始化失败，尝试主动刷新API
          const refreshed = await refreshTauriApi();
          setInitAttempts(prev => prev + 1);
          
          if (refreshed) {
            console.log('API刷新成功');
            setTauriApiReady(true);
          } else if (initAttempts < 2) {
            // 如果刷新失败，且尝试次数不超过2次，再次尝试
            console.log(`刷新失败，这是第${initAttempts + 1}次尝试，将在2秒后重试`);
            
            // 延迟2秒后重试初始化
            setTimeout(checkApi, 2000);
          } else {
            console.warn('API初始化失败，将降级到Web模式');
          }
        }
      } else {
        console.log('非Tauri环境，将使用Web模式');
      }
    };
    
    checkApi();
    
    // 监听API重新注入事件，在API重新注入后重新检查状态
    const handleReinject = () => {
      console.log('收到tauri-reinject-api事件，准备重新检查API状态');
      
      // 延迟一段时间后检查API，确保注入完成
      setTimeout(async () => {
        const isReady = await waitForTauriApi(2000);
        if (isReady) {
          console.log('API重新注入成功');
          setTauriApiReady(true);
        } else {
          console.warn('API重新注入后仍不可用');
        }
      }, 1000);
    };
    
    window.addEventListener('tauri-reinject-api', handleReinject);
    
    // 清理事件监听
    return () => {
      window.removeEventListener('tauri-api-ready', handleApiReady);
      window.removeEventListener('tauri-reinject-api', handleReinject);
    };
  }, [initAttempts]);
  
  // 页面加载完成后报告API状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        // 记录详细的API状态
        console.log('API状态检查:', {
          isTauriApp: window.__IS_TAURI_APP__,
          hasTauriObj: typeof window.__TAURI__ !== 'undefined',
          hasInvoke: typeof window.__TAURI__?.invoke === 'function',
          hasIpc: typeof window.__TAURI_IPC__ !== 'undefined',
          hasIpcNative: typeof window.ipcNative !== 'undefined',
          apiInitialized: typeof window.__TAURI_API_INITIALIZED__ !== 'undefined' && window.__TAURI_API_INITIALIZED__ === true,
          apiReady: tauriApiReady
        });
      }, 2000);
    }
  }, [tauriApiReady]);
  
  return <Component {...pageProps} tauriApiReady={tauriApiReady} />
} 