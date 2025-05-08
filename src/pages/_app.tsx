import React, { useEffect } from 'react'
import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { waitForTauriApi, isTauriEnvironment } from '../lib/tauri-api'

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
    };
    __TAURI_INTERNALS__?: any;
    __TAURI_API_INITIALIZED__?: boolean;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  // 初始化Tauri API
  useEffect(() => {
    // 应用启动时初始化Tauri API
    const initTauriApi = async () => {
      console.log('正在初始化Tauri环境...');
      
      try {
        const isTauri = await isTauriEnvironment();
        if (isTauri) {
          console.log('检测到Tauri环境，等待API就绪...');
          await waitForTauriApi(10000);
          console.log('Tauri API初始化完成');
        } else {
          console.log('非Tauri环境，使用模拟API');
        }
      } catch (err) {
        console.error('Tauri API初始化失败:', err);
      }
    };
    
    initTauriApi();
  }, []);
  
  return <Component {...pageProps} />
} 