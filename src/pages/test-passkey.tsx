import { useState, useEffect } from 'react';
import Head from 'next/head';
import { isTauriEnvironment, invoke } from '../lib/tauri-api';
import { 
  checkPasskeySupport, 
  verifyWithChallenge, 
  verifyPasskey,
  PasskeyStatus
} from '../lib/passkey-manager-simple';
import Link from 'next/link';

export default function TestPasskey() {
  const [challenge, setChallenge] = useState('SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IGNoYWxsZW5nZQ=='); // 默认Base64测试挑战
  const [userId, setUserId] = useState(''); // 用于存储用户ID
  const [status, setStatus] = useState('就绪');
  const [signatureResult, setSignatureResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<string>('检测中...');
  const [isTesting, setIsTesting] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [tauriAPIInfo, setTauriAPIInfo] = useState<string>('未检测');
  const [isTauriApp, setIsTauriApp] = useState(false);
  const [support, setSupport] = useState<PasskeyStatus | null>(null);
  const [skipEnvCheck, setSkipEnvCheck] = useState(false);

  // 添加调试日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // 检测环境
  useEffect(() => {
    const checkEnvironment = async () => {
      const isTauri = await isTauriEnvironment();
      setIsTauriApp(isTauri);
      const env = isTauri ? 'Tauri 应用' : '网页浏览器';
      console.log(`检测到环境: ${env}`);
      addLog(`环境检测: ${env}`);
      
      // 检查window.__TAURI__对象
      console.log('window.__TAURI__存在:', window.__TAURI__ !== undefined);
      addLog(`window.__TAURI__存在: ${window.__TAURI__ !== undefined}`);
      
      // 检查window.__TAURI_IPC__对象
      console.log('window.__TAURI_IPC__类型:', typeof window.__TAURI_IPC__);
      addLog(`window.__TAURI_IPC__类型: ${typeof window.__TAURI_IPC__}`);
      
      // 检查window.__IS_TAURI_APP__
      console.log('window.__IS_TAURI_APP__:', window.__IS_TAURI_APP__);
      addLog(`window.__IS_TAURI_APP__: ${window.__IS_TAURI_APP__}`);
      
      // 检查UserAgent
      const userAgent = navigator.userAgent;
      console.log('UserAgent:', userAgent);
      addLog(`UserAgent: ${userAgent}`);
      
      // 收集Tauri API信息
      const tauri_exists = window.__TAURI__ !== undefined ? '存在' : '不存在';
      const tauri_ipc_type = typeof window.__TAURI_IPC__ === 'undefined' ? '未定义' : typeof window.__TAURI_IPC__;
      
      const apiInfo = [
        `环境: ${env}`,
        `window.__TAURI__: ${tauri_exists}`,
        `window.__TAURI_IPC__: ${tauri_ipc_type}`,
        `window.__IS_TAURI_APP__: ${window.__IS_TAURI_APP__ ? 'true' : 'false'}`,
        `UserAgent中Tauri: ${userAgent.includes('Tauri') || userAgent.includes('wry')}`
      ].join('\n');
      
      setEnvironment(env);
      setTauriAPIInfo(apiInfo);
    };
    
    checkEnvironment();
  }, []);

  // 检查WebAuthn支持
  useEffect(() => {
    checkPasskeySupport().then(result => {
      setSupport(result);
      addLog(`WebAuthn支持: ${result.isSupported}`);
      addLog(`生物识别支持: ${result.isBiometricSupported}`);
      addLog(`平台验证器: ${result.isPlatformAuthenticator}`);
    }).catch(error => {
      console.error('WebAuthn检测错误:', error);
      addLog(`WebAuthn检测错误: ${error}`);
    });
  }, []);

  // 处理签名请求
  const handleVerifyPasskey = async () => {
    try {
      setIsTesting(true);
      setStatus('处理中...');
      setSignatureResult(null);
      setErrorMessage(null);
      addLog(`开始签名请求，挑战: ${challenge.substring(0, 20)}...`);
      
      // 检查是否在Tauri环境中
      const isTauri = await isTauriEnvironment();
      
      if (isTauri) {
        // Tauri环境 - 使用原生签名
        addLog('在Tauri环境中，使用Rust实现的签名功能');
        
        // 执行签名 - 使用direct challenge API
        setStatus('请在弹出的生物识别提示中完成验证');
        const result = await verifyWithChallenge(challenge);
        
        if (result.verified) {
          addLog('签名验证成功');
          setStatus('签名验证成功');
          setSignatureResult(result);
        } else {
          throw new Error(result.error || '签名验证失败');
        }
      } else {
        // 浏览器环境 - 使用WebAuthn API
        addLog('在浏览器环境中，使用Web API的签名功能');
        
        // 请用户输入User ID - 这里简化处理，实际应用中应有用户选择界面
        const tempUserId = prompt('请输入您的用户ID (已注册的Passkey ID):', '');
        if (!tempUserId) {
          throw new Error('需要用户ID才能继续');
        }
        
        setUserId(tempUserId);
        addLog(`使用用户ID: ${tempUserId}`);
        
        // 使用verifyPasskey而不是verifyWithChallenge
        setStatus('请在弹出的生物识别提示中完成验证');
        const result = await verifyPasskey(tempUserId);
        
        if (result.verified) {
          addLog('签名验证成功');
          setStatus('签名验证成功');
          setSignatureResult(result);
        } else {
          throw new Error(result.error || '签名验证失败');
        }
      }
    } catch (err: any) {
      console.error('签名验证错误:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
      setStatus('签名验证失败');
      addLog(`错误: ${errorMsg}`);
    } finally {
      setIsTesting(false);
    }
  };

  // 生成新的随机挑战
  const generateNewChallenge = () => {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    
    // 转换为Base64
    let binaryString = '';
    randomBytes.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    
    const base64Challenge = btoa(binaryString);
    setChallenge(base64Challenge);
    addLog(`生成新的随机挑战: ${base64Challenge.substring(0, 10)}...`);
  };

  // 创建并注册新的Passkey
  const handleRegisterNew = () => {
    // 跳转到注册页面
    window.location.href = '/register-passkey';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>FIDO2 Passkey 测试 - COS72</title>
        <meta name="description" content="测试FIDO2 Passkey签名功能" />
      </Head>

      {/* 顶部导航菜单 */}
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-bold text-xl">COS72 - 社区操作系统</span>
          <div className="space-x-4">
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              首页
            </Link>
            <Link href="/register-passkey" className="text-blue-500 hover:text-blue-700">
              注册Passkey
            </Link>
            <Link href="/test-passkey" className="text-blue-700 font-semibold">
              测试签名
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">FIDO2 Passkey 签名测试</h1>
        
        {/* 环境信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">环境信息</h2>
          <p className="text-sm text-gray-600 mb-4">当前运行环境: <span className="font-medium">{environment}</span></p>
          
          {support && (
            <div className="mb-4">
              <p className="text-sm">
                WebAuthn支持: 
                <span className={support.isSupported ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                  {support.isSupported ? '是' : '否'}
                </span>
              </p>
              <p className="text-sm">
                生物识别支持: 
                <span className={support.isBiometricSupported ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                  {support.isBiometricSupported ? '是' : '否'}
                </span>
              </p>
              <p className="text-sm">
                平台验证器: 
                <span className={support.isPlatformAuthenticator ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                  {support.isPlatformAuthenticator ? '是' : '否'}
                </span>
              </p>
            </div>
          )}
          
          {environment !== 'Tauri 应用' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
              <p className="text-yellow-700">
                ⚠️ 请注意: FIDO2 Passkey 签名功能需要在 Tauri 应用环境中运行。
                在浏览器环境下将使用模拟数据。
              </p>
            </div>
          )}
          
          {/* 调试开关 */}
          <div className="flex justify-end">
            <button 
              onClick={() => setShowDebug(!showDebug)} 
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              {showDebug ? '隐藏调试信息' : '显示调试信息'}
            </button>
          </div>
        </div>
        
        {/* 签名测试区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">签名测试</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">挑战字符串 (Base64)</label>
            <div className="flex">
              <input
                type="text"
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l"
              />
              <button
                onClick={generateNewChallenge}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-r"
                title="生成新的随机挑战"
              >
                🔄
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Base64编码的挑战字符串</p>
          </div>
          
          {userId && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">用户ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="用户ID"
              />
              <p className="text-xs text-gray-500 mt-1">用于签名验证的用户ID（可选）</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleVerifyPasskey}
              disabled={!!(isTesting || !support?.isSupported)}
              className={`${
                isTesting 
                  ? 'bg-blue-300 cursor-not-allowed'
                  : !support?.isSupported
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
              } text-white py-2 px-4 rounded flex-1`}
            >
              {isTesting ? '签名中...' : '测试签名'}
            </button>
            
            <button
              onClick={handleRegisterNew}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            >
              注册新Passkey
            </button>
            
            <label className="flex items-center mt-2 text-sm">
              <input
                type="checkbox"
                checked={skipEnvCheck}
                onChange={e => setSkipEnvCheck(e.target.checked)}
                className="mr-2"
              />
              跳过环境检查（在浏览器中强制使用WebAuthn API）
            </label>
          </div>
          
          <div className="mt-4">
            <div className={`p-3 rounded ${
              isTesting 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className="font-semibold">{isTesting ? '处理中...' : '状态:'}</p>
              <p className="text-sm mt-1">{status}</p>
              {isTesting && (
                <div className="mt-2">
                  <div className="animate-pulse text-center text-sm text-blue-600">
                    {environment === 'Tauri 应用' ? '请注意系统生物识别提示' : '模拟中...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 结果显示区域 */}
        {(signatureResult || errorMessage) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            
            {errorMessage ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="font-semibold text-red-700">错误:</p>
                <pre className="mt-2 text-sm whitespace-pre-wrap text-red-800">{errorMessage}</pre>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="font-semibold text-green-700">成功:</p>
                <p className="mt-2 text-sm">验证状态: {signatureResult.verified ? '通过' : '失败'}</p>
                {userId && <p className="mt-1 text-sm">用户ID: {userId}</p>}
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">查看签名详情</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-64 bg-gray-100 p-2 rounded">
                    {JSON.stringify(signatureResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
        
        {/* 调试日志 */}
        {showDebug && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">调试日志</h2>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-auto max-h-64">
              {debugLogs.length > 0 ? (
                debugLogs.map((log, index) => (
                  <div key={index} className="py-1 border-b border-gray-800">{log}</div>
                ))
              ) : (
                <p className="italic text-gray-500">暂无日志</p>
              )}
            </div>
          </div>
        )}
        
        {/* 硬件信息和TEE状态 - 单行两列 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">系统信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 硬件信息列 */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-semibold mb-2">硬件信息</h3>
              <div className="text-sm space-y-1">
                <p>CPU: Intel Core i7 (x86_64)</p>
                <p>系统: macOS 12.5.1</p>
                <p>内存: 16GB</p>
                <p>支持生物识别: 是</p>
              </div>
            </div>
            
            {/* TEE状态列 */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-semibold mb-2">TEE状态</h3>
              <div className="text-sm space-y-1">
                <p>可用性: <span className="text-yellow-600">不可用</span></p>
                <p>类型: 无</p>
                <p>已初始化: 否</p>
                <p>版本: N/A</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 帮助说明 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">关于 FIDO2 Passkey</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p>FIDO2 Passkey 是一种安全的认证技术，利用设备的生物识别能力（指纹、面部识别）或安全硬件进行身份验证。</p>
            <p>在这个测试中，我们使用设备的安全功能对挑战字符串进行签名，以证明用户的身份。</p>
            <p>根据不同平台，将使用不同的实现:</p>
            <ul className="list-disc ml-5">
              <li>Windows: Windows Hello</li>
              <li>macOS: Touch ID / Secure Enclave</li>
              <li>Linux: 外部FIDO2设备</li>
              <li>Android/iOS: 生物识别API</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Tauri API信息区域移到底部 */}
      <footer className="bg-gray-800 text-gray-300 py-6">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Tauri API检测:</h3>
            <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-900 p-3 rounded">
              {tauriAPIInfo}
            </pre>
          </div>
          
          <div className="text-center text-gray-400 mt-6 text-sm">
            <p>COS72 - 社区操作系统 v0.2.12</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 