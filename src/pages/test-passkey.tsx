import { useState, useEffect } from 'react';
import Head from 'next/head';
import { verifyPasskey, isTauriEnvironment } from '../lib/tauri-api';
import Link from 'next/link';

export default function TestPasskey() {
  const [challenge, setChallenge] = useState('SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IGNoYWxsZW5nZQ=='); // 默认Base64测试挑战
  const [status, setStatus] = useState('就绪');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<string>('检测中...');
  const [isTesting, setIsTesting] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // 添加调试日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // 检测环境
  useEffect(() => {
    const env = isTauriEnvironment() ? 'Tauri 应用' : '网页浏览器';
    console.log(`检测到环境: ${env}`);
    setEnvironment(env);
    addLog(`环境检测: ${env}`);
  }, []);

  // 执行签名测试
  const runPasskeyTest = async () => {
    try {
      setIsTesting(true);
      setStatus('正在初始化签名过程...');
      setError(null);
      setResult(null);
      
      addLog(`开始签名流程，挑战长度: ${challenge.length}字符`);
      console.log('使用挑战:', challenge);
      
      // 显示提示信息
      setStatus('请在弹出的生物识别提示中完成验证 (Touch ID/指纹/面部识别)');
      addLog('等待系统生物识别提示...');
      
      // 调用签名API
      const signResult = await verifyPasskey(challenge);
      console.log('签名结果:', signResult);
      addLog(`签名完成: ${JSON.stringify(signResult).substring(0, 100)}...`);
      
      setResult(signResult);
      setStatus('签名成功');
    } catch (err) {
      console.error('签名错误:', err);
      addLog(`签名失败: ${err instanceof Error ? err.message : String(err)}`);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('签名失败');
    } finally {
      setIsTesting(false);
    }
  };

  // 生成新的随机挑战
  const generateNewChallenge = () => {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    
    // 转换为Base64 - 修复类型错误
    let binaryString = '';
    randomBytes.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    
    const base64Challenge = btoa(binaryString);
    setChallenge(base64Challenge);
    addLog(`生成新的随机挑战: ${base64Challenge.substring(0, 10)}...`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>FIDO2 Passkey 测试 - COS72</title>
        <meta name="description" content="测试FIDO2 Passkey签名功能" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">FIDO2 Passkey 签名测试</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">环境信息</h2>
          <p className="text-sm text-gray-600 mb-4">当前运行环境: <span className="font-medium">{environment}</span></p>
          
          {environment !== 'Tauri 应用' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
              <p className="text-yellow-700">
                ⚠️ 请注意: FIDO2 Passkey 签名功能需要在 Tauri 应用环境中运行。
                在浏览器环境下将使用模拟数据。
              </p>
            </div>
          )}
          
          <div className="flex justify-end">
            <button 
              onClick={() => setShowDebug(!showDebug)} 
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              {showDebug ? '隐藏调试信息' : '显示调试信息'}
            </button>
          </div>
        </div>
        
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
          
          <button
            onClick={runPasskeyTest}
            disabled={isTesting}
            className={`${
              isTesting 
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white py-2 px-4 rounded w-full`}
          >
            {isTesting ? '签名中...' : '测试签名'}
          </button>
          
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
        {(result || error) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            
            {error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="font-semibold text-red-700">错误:</p>
                <pre className="mt-2 text-sm whitespace-pre-wrap text-red-800">{error}</pre>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="font-semibold text-green-700">成功:</p>
                <pre className="mt-2 text-sm whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
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
        
        {/* 导航链接 */}
        <div className="text-center mt-6">
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            返回主页
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-600">
        <p>COS72 - 社区操作系统 v0.2.6</p>
      </footer>
    </div>
  );
} 