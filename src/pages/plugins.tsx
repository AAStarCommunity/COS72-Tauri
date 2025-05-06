import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
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

// 插件信息结构
interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  url: string;
  hash: string;
  size: string;
  compatibility: string[];
}

export default function Plugins() {
  const [availablePlugins, setAvailablePlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [status, setStatus] = useState('加载中...');
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  
  // 模拟插件数据
  const mockPlugins: Plugin[] = [
    {
      id: "tee-wallet-basic",
      name: "TEE 基础钱包",
      description: "基于Teaclave TrustZone SDK的基础钱包功能，支持账户创建和交易签名",
      version: "0.1.0",
      url: "https://example.com/plugins/tee-wallet-basic-0.1.0.zip",
      hash: "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2",
      size: "2.4 MB",
      compatibility: ["ARM64", "TrustZone"]
    },
    {
      id: "tee-enclave-demo",
      name: "TEE Enclave 示例",
      description: "TEE安全环境测试插件，用于验证设备TEE功能",
      version: "0.1.0",
      url: "https://example.com/plugins/tee-enclave-demo-0.1.0.zip",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      size: "1.2 MB",
      compatibility: ["ARM64", "TrustZone", "SGX"]
    }
  ];

  // 获取硬件信息
  useEffect(() => {
    const checkHardware = async () => {
      try {
        const info = await invoke('check_hardware') as HardwareInfo;
        setHardwareInfo(info);
        
        // 获取已安装插件
        try {
          // 实际实现中应调用Rust后端获取已安装插件
          // const plugins = await invoke('get_installed_plugins');
          // setInstalledPlugins(plugins);
          setInstalledPlugins([]);
        } catch (error) {
          console.error('Failed to get installed plugins:', error);
        }
        
        setStatus('就绪');
        
        // 模拟数据
        setAvailablePlugins(mockPlugins);
      } catch (error) {
        console.error('Failed to check hardware:', error);
        setStatus('硬件检测失败');
      }
    };
    
    checkHardware();
  }, []);

  // 下载插件
  const downloadPlugin = async (plugin: Plugin) => {
    setStatus(`正在下载 ${plugin.name}...`);
    setDownloadProgress(prev => ({ ...prev, [plugin.id]: 0 }));
    
    // 模拟下载进度
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        const current = prev[plugin.id] || 0;
        if (current >= 100) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, [plugin.id]: current + 10 };
      });
    }, 500);
    
    try {
      // 实际实现中应调用Rust后端下载插件
      // const targetPath = `plugins/${plugin.id}-${plugin.version}.zip`;
      // await invoke('download_tee_plugin', { url: plugin.url, targetPath });
      
      // 模拟下载完成
      setTimeout(() => {
        clearInterval(interval);
        setDownloadProgress(prev => ({ ...prev, [plugin.id]: 100 }));
        setInstalledPlugins(prev => [...prev, plugin.id]);
        setStatus(`${plugin.name} 下载完成`);
      }, 5000);
    } catch (error) {
      clearInterval(interval);
      console.error('Download failed:', error);
      setStatus(`下载失败: ${error}`);
      setDownloadProgress(prev => ({ ...prev, [plugin.id]: 0 }));
    }
  };

  // 验证插件
  const verifyPlugin = async (plugin: Plugin) => {
    setStatus(`正在验证 ${plugin.name}...`);
    
    try {
      // 实际实现中应调用Rust后端验证插件哈希
      // const isValid = await invoke('verify_plugin_hash', { 
      //   filePath: `plugins/${plugin.id}-${plugin.version}.zip`,
      //   expectedHash: plugin.hash
      // });
      
      // 模拟验证结果
      const isValid = true;
      
      if (isValid) {
        setStatus(`${plugin.name} 验证成功`);
      } else {
        setStatus(`${plugin.name} 验证失败，哈希不匹配`);
        // 从已安装列表中移除
        setInstalledPlugins(prev => prev.filter(id => id !== plugin.id));
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setStatus(`验证失败: ${error}`);
    }
  };

  // 判断是否已安装
  const isPluginInstalled = (pluginId: string) => {
    return installedPlugins.includes(pluginId);
  };

  // 判断是否与当前硬件兼容
  const isCompatible = (plugin: Plugin) => {
    if (!hardwareInfo) return false;
    
    // 检查CPU架构兼容性
    const archCompatible = plugin.compatibility.some(comp => 
      comp === hardwareInfo.cpu.architecture || 
      (comp === "ARM64" && hardwareInfo.cpu.is_arm)
    );
    
    // 检查TEE兼容性
    const teeCompatible = plugin.compatibility.some(comp => {
      if (comp === "TrustZone") return hardwareInfo.tee.trustzone_supported;
      if (comp === "SGX") return hardwareInfo.tee.sgx_supported;
      return false;
    });
    
    return archCompatible && teeCompatible;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>插件管理 - COS72</title>
        <meta name="description" content="COS72 TEE插件管理" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">TEE插件管理</h1>
          <Link href="/">
            <a className="text-blue-500 hover:text-blue-700">返回首页</a>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">系统状态</h2>
          <p className="mb-2">{status}</p>
          
          {hardwareInfo && (
            <div className="p-4 bg-gray-50 rounded mb-4">
              <p><span className="font-medium">CPU架构:</span> {hardwareInfo.cpu.architecture}</p>
              <p>
                <span className="font-medium">TEE支持:</span> 
                {hardwareInfo.tee.tee_type !== 'none' 
                  ? <span className="text-green-600 ml-1">{hardwareInfo.tee.tee_type}</span> 
                  : <span className="text-red-600 ml-1">不支持</span>}
              </p>
            </div>
          )}
          
          {(!hardwareInfo?.cpu?.is_arm || hardwareInfo?.tee?.tee_type === 'none') && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              <p className="font-medium">警告</p>
              <p>当前设备不完全支持TEE插件功能，某些插件可能无法正常工作。</p>
            </div>
          )}
        </div>
        
        <h2 className="text-xl font-semibold mb-4">可用插件</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {availablePlugins.map(plugin => (
            <div key={plugin.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              isCompatible(plugin) ? 'border-green-500' : 'border-yellow-500'
            }`}>
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{plugin.name}</h3>
                <span className="text-sm px-2 py-1 bg-gray-200 rounded">{plugin.version}</span>
              </div>
              
              <p className="text-gray-600 my-2">{plugin.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {plugin.compatibility.map(comp => (
                  <span key={comp} className={`text-xs px-2 py-1 rounded ${
                    (comp === "ARM64" && hardwareInfo?.cpu?.is_arm) ||
                    (comp === "TrustZone" && hardwareInfo?.tee?.trustzone_supported) ||
                    (comp === "SGX" && hardwareInfo?.tee?.sgx_supported)
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {comp}
                  </span>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>大小: {plugin.size}</span>
              </div>
              
              {downloadProgress[plugin.id] > 0 && downloadProgress[plugin.id] < 100 && (
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${downloadProgress[plugin.id]}%` }} 
                    />
                  </div>
                  <p className="text-sm text-center mt-1">{downloadProgress[plugin.id]}%</p>
                </div>
              )}
              
              <div className="mt-4 flex space-x-2">
                {isPluginInstalled(plugin.id) ? (
                  <>
                    <button 
                      onClick={() => verifyPlugin(plugin)}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded"
                    >
                      已安装 ✓
                    </button>
                    <button 
                      onClick={() => verifyPlugin(plugin)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      验证
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => downloadPlugin(plugin)}
                    disabled={!isCompatible(plugin) || downloadProgress[plugin.id] > 0}
                    className={`px-3 py-1 rounded ${
                      !isCompatible(plugin) 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    下载
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-gray-600">
        <p>COS72 - 社区操作系统 v0.1.0</p>
      </footer>
    </div>
  );
} 