import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  checkWebAuthnSupport, 
  startRegistration, 
  finishRegistration,
  startAuthentication,
  finishAuthentication,
  getUserCredentials,
  WebAuthnSupport
} from '../lib/webauthn-api';

// 在验证认证挑战时使用的类型转换
// TypeScript不能确保我们的挑战对象符合PublicKeyCredentialRequestOptions
// 但我们知道它是合适的格式
type AnyPublicKeyCredentialRequestOptions = any;

// 模拟Passkey注册服务器
export default function PasskeyServer() {
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('检测中...');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('就绪');
  const [support, setSupport] = useState<WebAuthnSupport | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'register' | 'authenticate'>('register');

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // 检测环境和WebAuthn支持
  useEffect(() => {
    const detectEnvironment = async () => {
      // 检测是否在Tauri环境中
      const isTauri = 'window' in globalThis && 
        '__TAURI__' in window && 
        !!window.__TAURI__;
      
      const env = isTauri ? 'Tauri 应用' : '网页浏览器';
      console.log(`检测到环境: ${env}`);
      setEnvironment(env);
      addLog(`环境检测: ${env}`);

      // 检查WebAuthn支持
      try {
        const result = await checkWebAuthnSupport();
        setSupport(result);
        addLog(`WebAuthn支持: ${result.webauthnSupported}`);
        addLog(`生物识别支持: ${result.biometricsSupported}`);
      } catch (error) {
        console.error('WebAuthn检测错误:', error);
        addLog(`WebAuthn检测错误: ${error}`);
      }
    };

    detectEnvironment();

    // 每次页面加载时加载已注册用户
    const loadRegisteredUsers = () => {
      try {
        const storedUsers = localStorage.getItem('registeredUsers');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          setRegisteredUsers(users);
          addLog(`已加载 ${users.length} 个注册用户`);
        }
      } catch (err) {
        console.error('加载用户失败:', err);
        addLog(`加载用户失败: ${err}`);
      }
    };

    loadRegisteredUsers();
  }, []);

  // 保存用户到本地存储
  const saveUser = (userData: any) => {
    try {
      const storedUsers = localStorage.getItem('registeredUsers') || '[]';
      const users = JSON.parse(storedUsers);
      
      // 检查用户是否已存在
      const existingUserIndex = users.findIndex((u: any) => u.userId === userData.userId);
      
      if (existingUserIndex >= 0) {
        // 更新现有用户
        users[existingUserIndex] = userData;
      } else {
        // 添加新用户
        users.push(userData);
      }
      
      localStorage.setItem('registeredUsers', JSON.stringify(users));
      setRegisteredUsers(users);
      addLog(`已保存用户: ${userData.username}`);
    } catch (err) {
      console.error('保存用户失败:', err);
      addLog(`保存用户失败: ${err}`);
    }
  };

  // 注册新Passkey
  const handleRegistration = async () => {
    try {
      setIsProcessing(true);
      setStatus('正在开始注册流程...');
      setError(null);
      setResult(null);

      if (!username || username.trim() === '') {
        setError('用户名不能为空');
        setStatus('注册失败');
        return;
      }

      addLog(`开始注册流程，用户名: ${username}`);

      // 调用注册API
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

        // 保存用户信息到本地存储
        saveUser({
          userId: challenge.user_id,
          username: username,
          registeredAt: new Date().toISOString(),
          credential: registrationResult.credential
        });

        setResult(registrationResult);
        setStatus('注册成功');
      } else {
        throw new Error('凭证创建失败');
      }
    } catch (err: any) {
      console.error('注册错误:', err);
      let errorMessage = err instanceof Error ? err.message : String(err);
      
      addLog(`注册失败: ${errorMessage}`);
      setError(errorMessage);
      setStatus('注册失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 验证Passkey
  const handleAuthentication = async (userId: string) => {
    try {
      setIsProcessing(true);
      setStatus('正在开始验证流程...');
      setError(null);
      setResult(null);

      addLog(`开始验证流程，用户ID: ${userId}`);

      // 调用验证API
      const challenge = await startAuthentication(userId);
      addLog(`验证挑战已创建，等待用户验证...`);
      setStatus('请在弹出的生物识别提示中完成验证');

      // 转换为浏览器可理解的格式
      console.log('验证选项:', challenge);

      // 请求验证凭证
      console.log('调用navigator.credentials.get');
      const credential = await navigator.credentials.get({
        publicKey: challenge as unknown as PublicKeyCredentialRequestOptions
      });
      console.log('验证结果:', credential);

      // 完成验证
      if (credential) {
        const credentialJson = JSON.stringify(credential);
        console.log('凭证JSON:', credentialJson);
        addLog('验证成功，正在完成验证流程...');

        const authResult = await finishAuthentication(
          userId,
          credentialJson
        );

        console.log('验证结果:', authResult);
        addLog(`验证完成: ${JSON.stringify(authResult.status)}`);

        setResult(authResult);
        setStatus('验证成功');
      } else {
        throw new Error('验证失败');
      }
    } catch (err: any) {
      console.error('验证错误:', err);
      let errorMessage = err instanceof Error ? err.message : String(err);
      
      addLog(`验证失败: ${errorMessage}`);
      setError(errorMessage);
      setStatus('验证失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Passkey 模拟服务器 - COS72</title>
        <meta name="description" content="模拟FIDO2 Passkey服务器和客户端" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Passkey 模拟服务器</h1>
        
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
        
        {/* 选项卡 */}
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 border-b-2 ${activeTab === 'register' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
            onClick={() => setActiveTab('register')}
          >
            注册 Passkey
          </button>
          <button
            className={`py-2 px-4 border-b-2 ${activeTab === 'authenticate' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
            onClick={() => setActiveTab('authenticate')}
          >
            验证 Passkey
          </button>
        </div>
        
        {/* 注册面板 */}
        {activeTab === 'register' && (
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
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">此用户名将与您的Passkey关联</p>
            </div>
            
            <button
              onClick={handleRegistration}
              disabled={isProcessing || !support?.webauthnSupported}
              className={`
                ${isProcessing 
                  ? 'bg-blue-300 cursor-not-allowed'
                  : !support?.webauthnSupported
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white py-2 px-4 rounded w-full
              `}
            >
              {isProcessing ? '注册中...' : '注册 Passkey'}
            </button>
          </div>
        )}
        
        {/* 验证面板 */}
        {activeTab === 'authenticate' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">验证现有 Passkey</h2>
            
            {registeredUsers.length > 0 ? (
              <div>
                <h3 className="text-md font-medium mb-3">已注册用户:</h3>
                <div className="space-y-2">
                  {registeredUsers.map((user, index) => (
                    <div key={index} className="p-3 border rounded">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500">ID: {user.userId.substring(0, 8)}...</p>
                      <p className="text-xs text-gray-500">注册时间: {new Date(user.registeredAt).toLocaleString()}</p>
                      <button
                        onClick={() => handleAuthentication(user.userId)}
                        disabled={isProcessing}
                        className={`mt-2 py-1 px-3 text-sm rounded ${isProcessing ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                      >
                        验证此用户
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                没有已注册的用户。请先注册一个Passkey。
              </div>
            )}
          </div>
        )}
        
        {/* 状态面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">操作状态</h2>
          
          <div className={`p-3 rounded ${
            isProcessing 
              ? 'bg-blue-50 border border-blue-200' 
              : error 
                ? 'bg-red-50 border border-red-200'
                : result 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
          }`}>
            <p className="font-semibold">{isProcessing ? '处理中...' : '状态:'}</p>
            <p className="text-sm mt-1">{status}</p>
            {isProcessing && (
              <div className="mt-2">
                <div className="animate-pulse text-center text-sm text-blue-600">
                  请注意系统生物识别提示
                </div>
              </div>
            )}
          </div>
          
          {/* 错误显示 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="font-semibold text-red-700">错误:</p>
              <pre className="mt-2 text-sm whitespace-pre-wrap text-red-800">{error}</pre>
            </div>
          )}
          
          {/* 结果显示 */}
          {result && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="font-semibold text-green-700">成功:</p>
              {activeTab === 'register' ? (
                <>
                  <p className="mt-2 text-sm">用户ID: {userId}</p>
                  <p className="mt-1 text-sm">状态: {result.status}</p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm">用户验证成功</p>
                  <p className="mt-1 text-sm">计数器: {result.counter}</p>
                </>
              )}
              <details className="mt-2">
                <summary className="text-sm font-medium cursor-pointer">查看详情</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-64 bg-gray-100 p-2 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
        
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
          <h2 className="text-xl font-semibold mb-4">关于 FIDO2 Passkey</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p>FIDO2 Passkey 是一种基于公钥加密的认证方式:</p>
            <ul className="list-disc ml-5">
              <li>私钥安全存储在您的设备中，从不传输到服务器</li>
              <li>公钥会被发送到服务器并与您的账户关联</li>
              <li>认证过程需要进行生物识别(指纹、面部识别)确认</li>
              <li>在支持同步的设备上(如使用Google Password Manager)，Passkey可以在多设备间同步</li>
            </ul>
          </div>
        </div>
        
        {/* 导航链接 */}
        <div className="text-center mt-6">
          <Link href="/" className="text-blue-500 hover:text-blue-700 mr-4">
            返回主页
          </Link>
          <Link href="/test-passkey" className="text-blue-500 hover:text-blue-700 mr-4">
            测试签名
          </Link>
          <Link href="/register-passkey" className="text-blue-500 hover:text-blue-700">
            注册页面
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-600">
        <p>COS72 - 社区操作系统 v0.2.8</p>
      </footer>
    </div>
  );
} 