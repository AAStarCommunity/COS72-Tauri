'use client';

import React, { useEffect, useState } from 'react';
import { invoke } from '../lib/tauri-api';

interface TauriApiStatusProps {
  tauriApiReady?: boolean;
}

const TauriApiStatus: React.FC<TauriApiStatusProps> = ({ tauriApiReady = false }) => {
  const [apiVersion, setApiVersion] = useState<string>('未知');
  const [testResult, setTestResult] = useState<string>('未测试');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (isClient) {
      checkApiStatus();
    }
  }, [tauriApiReady, isClient]);

  const checkApiStatus = async () => {
    if (!tauriApiReady) {
      setApiVersion('API未就绪');
      return;
    }

    try {
      // 尝试获取API版本
      if (typeof window !== 'undefined') {
        setApiVersion(window.__TAURI_IPC__?.metadata?.version || 
                     window.__TAURI__?.metadata?.version || '未知');
      }
    } catch (err) {
      console.error('获取API版本失败', err);
      setApiVersion('获取失败');
    }
  };

  const testApi = async () => {
    setLoading(true);
    setError(null);
    setTestResult('测试中...');

    try {
      if (!tauriApiReady) {
        throw new Error('Tauri API未就绪');
      }

      // 尝试调用一个简单的后端命令
      const result = await invoke<string>('test_api_connection');
      setTestResult(result || '成功但无返回值');
    } catch (err) {
      console.error('API测试失败', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setTestResult('测试失败');
    } finally {
      setLoading(false);
    }
  };

  // 如果在服务器端渲染，返回最小组件
  if (!isClient) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-bold mb-4">Tauri API 状态</h2>
        <div className="mb-4">
          <div>正在加载API状态...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4">Tauri API 状态</h2>
      
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className="font-medium">API状态:</span>
          <span className={`px-2 py-1 rounded text-sm ${tauriApiReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {tauriApiReady ? '就绪' : '未就绪'}
          </span>
        </div>
        
        <div className="mt-2">
          <span className="font-medium">API版本:</span> {apiVersion}
        </div>
      </div>
      
      {typeof window !== 'undefined' && (
        <div className="mb-4">
          <div className="font-medium mb-2">API对象检测:</div>
          <div className="text-sm space-y-1">
            <div>__IS_TAURI_APP__: {window.__IS_TAURI_APP__ ? '存在' : '不存在'}</div>
            <div>__TAURI__: {typeof window.__TAURI__ !== 'undefined' ? '存在' : '不存在'}</div>
            <div>__TAURI_IPC__: {typeof window.__TAURI_IPC__ !== 'undefined' ? '存在' : '不存在'}</div>
            <div>ipcNative: {typeof window.ipcNative !== 'undefined' ? '存在' : '不存在'}</div>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <div className="font-medium mb-2">API测试结果:</div>
        <div className="text-sm">{testResult}</div>
        {error && (
          <div className="text-sm text-red-600 mt-1">{error}</div>
        )}
      </div>
      
      <button
        onClick={testApi}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? '测试中...' : '测试API'}
      </button>
    </div>
  );
};

export default TauriApiStatus; 