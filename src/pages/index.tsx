import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
// 导入新的API包装器，而不是直接使用@tauri-apps/api
import { invokeCommand, isTauriEnvironment } from '../lib/tauri-api';

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

export default function Home() {
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
    const env = isTauriEnvironment() ? 'Tauri 应用' : '网页浏览器';
    console.log(`检测到环境: ${env}`);
    setEnvironment(env);

    // 检查window对象上的Tauri属性
    if (typeof window !== 'undefined') {
      console.log('window.__TAURI__存在:', !!window.__TAURI__);
      console.log('window.__TAURI_IPC__类型:', typeof window.__TAURI_IPC__);
      
      // 检查Tauri API是否可用
      if (isTauriEnvironment()) {
        import('@tauri-apps/api/tauri').then(() => {
          console.log('Tauri API导入成功');
        }).catch(err => {
          console.error('Tauri API导入失败:', err);
          setErrorDetails(`Tauri API导入失败: ${err.message}`);
        });
      }
    }
  }, []);

  // 检测硬件信息
  useEffect(() => {
    const checkHardware = async () => {
      try {
        setIsLoading(true);
        console.log('开始检测硬件信息...');
        
        try {
          const info = await invokeCommand('check_hardware') as HardwareInfo;
          console.log('硬件信息获取成功:', info);
          setHardwareInfo(info);
          setStatus('硬件检测完成');
          
          // 获取TEE状态
          if (info.tee.tee_type !== 'none') {
            console.log('检测到TEE支持，获取TEE状态...');
            try {
              const teeStatusResult = await invokeCommand('get_tee_status');
              console.log('TEE状态获取成功:', teeStatusResult);
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

    // 应用加载后检测硬件
    checkHardware();
  }, []);

  // 处理挑战签名请求
  const handleChallengeSignature = async () => {
    try {
      setStatus('处理签名请求...');
      // 模拟挑战字符串 (base64)
      const challenge = 'SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IGNoYWxsZW5nZQ==';
      const signature = await invokeCommand('get_challenge_signature', { challenge });
      setStatus(`签名成功: ${signature}`);
    } catch (error) {
      console.error('Signature error:', error);
      setStatus(`签名失败: ${error}`);
    }
  };

  // 初始化TEE
  const handleInitializeTee = async () => {
    if (!hardwareInfo?.tee?.tee_type || hardwareInfo.tee.tee_type === 'none') {
      setStatus('此设备不支持TEE');
      return;
    }
    
    try {
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
      setStatus('正在创建钱包...');
      const result = await invokeCommand('perform_tee_operation', { 
        operation: 'create_wallet',
        params: null
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
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>COS72 - 社区操作系统</title>
        <meta name="description" content="基于Tauri的社区操作系统" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">{greeting}</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">系统状态</h2>
          <p className="mb-2">{status}</p>
          <p className="text-sm text-gray-500 mb-4">运行环境: {environment}</p>
          
          {/* 调试按钮 */}
          <div className="mb-4 flex justify-end">
            <button 
              onClick={toggleDebug}
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              {showDebug ? '隐藏调试信息' : '显示调试信息'}
            </button>
          </div>
          
          {/* 错误详情 */}
          {errorDetails && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
              <p className="font-semibold">错误详情:</p>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{errorDetails}</pre>
            </div>
          )}
          
          {/* 调试信息 */}
          {showDebug && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-700 mb-4">
              <p className="font-semibold">调试信息:</p>
              <ul className="text-xs mt-1">
                <li>运行环境: {environment}</li>
                <li>window.__TAURI__: {typeof window !== 'undefined' ? String(!!window.__TAURI__) : 'undefined'}</li>
                <li>window.__TAURI_IPC__: {typeof window !== 'undefined' ? typeof window.__TAURI_IPC__ : 'undefined'}</li>
                <li>isTauriEnvironment(): {String(isTauriEnvironment())}</li>
                <li>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'undefined'}</li>
              </ul>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : hardwareInfo ? (
            <div className="mt-4">
              <h3 className="font-medium mb-2">硬件信息</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p><span className="font-medium">CPU:</span> {hardwareInfo.cpu.model_name}</p>
                <p><span className="font-medium">架构:</span> {hardwareInfo.cpu.architecture} 
                  {hardwareInfo.cpu.is_arm && <span className="ml-2 text-green-600 font-medium">(ARM)</span>}
                </p>
                <p><span className="font-medium">核心数:</span> {hardwareInfo.cpu.cores}</p>
                <p><span className="font-medium">内存:</span> {hardwareInfo.memory} MB</p>
                <p><span className="font-medium">TEE 支持:</span> {hardwareInfo.tee.tee_type !== 'none' 
                  ? <span className="text-green-600">是 ({hardwareInfo.tee.tee_type})</span> 
                  : <span className="text-red-600">否</span>}
                </p>
              </div>
              
              {teeStatus && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">TEE 状态</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p><span className="font-medium">可用:</span> {teeStatus.available ? '是' : '否'}</p>
                    <p><span className="font-medium">已初始化:</span> {teeStatus.initialized ? '是' : '否'}</p>
                    <p><span className="font-medium">类型:</span> {teeStatus.type_name}</p>
                    <p><span className="font-medium">版本:</span> {teeStatus.version}</p>
                    <p><span className="font-medium">钱包已创建:</span> {teeStatus.wallet_created ? '是' : '否'}</p>
                    
                    {!teeStatus.initialized && hardwareInfo.tee.tee_type !== 'none' && (
                      <button 
                        onClick={handleInitializeTee}
                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 text-sm rounded"
                      >
                        初始化TEE
                      </button>
                    )}
                    
                    {teeStatus.initialized && !teeStatus.wallet_created && (
                      <button 
                        onClick={handleCreateWallet}
                        className="mt-2 bg-green-500 hover:bg-green-600 text-white py-1 px-3 text-sm rounded"
                      >
                        创建钱包
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              <p className="font-semibold">无法获取硬件信息</p>
              <p className="text-sm mt-1">请检查应用权限和系统状态</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 text-sm rounded"
              >
                重试
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">生物识别签名</h2>
            <p className="mb-4">使用FIDO2/Passkey进行生物识别签名</p>
            <button 
              onClick={handleChallengeSignature}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              测试签名
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">TEE插件</h2>
            {hardwareInfo?.cpu?.is_arm ? (
              <>
                <p className="text-green-600 mb-2">检测到ARM架构，支持TEE插件</p>
                <Link href="/plugins">
                  <span className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded inline-block cursor-pointer">
                    下载TEE插件
                  </span>
                </Link>
              </>
            ) : (
              <p className="text-yellow-600">
                当前设备不是ARM架构，无法使用TEE插件
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-600">
        <p>COS72 - 社区操作系统 v0.2.1</p>
      </footer>
    </div>
  );
} 