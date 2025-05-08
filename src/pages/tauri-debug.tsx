import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function TauriDebugPage() {
  const [apiState, setApiState] = useState({
    isChecking: true,
    environmentInfo: {} as any,
    apiDetails: {} as any,
    errors: [] as string[],
    logs: [] as string[]
  });

  useEffect(() => {
    // 添加日志拦截器
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const logHistory: string[] = [];

    // 覆盖console.log
    console.log = (...args) => {
      originalConsoleLog(...args);
      const logMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      logHistory.push(`[Log] ${logMessage}`);
      setApiState(prev => ({...prev, logs: [...logHistory]}));
    };

    // 覆盖console.error
    console.error = (...args) => {
      originalConsoleError(...args);
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      logHistory.push(`[Error] ${errorMessage}`);
      setApiState(prev => ({...prev, logs: [...logHistory]}));
    };

    // 检查Tauri环境状态
    checkTauriEnvironment();

    // 清理函数
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  // 检查Tauri环境
  const checkTauriEnvironment = () => {
    try {
      const envInfo = {
        isTauriApp: Boolean(window.__IS_TAURI_APP__),
        tauriExists: typeof window.__TAURI__ !== 'undefined',
        tauriInvoke: typeof window.__TAURI__?.invoke === 'function',
        tauriIpcExists: typeof window.__TAURI_IPC__ !== 'undefined',
        tauriInternalsExists: typeof window.__TAURI_INTERNALS__ !== 'undefined',
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timeOfCheck: new Date().toISOString()
      };

      // 获取详细的API信息
      const apiDetails = {
        tauriObjectKeys: typeof window.__TAURI__ !== 'undefined' ? Object.keys(window.__TAURI__) : [],
        tauriIpcType: typeof window.__TAURI_IPC__,
        tauriInternalsType: typeof window.__TAURI_INTERNALS__,
        hasEventApi: typeof window.__TAURI__?.event !== 'undefined',
        hasInvokeApi: typeof window.__TAURI__?.invoke !== 'undefined',
        windowObjectLength: Object.keys(window).length
      };

      setApiState(prev => ({
        ...prev,
        isChecking: false,
        environmentInfo: envInfo,
        apiDetails: apiDetails
      }));

      console.log('环境检测完成', envInfo);
    } catch (error) {
      console.error('环境检测失败', error);
      setApiState(prev => ({
        ...prev,
        isChecking: false,
        errors: [...prev.errors, String(error)]
      }));
    }
  };

  // 尝试手动创建IPC通信
  const attemptCreateIPC = () => {
    try {
      if (typeof window.__TAURI__ === 'undefined') {
        window.__TAURI__ = {};
        console.log('创建了空的 __TAURI__ 对象');
      }

      if (typeof window.__TAURI__.invoke !== 'function') {
        window.__TAURI__.invoke = (cmd, args) => {
          console.log(`模拟调用: ${cmd}`, args);
          return Promise.resolve({ success: true, mock: true, command: cmd });
        };
        console.log('创建了模拟的 invoke 函数');
      }

      checkTauriEnvironment();
    } catch (error) {
      console.error('手动创建IPC失败', error);
    }
  };

  // 请求重新注入API
  const requestReinjectApi = () => {
    try {
      console.log('请求重新注入API');
      window.dispatchEvent(new CustomEvent('tauri-reinject-api'));
      
      // 2秒后再次检查
      setTimeout(() => {
        checkTauriEnvironment();
      }, 2000);
    } catch (error) {
      console.error('重新注入API请求失败', error);
    }
  };

  // 清除日志
  const clearLogs = () => {
    setApiState(prev => ({...prev, logs: []}));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Tauri 调试工具</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Tauri API 调试工具</h1>

        {apiState.isChecking ? (
          <div className="text-center py-10">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 环境信息卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">环境信息</h2>
              <div className="space-y-2">
                <div className={`p-2 rounded ${apiState.environmentInfo.isTauriApp ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-medium">是否Tauri环境: </span>
                  {apiState.environmentInfo.isTauriApp ? '是 ✓' : '否 ✗'}
                </div>
                <div className={`p-2 rounded ${apiState.environmentInfo.tauriExists ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-medium">window.__TAURI__: </span>
                  {apiState.environmentInfo.tauriExists ? '存在 ✓' : '不存在 ✗'}
                </div>
                <div className={`p-2 rounded ${apiState.environmentInfo.tauriInvoke ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-medium">window.__TAURI__.invoke: </span>
                  {apiState.environmentInfo.tauriInvoke ? '可用 ✓' : '不可用 ✗'}
                </div>
                <div className={`p-2 rounded ${apiState.environmentInfo.tauriIpcExists ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-medium">window.__TAURI_IPC__: </span>
                  {apiState.environmentInfo.tauriIpcExists ? '存在 ✓' : '不存在 ✗'}
                </div>
                <div className={`p-2 rounded ${apiState.environmentInfo.tauriInternalsExists ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-medium">window.__TAURI_INTERNALS__: </span>
                  {apiState.environmentInfo.tauriInternalsExists ? '存在 ✓' : '不存在 ✗'}
                </div>
                <div className="p-2 rounded bg-gray-100">
                  <span className="font-medium">User Agent: </span>
                  <span className="text-xs font-mono">{apiState.environmentInfo.userAgent}</span>
                </div>
                <div className="p-2 rounded bg-gray-100">
                  <span className="font-medium">检测时间: </span>
                  {apiState.environmentInfo.timeOfCheck}
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <button 
                  onClick={checkTauriEnvironment}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  重新检测
                </button>
                <button 
                  onClick={attemptCreateIPC}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  尝试手动创建API
                </button>
                <button 
                  onClick={requestReinjectApi}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  请求重新注入API
                </button>
              </div>
            </div>

            {/* API详情卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">API详情</h2>
              
              {apiState.apiDetails.tauriObjectKeys && apiState.apiDetails.tauriObjectKeys.length > 0 ? (
                <div className="mb-4">
                  <h3 className="font-medium">__TAURI__ 对象包含的键:</h3>
                  <div className="bg-gray-100 p-2 rounded mt-1">
                    {apiState.apiDetails.tauriObjectKeys.map((key: string, index: number) => (
                      <div key={index} className="text-sm font-mono">{key}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4 text-red-500">__TAURI__ 对象不存在或没有键</div>
              )}
              
              <div className="space-y-2">
                <div className="p-2 rounded bg-gray-100">
                  <span className="font-medium">__TAURI_IPC__ 类型: </span>
                  {apiState.apiDetails.tauriIpcType}
                </div>
                <div className="p-2 rounded bg-gray-100">
                  <span className="font-medium">__TAURI_INTERNALS__ 类型: </span>
                  {apiState.apiDetails.tauriInternalsType}
                </div>
                <div className={`p-2 rounded ${apiState.apiDetails.hasEventApi ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-medium">事件API可用: </span>
                  {apiState.apiDetails.hasEventApi ? '是 ✓' : '否 ✗'}
                </div>
                <div className={`p-2 rounded ${apiState.apiDetails.hasInvokeApi ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-medium">invoke API可用: </span>
                  {apiState.apiDetails.hasInvokeApi ? '是 ✓' : '否 ✗'}
                </div>
              </div>
            </div>

            {/* 日志卡片 */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">控制台日志</h2>
                <button 
                  onClick={clearLogs}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                >
                  清除日志
                </button>
              </div>
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-80 overflow-y-auto">
                {apiState.logs.length > 0 ? (
                  apiState.logs.map((log, index) => (
                    <div key={index} className={`${log.includes('[Error]') ? 'text-red-400' : ''}`}>
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">暂无日志</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 