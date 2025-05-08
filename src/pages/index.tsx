import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
// 导入新的API包装器，而不是直接使用@tauri-apps/api
import { invoke as invokeCommand, isTauriEnvironment, waitForTauriApi } from '../lib/tauri-api';
import Layout from '../components/Layout';
import TauriApiStatus from '../components/TauriApiStatus';

// 硬件信息接口
interface HardwareInfo {
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

// TEE状态接口
interface TeeStatus {
  available: boolean;
  initialized: boolean;
  type_name: string;
  version: string;
  wallet_created: boolean;
}

export default function Home({ tauriApiReady }: { tauriApiReady?: boolean }) {
  const [greeting, setGreeting] = useState('欢迎使用 COS72 应用');
  const [status, setStatus] = useState('初始化中...');
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [teeStatus, setTeeStatus] = useState<TeeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [environment, setEnvironment] = useState<string>('检测中...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // 检测环境
  useEffect(() => {
    const checkEnvironment = async () => {
      const isTauri = await isTauriEnvironment();
      const env = isTauri ? 'Tauri 应用' : '网页浏览器';
      console.log(`检测到环境: ${env}`);
      setEnvironment(env);

      // 检查window对象上的Tauri属性
      if (typeof window !== 'undefined') {
        console.log('window.__TAURI__存在:', !!window.__TAURI__);
        console.log('window.__TAURI_IPC__类型:', typeof window.__TAURI_IPC__);
        
        // 在Tauri 2.0中，不再需要导入@tauri-apps/api/tauri
        if (isTauri) {
          console.log('在Tauri环境中运行，无需导入API');
        }
      }
    };
    
    checkEnvironment();
  }, []);

  // 检测硬件信息
  useEffect(() => {
    const checkHardware = async () => {
      try {
        setIsLoading(true);
        console.log('开始检测硬件信息...');
        
        // 等待Tauri API准备就绪
        const isTauri = await isTauriEnvironment();
        if (isTauri) {
          console.log('检测到Tauri环境，等待API就绪...');
          // 增加等待时间
          const apiReady = await waitForTauriApi(10000); // 增加到10秒
          if (!apiReady) {
            console.warn('等待Tauri API超时，将使用模拟数据');
            setStatus('无法连接到Tauri API，使用模拟数据');
          } else {
            console.log('Tauri API已就绪，继续检测');
            setStatus('API就绪，开始检测');
          }
        }
        
        // 添加更强大的重试机制
        let retryCount = 0;
        const maxRetries = 5; // 增加重试次数
        let lastError: any = null;
        
        const attemptHardwareDetection = async (): Promise<HardwareInfo> => {
          try {
            console.log(`硬件检测尝试 ${retryCount + 1}/${maxRetries + 1}`);
            
            // 显示当前状态
            setStatus(`正在检测硬件 (${retryCount + 1}/${maxRetries + 1})...`);
            
            const info = await invokeCommand('detect_hardware') as HardwareInfo;
            console.log('硬件信息获取成功:', info);
            return info;
          } catch (error) {
            lastError = error;
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`硬件检测尝试 ${retryCount}/${maxRetries} 失败，等待后重试...`);
              
              // 如果是Tauri环境但API调用失败，尝试刷新API
              if (isTauri) {
                const refreshed = await waitForTauriApi(10000);
                console.log(`API刷新${refreshed ? '成功' : '失败'}`);
              }
              
              // 等待时间随重试次数增加
              const waitTime = 500 * retryCount;
              setStatus(`检测失败，${waitTime}ms后重试 (${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              return attemptHardwareDetection();
            }
            throw error;
          }
        };
        
        try {
          const info = await attemptHardwareDetection();
          setHardwareInfo(info);
          setStatus('硬件检测完成');
          
          // 获取TEE状态
          if (info.tee.tee_type !== 'none') {
            console.log('检测到TEE支持，获取TEE状态...');
            try {
              // 同样添加重试机制
              retryCount = 0;
              const getTeeStatusWithRetry = async () => {
                try {
                  setStatus('获取TEE状态...');
                  const teeStatusResult = await invokeCommand('get_tee_status');
                  console.log('TEE状态获取成功:', teeStatusResult);
                  return teeStatusResult;
                } catch (error) {
                  if (retryCount < 3) {
                    retryCount++;
                    const waitTime = 500 * retryCount;
                    console.log(`TEE状态获取失败，${waitTime}ms后重试...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return getTeeStatusWithRetry();
                  }
                  throw error;
                }
              };
              
              const teeStatusResult = await getTeeStatusWithRetry();
              setTeeStatus(teeStatusResult as TeeStatus);
            } catch (teeError) {
              console.error('获取TEE状态失败:', teeError);
              setErrorDetails(`获取TEE状态失败: ${teeError instanceof Error ? teeError.message : String(teeError)}`);
            }
          } else {
            console.log('设备不支持TEE');
          }
        } catch (hwError) {
          console.error('硬件信息查询失败:', hwError);
          setStatus(`硬件检测失败: ${hwError instanceof Error ? hwError.message : String(hwError)}`);
          setErrorDetails(
            `尝试了${retryCount}次检测，但都失败了。\n最后一个错误: ${lastError instanceof Error ? lastError.message : String(lastError)}`
          );
          throw hwError;
        }
      } catch (error) {
        console.error('硬件检测错误:', error);
        setStatus(`硬件检测失败: ${error instanceof Error ? error.message : String(error)}`);
        setErrorDetails(
          error instanceof Error 
            ? `错误类型: ${error.name}\n消息: ${error.message}\n堆栈: ${error.stack || '无堆栈信息'}` 
            : `未知错误: ${String(error)}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    // 等待DOM加载完成后检测硬件
    if (typeof window !== 'undefined') {
      // 如果DOM已加载完成，立即执行
      if (document.readyState === 'complete') {
        checkHardware();
      } else {
        // 否则等待DOM加载完成
        window.addEventListener('load', checkHardware);
        return () => window.removeEventListener('load', checkHardware);
      }
    }
  }, []);

  // 处理挑战签名请求
  const handleChallengeSignature = async () => {
    try {
      setStatus('处理签名请求...');
      setErrorDetails(null);
      
      // 确保API就绪
      const isTauri = await isTauriEnvironment();
      if (isTauri) {
        console.log('Tauri环境中进行签名，确认API就绪状态...');
        // 增加等待时间
        const apiReady = await waitForTauriApi(10000);
        if (!apiReady) {
          console.warn('Tauri API未就绪，使用模拟数据');
          setStatus('API未就绪，使用模拟数据');
        } else {
          console.log('Tauri API已就绪，继续签名操作');
        }
      }
      
      // 模拟挑战字符串 (base64)
      const challenge = 'SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IGNoYWxsZW5nZQ==';
      
      console.log('发送签名请求，挑战值:', challenge);
      
      // 添加重试机制
      let retryCount = 0;
      const maxRetries = 3;
      let lastError: any = null;
      
      const attemptSignature = async () => {
        try {
          setStatus(`执行签名 (${retryCount + 1}/${maxRetries + 1})...`);
          const result = await invokeCommand('verify_passkey', { challenge });
          console.log('签名请求返回结果:', result);
          return result;
        } catch (error) {
          lastError = error;
          if (retryCount < maxRetries) {
            retryCount++;
            const waitTime = 500 * retryCount;
            console.log(`签名尝试 ${retryCount}/${maxRetries} 失败，${waitTime}ms后重试...`);
            
            // 如果是Tauri环境但API调用失败，尝试刷新API
            if (isTauri) {
              const refreshed = await waitForTauriApi(10000);
              console.log(`API刷新${refreshed ? '成功' : '失败'}`);
            }
            
            setStatus(`签名失败，${waitTime}ms后重试 (${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return attemptSignature();
          }
          throw error;
        }
      };
      
      // 执行签名操作
      const result = await attemptSignature();
      
      // 处理不同格式的返回值
      if (typeof result === 'object' && result !== null) {
        if ('signature' in result) {
          setStatus(`签名成功: ${result.signature}`);
        } else if ('success' in result && result.success) {
          setStatus(`签名成功: ${JSON.stringify(result)}`);
        } else {
          setStatus(`签名完成: ${JSON.stringify(result)}`);
        }
      } else {
        setStatus(`签名结果: ${String(result)}`);
      }
    } catch (error) {
      console.error('签名错误:', error);
      setErrorDetails(error instanceof Error ? error.message : String(error));
      setStatus(`签名失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 初始化TEE
  const handleInitializeTee = async () => {
    if (!hardwareInfo?.tee?.tee_type || hardwareInfo.tee.tee_type === 'none') {
      setStatus('此设备不支持TEE');
      return;
    }
    
    try {
      // 确保API就绪
      const isTauri = await isTauriEnvironment();
      if (isTauri) {
        const apiReady = await waitForTauriApi(10000);
        if (!apiReady) {
          console.warn('Tauri API未就绪，使用模拟数据');
          setStatus('API未就绪，使用模拟数据');
        }
      }
      
      setStatus('正在初始化TEE环境...');
      const result = await invokeCommand('initialize_tee');
      if (result) {
        setStatus('TEE初始化成功');
        // 刷新TEE状态
        const newStatus = await invokeCommand('get_tee_status');
        setTeeStatus(newStatus as TeeStatus);
      } else {
        setStatus('TEE初始化失败');
      }
    } catch (error) {
      console.error('TEE initialization error:', error);
      setStatus(`TEE初始化失败: ${error}`);
    }
  };

  // 创建钱包
  const handleCreateWallet = async () => {
    try {
      // 确保API就绪
      const isTauri = await isTauriEnvironment();
      if (isTauri) {
        const apiReady = await waitForTauriApi(3000);
        if (!apiReady) {
          console.warn('Tauri API未就绪，使用模拟数据');
          setStatus('API未就绪，使用模拟数据');
        }
      }
      
      setStatus('正在创建钱包...');
      const result = await invokeCommand('perform_tee_operation', { 
        operation: 'CreateWallet'
      });
      
      if ((result as any).success) {
        setStatus('钱包创建成功');
        // 刷新TEE状态
        const newStatus = await invokeCommand('get_tee_status');
        setTeeStatus(newStatus as TeeStatus);
      } else {
        setStatus(`钱包创建失败: ${(result as any).message}`);
      }
    } catch (error) {
      console.error('Wallet creation error:', error);
      setStatus(`钱包创建失败: ${error}`);
    }
  };

  // 切换调试信息显示
  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };

  return (
    <Layout>
      <Head>
        <title>COS72 - Tauri 应用</title>
        <meta name="description" content="COS72 - Tauri 应用，集成了多种高级功能和安全特性" />
      </Head>

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <header className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{greeting}</h1>
          <p className="text-md text-gray-600">当前运行环境: {environment}</p>
          <p className="text-sm text-gray-500 mt-1">状态: {status}</p>
        </header>

        {/* 调试工具导航 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mb-8">
          <Link href="/tauri-debug" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Tauri 调试面板</h2>
            <p className="text-gray-600">查看系统信息、硬件配置和Tauri运行状态</p>
          </Link>
          
          <Link href="/tauri-communication-demo" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Tauri 通信示例</h2>
            <p className="text-gray-600">展示三种前后端通信方式：直接调用、计算器模式和事件模式</p>
          </Link>
        </div>

        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-8">{greeting}</h1>
          
          {/* 添加Tauri API状态组件 */}
          <div className="mb-8">
            <TauriApiStatus tauriApiReady={tauriApiReady} />
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">系统状态</h2>
            
            <div className="mb-4">
              <div className="font-medium">运行环境: <span className="font-normal">{environment}</span></div>
              <div className="font-medium">当前状态: <span className="font-normal">{status}</span></div>
            </div>
            
            {/* 现有的硬件信息显示 */}
            {hardwareInfo && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">硬件信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">CPU:</div>
                    <div className="ml-4 text-sm">
                      <div>架构: {hardwareInfo.cpu.architecture}</div>
                      <div>型号: {hardwareInfo.cpu.model_name}</div>
                      <div>核心数: {hardwareInfo.cpu.cores}</div>
                      <div>ARM架构: {hardwareInfo.cpu.is_arm ? '是' : '否'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">内存:</div>
                    <div className="ml-4 text-sm">{(hardwareInfo.memory / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                    
                    <div className="font-medium mt-2">可信执行环境 (TEE):</div>
                    <div className="ml-4 text-sm">
                      <div>类型: {hardwareInfo.tee.tee_type}</div>
                      <div>SGX: {hardwareInfo.tee.sgx_supported ? '支持' : '不支持'}</div>
                      <div>TrustZone: {hardwareInfo.tee.trustzone_supported ? '支持' : '不支持'}</div>
                      <div>Secure Enclave: {hardwareInfo.tee.secure_enclave_supported ? '支持' : '不支持'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 现有的TEE状态显示 */}
            {teeStatus && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">TEE状态</h3>
                <div className="ml-4 text-sm">
                  <div>可用: {teeStatus.available ? '是' : '否'}</div>
                  <div>已初始化: {teeStatus.initialized ? '是' : '否'}</div>
                  <div>类型: {teeStatus.type_name}</div>
                  <div>版本: {teeStatus.version}</div>
                  <div>钱包已创建: {teeStatus.wallet_created ? '是' : '否'}</div>
                </div>
              </div>
            )}
            
            {/* 现有的操作按钮 */}
            <div className="flex flex-wrap gap-2 mt-6">
              <button
                onClick={handleChallengeSignature}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-400"
              >
                签名挑战
              </button>
              
              {teeStatus && !teeStatus.initialized && (
                <button
                  onClick={handleInitializeTee}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:bg-gray-400"
                >
                  初始化TEE
                </button>
              )}
              
              {teeStatus && teeStatus.initialized && !teeStatus.wallet_created && (
                <button
                  onClick={handleCreateWallet}
                  disabled={isLoading}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded disabled:bg-gray-400"
                >
                  创建钱包
                </button>
              )}
            </div>
          </div>
          
          {/* 错误详情部分 */}
          {errorDetails && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-8">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">错误详情</h3>
              <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono bg-red-100/50 dark:bg-red-900/50 p-2 rounded">
                {errorDetails}
              </pre>
            </div>
          )}
          
          {/* 开发者调试按钮 */}
          <div className="text-center mb-4">
            <button
              onClick={toggleDebug}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {showDebug ? '隐藏调试信息' : '显示调试信息'}
            </button>
          </div>
          
          {/* 调试信息 */}
          {showDebug && typeof window !== 'undefined' && (
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-8">
              <h3 className="text-lg font-medium mb-2">调试信息</h3>
              <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto bg-gray-200 dark:bg-gray-800 p-2 rounded">
                {`环境: ${environment}
状态: ${status}
Tauri API就绪: ${tauriApiReady ? '是' : '否'}
window.__IS_TAURI_APP__: ${String(Boolean(window.__IS_TAURI_APP__))}
window.__TAURI__: ${typeof window.__TAURI__ !== 'undefined' ? '存在' : '不存在'}
window.__TAURI_IPC__: ${typeof window.__TAURI_IPC__ !== 'undefined' ? '存在' : '不存在'}`}
              </pre>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
} 