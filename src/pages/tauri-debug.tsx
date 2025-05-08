import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  isTauriEnvironment, 
  detectHardware, 
  getSystemInfo,  // 导入新的系统信息API
  testApiConnection,
  getTeeStatus
} from '../lib/tauri-api';

// Tauri环境检测组件
const TauriEnvironmentCheck = () => {
  const [isTauri, setIsTauri] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const result = await isTauriEnvironment();
        setIsTauri(result);
      } catch (error) {
        console.error('环境检测失败:', error);
        setIsTauri(false);
      } finally {
        setLoading(false);
      }
    };

    checkEnvironment();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-slate-50 my-4">
        <h3 className="font-medium text-lg mb-2">Tauri环境检测</h3>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg my-4 ${isTauri ? 'bg-green-50' : 'bg-red-50'}`}>
      <h3 className="font-medium text-lg mb-2">Tauri环境检测</h3>
      {isTauri ? (
        <div className="text-green-700">
          ✓ 当前在Tauri环境中运行
        </div>
      ) : (
        <div className="text-red-700">
          ✗ 当前不在Tauri环境中运行
        </div>
      )}
    </div>
  );
};

// 硬件检测组件
const HardwareDetection = () => {
  const [hardware, setHardware] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectHardwareInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const info = await detectHardware();
      console.log('硬件信息:', info);
      setHardware(info);
    } catch (err) {
      console.error('硬件检测失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectHardwareInfo();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-slate-50 my-4">
        <h3 className="font-medium text-lg mb-2">硬件检测</h3>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 my-4">
        <h3 className="font-medium text-lg mb-2">硬件检测</h3>
        <div className="text-red-600">硬件检测失败: {error}</div>
        <button 
          onClick={detectHardwareInfo}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          重试
        </button>
      </div>
    );
  }

  if (!hardware) {
    return (
      <div className="p-4 border rounded-lg bg-slate-50 my-4">
        <h3 className="font-medium text-lg mb-2">硬件检测</h3>
        <div>未获取到硬件信息</div>
        <button 
          onClick={detectHardwareInfo}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          检测硬件
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-slate-50 my-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">硬件检测结果</h3>
        <button 
          onClick={detectHardwareInfo}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          刷新
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-md p-3 bg-white">
          <h4 className="font-medium text-md mb-2">CPU信息</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">型号:</span> {hardware.cpu_info?.model_name || 'Unknown'}</div>
            <div><span className="font-medium">核心数:</span> {hardware.cpu_info?.cores || 0}</div>
            <div><span className="font-medium">是否ARM架构:</span> {hardware.cpu_info?.is_arm ? '是' : '否'}</div>
            <div><span className="font-medium">架构:</span> {hardware.cpu_info?.architecture || 'Unknown'}</div>
          </div>
        </div>
        
        <div className="border rounded-md p-3 bg-white">
          <h4 className="font-medium text-md mb-2">可信执行环境(TEE)支持</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">TEE类型:</span> {hardware.tee_support?.tee_type || 'none'}</div>
            <div><span className="font-medium">SGX:</span> {hardware.tee_support?.sgx_supported ? '支持 ✓' : '不支持 ✗'}</div>
            <div><span className="font-medium">TrustZone:</span> {hardware.tee_support?.trustzone_supported ? '支持 ✓' : '不支持 ✗'}</div>
            <div><span className="font-medium">Secure Enclave:</span> {hardware.tee_support?.secure_enclave_supported ? '支持 ✓' : '不支持 ✗'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// TEE状态检查组件
const TeeStatusCheck = () => {
  const [teeStatus, setTeeStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkTeeStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const status = await getTeeStatus();
      console.log('TEE状态:', status);
      setTeeStatus(status);
    } catch (err) {
      console.error('TEE状态检查失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkTeeStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-slate-50 my-4">
        <h3 className="font-medium text-lg mb-2">TEE状态</h3>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 my-4">
        <h3 className="font-medium text-lg mb-2">TEE状态</h3>
        <div className="text-red-600">TEE状态检查失败: {error}</div>
        <button 
          onClick={checkTeeStatus}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          重试
        </button>
      </div>
    );
  }

  if (!teeStatus) {
    return (
      <div className="p-4 border rounded-lg bg-slate-50 my-4">
        <h3 className="font-medium text-lg mb-2">TEE状态</h3>
        <div>未获取到TEE状态信息</div>
        <button 
          onClick={checkTeeStatus}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          检查TEE状态
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-slate-50 my-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">TEE状态</h3>
        <button 
          onClick={checkTeeStatus}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          刷新
        </button>
      </div>
      
      <div className="border rounded-md p-3 bg-white">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="font-medium">可用:</span> {teeStatus.available ? '是 ✓' : '否 ✗'}</div>
          <div><span className="font-medium">已初始化:</span> {teeStatus.initialized ? '是 ✓' : '否 ✗'}</div>
          <div><span className="font-medium">类型:</span> {teeStatus.type_name}</div>
          <div><span className="font-medium">版本:</span> {teeStatus.version}</div>
          <div><span className="font-medium">钱包已创建:</span> {teeStatus.wallet_created ? '是 ✓' : '否 ✗'}</div>
        </div>
      </div>
    </div>
  );
};

// API连接测试组件
const ApiConnectionTest = () => {
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setApiStatus(null);
    
    try {
      const status = await testApiConnection();
      console.log('API连接状态:', status);
      setApiStatus(status);
    } catch (err) {
      console.error('API连接测试失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-slate-50 my-4">
        <h3 className="font-medium text-lg mb-2">API连接测试</h3>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg my-4 ${error ? 'bg-red-50' : apiStatus ? 'bg-green-50' : 'bg-slate-50'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">API连接测试</h3>
        <button 
          onClick={testConnection}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          测试连接
        </button>
      </div>
      
      {error ? (
        <div className="text-red-600">API连接测试失败: {error}</div>
      ) : apiStatus ? (
        <div className="text-green-700">{apiStatus}</div>
      ) : (
        <div>未获取到API连接状态</div>
      )}
    </div>
  );
};

// 添加一个新的系统信息组件
const SystemInfoDisplay = () => {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const info = await getSystemInfo();
      console.log('系统信息:', info);
      setSystemInfo(info);
    } catch (err) {
      console.error('获取系统信息失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初始加载时获取系统信息
    fetchSystemInfo();
  }, []);

  // 格式化内存/磁盘大小为易读格式
  const formatSize = (size: number, unit: string) => {
    if (size === 0) return 'Unknown';
    return `${size} ${unit}`;
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-slate-50 my-4">
        <h3 className="font-medium text-lg mb-2">系统信息</h3>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 my-4">
        <h3 className="font-medium text-lg mb-2">系统信息</h3>
        <div className="text-red-600">获取系统信息失败: {error}</div>
        <button 
          onClick={fetchSystemInfo}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          重试
        </button>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="p-4 border rounded-lg bg-slate-50 my-4">
        <h3 className="font-medium text-lg mb-2">系统信息</h3>
        <div>未获取到系统信息</div>
        <button 
          onClick={fetchSystemInfo}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          获取系统信息
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-slate-50 my-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">系统信息</h3>
        <button 
          onClick={fetchSystemInfo}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          刷新
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 基本信息 */}
        <div className="border rounded-md p-3 bg-white">
          <h4 className="font-medium text-md mb-2">基本信息</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">主机名:</span> {systemInfo.hostname}</div>
            <div><span className="font-medium">操作系统:</span> {systemInfo.os_info.name}</div>
            <div><span className="font-medium">版本:</span> {systemInfo.os_info.version}</div>
            <div><span className="font-medium">内核:</span> {systemInfo.os_info.kernel}</div>
            <div><span className="font-medium">架构:</span> {systemInfo.os_info.arch}</div>
          </div>
        </div>
        
        {/* CPU信息 */}
        <div className="border rounded-md p-3 bg-white">
          <h4 className="font-medium text-md mb-2">CPU</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">型号:</span> {systemInfo.cpu_info.model}</div>
            <div><span className="font-medium">物理核心:</span> {systemInfo.cpu_info.cores}</div>
            <div><span className="font-medium">逻辑核心:</span> {systemInfo.cpu_info.threads}</div>
            <div><span className="font-medium">主频:</span> {systemInfo.cpu_info.frequency.toFixed(2)} GHz</div>
            <div><span className="font-medium">架构:</span> {systemInfo.cpu_info.architecture}</div>
          </div>
        </div>
        
        {/* 内存信息 */}
        <div className="border rounded-md p-3 bg-white">
          <h4 className="font-medium text-md mb-2">内存</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">总内存:</span> {formatSize(systemInfo.memory_info.total, 'MB')}</div>
            <div><span className="font-medium">可用内存:</span> {formatSize(systemInfo.memory_info.available, 'MB')}</div>
            <div><span className="font-medium">使用率:</span> {systemInfo.memory_info.used_percent.toFixed(1)}%</div>
            
            {/* 内存使用率进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(systemInfo.memory_info.used_percent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* 磁盘信息 */}
        <div className="border rounded-md p-3 bg-white">
          <h4 className="font-medium text-md mb-2">磁盘</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">总容量:</span> {formatSize(systemInfo.disk_info.total, 'GB')}</div>
            <div><span className="font-medium">可用空间:</span> {formatSize(systemInfo.disk_info.available, 'GB')}</div>
            <div><span className="font-medium">使用率:</span> {systemInfo.disk_info.used_percent.toFixed(1)}%</div>
            
            {/* 磁盘使用率进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(systemInfo.disk_info.used_percent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* 网络信息 */}
        <div className="border rounded-md p-3 bg-white md:col-span-2">
          <h4 className="font-medium text-md mb-2">网络</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">网络接口:</span> {systemInfo.network_info.interface}</div>
            <div><span className="font-medium">IP地址:</span> {systemInfo.network_info.ip_address}</div>
            <div><span className="font-medium">MAC地址:</span> {systemInfo.network_info.mac_address}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TauriDebugPage() {
  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Tauri Debug - COS72</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-6">Tauri调试与测试面板</h1>
      
      <TauriEnvironmentCheck />
      
      <HardwareDetection />
      
      {/* 添加系统信息组件 */}
      <SystemInfoDisplay />
      
      <TeeStatusCheck />
      
      <ApiConnectionTest />
    </div>
  );
} 