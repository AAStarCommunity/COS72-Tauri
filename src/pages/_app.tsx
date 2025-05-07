import React, { useEffect } from 'react'
import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { waitForTauriAPI, isTauriEnvironment } from '../lib/tauri-api'

// 扩展Window类型
declare global {
  interface Window {
    __IS_TAURI_APP__?: boolean;
    __TAURI__?: any;
    __TAURI_IPC__?: any;
    __TAURI_API_INITIALIZED__?: boolean;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  // 初始化Tauri API
  useEffect(() => {
    const initTauriAPI = async () => {
      try {
        // 设置全局标记
        if (typeof window !== 'undefined') {
          // 确保环境标记存在
          window.__IS_TAURI_APP__ = true;
          
          // 添加调试信息
          console.log('检查Tauri环境初始化...');
          console.log('window.__TAURI__:', window.__TAURI__ ? '存在' : '不存在');
          console.log('window.__TAURI_IPC__:', window.__TAURI_IPC__ ? '存在' : 'undefined');
        }
        
        // 等待Tauri API加载 - 减少等待时间，提高响应速度
        const apiReady = await waitForTauriAPI(3000);
        console.log(`Tauri API 初始化${apiReady ? '成功' : '失败'}`);
        
        // 即使API未就绪也触发事件，以便允许降级到模拟数据
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tauri-api-ready'));
          // 为后续页面访问设置一个标记
          window.__TAURI_API_INITIALIZED__ = true;
        }
      } catch (error) {
        console.error('Tauri API 初始化失败:', error);
        // 即使失败也触发事件，以便系统可以降级到模拟数据
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tauri-api-ready'));
        }
      }
    };
    
    initTauriAPI();
  }, []);
  
  return <Component {...pageProps} />
}

export default MyApp 