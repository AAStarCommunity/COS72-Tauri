import { useState, useEffect } from 'react';
import { isTauriEnvironment, invoke } from '../lib/tauri-api';
import Head from 'next/head';
import Link from 'next/link';

export default function TauriEnvironmentCheck() {
  const [envInfo, setEnvInfo] = useState<any>({
    isTauri: false,
    windowTauriExists: false,
    windowTauriIpcExists: false,
    isTauriAppExists: false,
    metaTagExists: false,
    windowLocation: "",
    userAgent: "",
    protocol: "",
    hostname: "",
    port: "",
    pathname: "",
    title: "",
    windowKeys: []
  });
  
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 收集环境信息
    const collectEnvInfo = () => {
      try {
        // 基本环境信息
        const isTauri = isTauriEnvironment();
        
        // 避免类型错误
        const windowObj = window as any;
        
        // 检查Tauri对象和元数据
        const windowTauriExists = typeof windowObj.__TAURI__ !== 'undefined';
        const windowTauriIpcExists = typeof windowObj.__TAURI_IPC__ !== 'undefined';
        const isTauriAppExists = Boolean(windowObj.__IS_TAURI_APP__);
        const metaTagExists = document.querySelector('meta[name="tauri-dev"]') !== null;
        
        // 获取当前位置信息
        const windowLocation = window.location.href;
        const userAgent = navigator.userAgent;
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        const pathname = window.location.pathname;
        const title = document.title;
        
        // 获取所有window对象的键（仅取前100个，避免过多）
        const windowKeys = Object.keys(windowObj).slice(0, 100);
        
        // 查找任何可能与Tauri相关的键
        const tauriRelatedKeys = windowKeys.filter(key => 
          key.toLowerCase().includes('tauri')
        );
        
        setEnvInfo({
          isTauri,
          windowTauriExists,
          windowTauriIpcExists,
          isTauriAppExists,
          metaTagExists,
          windowLocation,
          userAgent,
          protocol,
          hostname,
          port,
          pathname,
          title,
          windowKeys,
          tauriRelatedKeys
        });
        
        setLoading(false);
      } catch (error) {
        console.error('环境检测错误:', error);
        setEnvInfo({
          error: String(error)
        });
        setLoading(false);
      }
    };
    
    collectEnvInfo();
  }, []);

  // 测试invoke调用
  const testInvoke = async (command: string) => {
    try {
      setTestResults((prev: any) => ({ ...prev, [command]: { status: 'loading' } }));
      console.log(`测试调用 ${command}...`);
      
      const result = await invoke(command);
      console.log(`${command} 调用成功:`, result);
      
      setTestResults((prev: any) => ({ 
        ...prev, 
        [command]: { 
          status: 'success', 
          result,
          time: new Date().toLocaleTimeString()
        } 
      }));
    } catch (error) {
      console.error(`${command} 调用失败:`, error);
      
      setTestResults((prev: any) => ({ 
        ...prev, 
        [command]: { 
          status: 'error', 
          error: String(error),
          time: new Date().toLocaleTimeString() 
        } 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Tauri 环境检测 - COS72</title>
        <meta name="description" content="检测和诊断Tauri环境" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Tauri 环境检测</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-500">加载中...</div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">基本环境信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border" style={{ 
                  backgroundColor: envInfo.isTauri ? '#d1fae5' : '#fee2e2',
                  borderColor: envInfo.isTauri ? '#10b981' : '#ef4444' 
                }}>
                  <div className="text-lg font-semibold mb-2">
                    {envInfo.isTauri ? 'Tauri 应用环境 ✓' : '非 Tauri 环境 ✗'}
                  </div>
                  <p className="text-sm">
                    {envInfo.isTauri 
                      ? '当前运行在Tauri应用环境中，应当可以正常调用Tauri API。' 
                      : '当前运行在普通Web环境中，Tauri API调用将使用模拟数据。'}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="text-lg font-semibold mb-2">页面信息</div>
                  <div className="text-xs font-mono overflow-hidden text-ellipsis">
                    <div>URL: {envInfo.windowLocation}</div>
                    <div>协议: {envInfo.protocol}</div>
                    <div>主机: {envInfo.hostname}</div>
                    <div>端口: {envInfo.port}</div>
                    <div>路径: {envInfo.pathname}</div>
                    <div>标题: {envInfo.title}</div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mt-6 mb-2">Tauri API 检测</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className={`p-2 rounded border ${envInfo.windowTauriExists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    window.__TAURI__: {envInfo.windowTauriExists ? '存在 ✓' : '不存在 ✗'}
                  </div>
                  <div className={`p-2 rounded border ${envInfo.windowTauriIpcExists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    window.__TAURI_IPC__: {envInfo.windowTauriIpcExists ? '存在 ✓' : '不存在 ✗'}
                  </div>
                  <div className={`p-2 rounded border ${envInfo.isTauriAppExists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    window.__IS_TAURI_APP__: {envInfo.isTauriAppExists ? '存在 ✓' : '不存在 ✗'}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className={`p-2 rounded border ${envInfo.metaTagExists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    meta[name="tauri-dev"]: {envInfo.metaTagExists ? '存在 ✓' : '不存在 ✗'}
                  </div>
                  <div className="p-2 rounded border bg-gray-50 border-gray-200 text-xs font-mono overflow-hidden text-ellipsis">
                    User-Agent: {envInfo.userAgent}
                  </div>
                </div>
              </div>
              
              {envInfo.tauriRelatedKeys && envInfo.tauriRelatedKeys.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">找到的Tauri相关对象</h3>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200 text-xs font-mono">
                    {envInfo.tauriRelatedKeys.map((key: string) => (
                      <div key={key} className="mb-1">{key}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">API 测试</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => testInvoke('detect_hardware')}
                  className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  测试硬件检测 API
                </button>
                
                <button
                  onClick={() => testInvoke('webauthn_supported')}
                  className="p-3 bg-green-500 hover:bg-green-600 text-white rounded"
                >
                  测试 WebAuthn 支持
                </button>
                
                <button
                  onClick={() => testInvoke('webauthn_biometric_supported')}
                  className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded"
                >
                  测试生物识别支持
                </button>
                
                <Link href="/test-passkey">
                  <button className="w-full p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded">
                    前往 Passkey 测试页面
                  </button>
                </Link>
              </div>
              
              {/* 测试结果 */}
              {Object.keys(testResults).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">测试结果</h3>
                  
                  {Object.entries(testResults).map(([command, data]: [string, any]) => (
                    <div key={command} className="mb-4">
                      <div className="font-medium mb-1">{command}</div>
                      
                      {data.status === 'loading' ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-blue-700">加载中...</p>
                        </div>
                      ) : data.status === 'error' ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-red-700">错误: {data.error}</p>
                          <p className="text-xs text-gray-500 mt-1">时间: {data.time}</p>
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-green-700">成功</p>
                          <pre className="text-xs font-mono mt-2 overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                            {JSON.stringify(data.result, null, 2)}
                          </pre>
                          <p className="text-xs text-gray-500 mt-1">时间: {data.time}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">调试帮助</h2>
              
              <div className="text-sm space-y-2">
                <p>如果Tauri环境检测失败，请检查:</p>
                <ul className="list-disc ml-6">
                  <li>确保应用是通过Tauri启动的，而不是直接通过浏览器访问</li>
                  <li>检查tauri.conf.json中的配置是否正确</li>
                  <li>确保src-tauri/src/main.rs中的window.eval()正确注入了环境标识符</li>
                  <li>在开发模式下，确保正确使用npm/tauri run dev命令启动</li>
                  <li>检查控制台是否有任何错误信息</li>
                </ul>
                
                <p className="mt-4">如果遇到API调用问题:</p>
                <ul className="list-disc ml-6">
                  <li>确保命令在src-tauri/src/main.rs中正确注册</li>
                  <li>确保命令名与前端调用名称一致</li>
                  <li>检查参数类型是否匹配</li>
                  <li>查看后端日志输出，寻找详细错误信息</li>
                </ul>
              </div>
            </div>
          </>
        )}
        
        <div className="text-center mt-6">
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            返回主页
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-600">
        <p>COS72 - 社区操作系统 v0.2.8</p>
      </footer>
    </div>
  );
} 