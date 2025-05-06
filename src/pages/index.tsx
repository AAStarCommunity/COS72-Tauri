import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';
import Head from 'next/head';
import Link from 'next/link';

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

  // 检测硬件信息
  useEffect(() => {
    const checkHardware = async () => {
      try {
        setIsLoading(true);
        const info = await invoke('check_hardware') as HardwareInfo;
        setHardwareInfo(info);
        setStatus('硬件检测完成');
        
        // 获取TEE状态
        if (info.tee.tee_type !== 'none') {
          try {
            const teeStatusResult = await invoke('get_tee_status');
            setTeeStatus(teeStatusResult as TeeStatus);
          } catch (error) {
            console.error('Failed to get TEE status:', error);
          }
        }
      } catch (error) {
        console.error('Hardware detection error:', error);
        setStatus(`硬件检测失败: ${error}`);
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
      const signature = await invoke('get_challenge_signature', { challenge });
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
      const result = await invoke('initialize_tee');
      if (result) {
        setStatus('TEE初始化成功');
        // 刷新TEE状态
        const newStatus = await invoke('get_tee_status');
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
      const result = await invoke('perform_tee_operation', { 
        operation: 'create_wallet',
        params: null
      });
      
      if ((result as any).success) {
        setStatus('钱包创建成功');
        // 刷新TEE状态
        const newStatus = await invoke('get_tee_status');
        setTeeStatus(newStatus as TeeStatus);
      } else {
        setStatus(`钱包创建失败: ${(result as any).message}`);
      }
    } catch (error) {
      console.error('Wallet creation error:', error);
      setStatus(`钱包创建失败: ${error}`);
    }
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
            <p className="text-red-500">无法获取硬件信息</p>
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
        <p>COS72 - 社区操作系统 v0.2.0</p>
      </footer>
    </div>
  );
} 