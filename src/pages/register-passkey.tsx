import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { isTauriEnvironment } from '../lib/tauri-api';
import { 
  checkWebAuthnSupport, 
  startRegistration, 
  finishRegistration,
  WebAuthnSupport
} from '../lib/webauthn-api';

// 创建注册页面
export default function RegisterPasskey() {
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('检测中...');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('就绪');
  const [support, setSupport] = useState<WebAuthnSupport | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // 检测环境
  useEffect(() => {
    const checkEnvironment = async () => {
      const isTauri = await isTauriEnvironment();
      const env = isTauri ? 'Tauri 应用' : '网页浏览器';
      console.log(`检测到环境: ${env}`);
      setEnvironment(env);
      addLog(`环境检测: ${env}`);
    };
    
    checkEnvironment();
  }, []);

  // 检查WebAuthn支持
  useEffect(() => {
    checkWebAuthnSupport().then(result => {
      setSupport(result);
      addLog(`WebAuthn支持: ${result.webauthnSupported}`);
      addLog(`生物识别支持: ${result.biometricsSupported}`);
    }).catch(error => {
      console.error('WebAuthn检测错误:', error);
      addLog(`WebAuthn检测错误: ${error}`);
    });
  }, []);

  // 开始注册流程
  const handleStartRegistration = async () => {
    try {
      setIsRegistering(true);
      setStatus('正在开始注册流程...');
      setError(null);
      setResult(null);

      if (!username || username.trim() === '') {
        setError('用户名不能为空');
        setStatus('注册失败');
        setIsRegistering(false);
        return;
      }

      addLog(`开始注册流程，用户名: ${username}`);

      // 调用注册API
      try {
        const challenge = await startRegistration(username);
        addLog(`注册挑战已创建，等待用户验证...`);
        addLog(`用户ID: ${challenge.user_id}`);
        setUserId(challenge.user_id);
        setStatus('请在弹出的生物识别提示中完成验证');

        // 转换为浏览器可理解的格式
        const publicKeyCredentialCreationOptions = challenge.challenge;
        console.log('注册选项:', publicKeyCredentialCreationOptions);

        // 请求创建凭证
        // 这里会触发平台的生物识别
        console.log('调用navigator.credentials.create');
        const credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions
        });
        console.log('凭证创建结果:', credential);

        // 完成注册
        if (credential) {
          const credentialJson = JSON.stringify(credential);
          console.log('凭证JSON:', credentialJson);
          addLog('凭证创建成功，正在完成注册...');

          const registrationResult = await finishRegistration(
            challenge.user_id,
            credentialJson
          );

          console.log('注册结果:', registrationResult);
          addLog(`注册完成: ${JSON.stringify(registrationResult.status)}`);

          setResult(registrationResult);
          setStatus('注册成功');
        } else {
          throw new Error('凭证创建失败');
        }
      } catch (apiError: any) {
        console.error('API错误:', apiError);
        addLog(`API错误: ${apiError.message || apiError}`);
        throw apiError;
      }
    } catch (err: any) {
      console.error('注册错误:', err);
      let errorMessage = err instanceof Error ? err.message : String(err);
      
      addLog(`注册失败: ${errorMessage}`);
      setError(errorMessage);
      setStatus('注册失败');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>注册 Passkey - COS72</title>
        <meta name="description" content="注册FIDO2 Passkey功能" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">注册 FIDO2 Passkey</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">环境信息</h2>
          <p className="text-sm text-gray-600 mb-4">当前运行环境: <span className="font-medium">{environment}</span></p>
          
          {support && (
            <div className="mb-4">
              <p className="text-sm">
                WebAuthn支持: 
                <span className={support.webauthnSupported ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                  {support.webauthnSupported ? '是' : '否'}
                </span>
              </p>
              <p className="text-sm">
                生物识别支持: 
                <span className={support.biometricsSupported ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                  {support.biometricsSupported ? '是' : '否'}
                </span>
              </p>
            </div>
          )}
          
          {environment !== 'Tauri 应用' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
              <p className="text-yellow-700">
                ⚠️ 请注意: FIDO2 Passkey 功能需要在 Tauri 应用环境中运行。
                在浏览器环境下可能无法完全正常工作。
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
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">注册新的 Passkey</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="输入用户名"
              disabled={isRegistering}
            />
            <p className="text-xs text-gray-500 mt-1">此用户名将与您的Passkey关联</p>
          </div>
          
          <button
            onClick={handleStartRegistration}
            disabled={isRegistering || !support?.webauthnSupported}
            className={`
              ${isRegistering 
                ? 'bg-blue-300 cursor-not-allowed'
                : !support?.webauthnSupported
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white py-2 px-4 rounded w-full
            `}
          >
            {isRegistering ? '注册中...' : '注册 Passkey'}
          </button>
          
          <div className="mt-4">
            <div className={`p-3 rounded ${
              isRegistering 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className="font-semibold">{isRegistering ? '处理中...' : '状态:'}</p>
              <p className="text-sm mt-1">{status}</p>
              {isRegistering && (
                <div className="mt-2">
                  <div className="animate-pulse text-center text-sm text-blue-600">
                    请注意系统生物识别提示
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 结果显示 */}
        {(result || error) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">注册结果</h2>
            
            {error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="font-semibold text-red-700">错误:</p>
                <pre className="mt-2 text-sm whitespace-pre-wrap text-red-800">{error}</pre>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="font-semibold text-green-700">成功:</p>
                <p className="mt-2 text-sm">用户ID: {userId}</p>
                <p className="mt-1 text-sm">状态: {result.status}</p>
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">查看凭证详情</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-64 bg-gray-100 p-2 rounded">
                    {JSON.stringify(result.credential, null, 2)}
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
        
        {/* 帮助信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">关于 FIDO2 Passkey 注册</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p>FIDO2 Passkey 注册流程会在您的设备上创建一对公私钥:</p>
            <ul className="list-disc ml-5">
              <li>私钥安全存储在您的设备中，从不传输到服务器</li>
              <li>公钥会被发送到服务器并与您的账户关联</li>
              <li>注册过程需要进行生物识别(指纹、面部识别)确认</li>
              <li>完成注册后，您可以使用此Passkey进行安全登录</li>
            </ul>
          </div>
        </div>
        
        {/* 导航链接 */}
        <div className="text-center mt-6">
          <Link href="/" className="text-blue-500 hover:text-blue-700 mr-4">
            返回主页
          </Link>
          <Link href="/test-passkey" className="text-blue-500 hover:text-blue-700">
            测试签名
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-600">
        <p>COS72 - 社区操作系统 v0.2.8</p>
      </footer>
    </div>
  );
} 