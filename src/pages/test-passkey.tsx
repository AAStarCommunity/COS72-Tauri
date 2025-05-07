import { useState, useEffect } from 'react';
import Head from 'next/head';
import { verifyPasskey, isTauriEnvironment, invoke } from '../lib/tauri-api';
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
  const [tauriAPIInfo, setTauriAPIInfo] = useState<string>('未检测');
  const [isTauriApp, setIsTauriApp] = useState(false);

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
      
      // 检查meta标签
      const tauriMeta = document.querySelector('meta[name="tauri-dev"]');
      console.log('tauri-dev meta标签:', tauriMeta !== null);
      addLog(`tauri-dev meta标签: ${tauriMeta !== null}`);
      
      // 检查UserAgent
      const userAgent = navigator.userAgent;
      console.log('UserAgent:', userAgent);
      addLog(`UserAgent: ${userAgent}`);
      
      // 收集Tauri API信息
      const apiInfo = [
        `环境: ${env}`,
        `window.__TAURI__: ${window.__TAURI__ !== undefined ? '存在' : '不存在'}`,
        `window.__TAURI_IPC__: ${typeof window.__TAURI_IPC__}`,
        `window.__IS_TAURI_APP__: ${window.__IS_TAURI_APP__ ? 'true' : 'false'}`,
        `tauri-dev meta标签: ${tauriMeta !== null ? '存在' : '不存在'}`,
        `UserAgent中Tauri: ${userAgent.includes('Tauri') || userAgent.includes('wry')}`
      ].join('\n');
      
      setTauriAPIInfo(apiInfo);
      
      // 尝试一个简单的API调用
      try {
        addLog('尝试调用简单API: webauthn_supported...');
        const supported = await invoke('webauthn_supported');
        addLog(`WebAuthn支持: ${supported}`);
      } catch (error) {
        addLog(`API调用失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    checkEnvironment();
  }, []);

  // 执行签名测试
  const runPasskeyTest = async () => {
    try {
      setIsTesting(true);
      setStatus('正在初始化签名过程...');
      setError(null);
      setResult(null);
      
      // 显示基础alert
      alert("开始签名测试，请按照生物识别提示完成验证");
      
      // 记录开始时间
      const startTime = new Date().getTime();
      addLog(`开始签名流程，时间: ${new Date().toLocaleTimeString()}`);
      addLog(`挑战长度: ${challenge.length}字符`);
      console.log('使用挑战:', challenge);
      
      // 显示提示信息
      setStatus('请在弹出的生物识别提示中完成验证 (Touch ID/指纹/面部识别)');
      addLog('等待系统生物识别提示...');
      
      // 确保环境检测
      const isTauri = await isTauriEnvironment();
      addLog(`环境检测: ${isTauri ? 'Tauri应用' : '网页浏览器'}`);
      console.log(`环境检测: ${isTauri ? 'Tauri应用' : '网页浏览器'}`);
      
      if (!isTauri) {
        addLog('警告: 非Tauri环境，将使用模拟数据');
        alert("警告：当前不是Tauri应用环境，将使用模拟数据");
      }
      
      try {
        // 调用前记录日志
        console.log('调用前记录 - 当前时间', new Date().toLocaleTimeString());
        addLog('正在调用verifyPasskey函数...');
        alert("正在调用Tauri API进行验证");
        
        // 获取挑战
        addLog(`发送的挑战: ${challenge.substring(0, 20)}...`);
        const challengeResponse: any = await verifyPasskey(challenge);
        console.log('获取挑战响应:', challengeResponse);
        addLog('成功获取挑战响应');
        alert(`成功获取挑战响应: ${typeof challengeResponse === 'string' ? challengeResponse.substring(0, 30) + '...' : JSON.stringify(challengeResponse).substring(0, 30) + '...'}`);
        
        // 使用新增加的WebAuthn处理函数处理响应
        let webAuthnResponse;
        try {
          addLog('开始处理WebAuthn响应...');
          webAuthnResponse = await processWebAuthnResponse(challengeResponse);
          addLog('WebAuthn响应处理成功');
          alert("WebAuthn响应处理成功");
        } catch (error) {
          console.error('WebAuthn响应处理失败:', error);
          addLog(`WebAuthn处理出错: ${error instanceof Error ? error.message : String(error)}`);
          alert(`WebAuthn处理出错: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
        
        // 使用签名验证结果
        const verificationResult = webAuthnResponse; // 在实际应用中这里应该将响应发送到服务器进行验证
        
        // 计算处理时间
        const endTime = new Date().getTime();
        const processingTime = endTime - startTime;
        
        // 显示成功结果
        setStatus('签名验证成功!');
        addLog(`签名验证完成，耗时: ${processingTime}ms`);
        setResult(verificationResult);
        
        console.log('最终验证结果:', verificationResult);
        alert(`签名验证成功! 耗时: ${processingTime}ms`);
        
      } catch (error) {
        console.error('验证过程中出错:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(`验证失败: ${errorMessage}`);
        setStatus('验证失败');
        addLog(`出错: ${errorMessage}`);
        alert(`验证失败: ${errorMessage}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  // 辅助函数，修正Base64URL引用错误
  const simulateCredential = () => {
    try {
      const publicKeyOptions = {
        challenge: base64UrlToArrayBuffer("dGVzdGNoYWxsZW5nZQ=="),
        rpId: "localhost",
        allowCredentials: [{
          type: "public-key",
          id: base64UrlToArrayBuffer("Y3JlZGVudGlhbGlk")
        }],
        userVerification: "preferred"
      };
      
      return {
        id: "test-credential-id",
        type: "public-key",
        response: {
          authenticatorData: "test-auth-data",
          signature: "test-signature",
          clientDataJSON: "test-client-data"
        }
      };
    } catch (error) {
      console.error('模拟凭证创建失败:', error);
      throw error;
    }
  }

  // 在Base64URL和其他编码格式之间转换的工具函数
  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function base64UrlToBase64(base64Url: string): string {
    // 将URL安全的Base64转换为标准Base64
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // 添加必要的填充
    while (base64.length % 4) {
      base64 += '=';
    }
    return base64;
  }

  function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
    const base64 = base64UrlToBase64(base64Url);
    return base64ToArrayBuffer(base64);
  }

  // 用于处理WebAuthn响应的函数
  async function processWebAuthnResponse(challengeJson: string): Promise<any> {
    try {
      // 解析JSON字符串为JavaScript对象
      const challenge = JSON.parse(challengeJson);
      console.log('WebAuthn挑战对象:', challenge);
      
      // 准备请求选项
      const publicKey: any = {
        challenge: base64UrlToArrayBuffer(challenge.challenge),
        timeout: challenge.timeout,
        rpId: challenge.rpId
      };
      
      // 如果有允许的凭证，进行转换
      if (challenge.allowCredentials) {
        publicKey.allowCredentials = challenge.allowCredentials.map((credential: any) => ({
          ...credential,
          id: base64UrlToArrayBuffer(credential.id)
        }));
      }
      
      // 设置userVerification
      if (challenge.userVerification) {
        publicKey.userVerification = challenge.userVerification;
      }
      
      // 创建请求选项
      const options = {
        publicKey: publicKey
      };
      
      console.log('发起WebAuthn请求，选项:', options);
      
      // 请求凭证
      const credential = await navigator.credentials.get(options);
      
      // 检查凭证是否为空
      if (!credential) {
        throw new Error('没有收到凭证响应');
      }
      
      console.log('收到WebAuthn响应:', credential);
      
      // 格式化响应以发送到服务器
      const response = {
        id: credential.id,
        type: credential.type,
        rawId: arrayBufferToBase64((credential as any).rawId),
        response: {
          authenticatorData: arrayBufferToBase64((credential as any).response.authenticatorData),
          clientDataJSON: arrayBufferToBase64((credential as any).response.clientDataJSON),
          signature: arrayBufferToBase64((credential as any).response.signature)
        }
      };
      
      console.log('格式化的响应:', response);
      return response;
    } catch (error) {
      console.error('处理WebAuthn响应时出错:', error);
      throw error;
    }
  }

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

  // 添加简单测试函数
  const testButtonClick = () => {
    console.log('测试按钮被点击!');
    addLog('测试按钮被点击!');
    setStatus('按钮点击测试成功');
  };

  // 添加直接使用invoke的测试
  const testDirectInvoke = async () => {
    try {
      console.log('尝试直接调用invoke...');
      addLog('尝试直接调用invoke...');
      
      // 使用最简单的命令: detect_hardware
      const result = await invoke('detect_hardware');
      console.log('直接调用成功:', result);
      addLog(`直接调用成功: ${JSON.stringify(result).substring(0, 100)}...`);
      setStatus('直接invoke调用成功');
    } catch (err) {
      console.error('直接调用错误:', err);
      addLog(`直接调用错误: ${err instanceof Error ? err.message : String(err)}`);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('直接invoke调用失败');
    }
  };

  // 使用简化版verifyPasskey进行测试
  const testSimplePasskey = async () => {
    try {
      console.log('尝试使用简化verifyPasskey...');
      addLog('尝试使用简化verifyPasskey...');
      setStatus('正在使用简化API测试签名...');
      
      const signResult = await verifyPasskey(challenge);
      console.log('简化签名结果:', signResult);
      addLog(`简化签名完成: ${JSON.stringify(signResult).substring(0, 100)}...`);
      
      setResult(signResult);
      setStatus('简化签名API调用成功');
    } catch (err) {
      console.error('简化签名错误:', err);
      addLog(`简化签名失败: ${err instanceof Error ? err.message : String(err)}`);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('简化签名API调用失败');
    }
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
          
          {/* 添加Tauri API信息展示 */}
          <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
            <p className="font-semibold mb-2">Tauri API检测:</p>
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {tauriAPIInfo}
            </pre>
          </div>
          
          <div className="flex justify-end mt-4">
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
          
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={runPasskeyTest}
              disabled={isTesting}
              className={`${
                isTesting 
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white py-2 px-4 rounded flex-1`}
              data-testid="test-passkey-button"
            >
              {isTesting ? '签名中...' : '测试签名'}
            </button>
            
            <button
              onClick={testButtonClick}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            >
              测试按钮
            </button>

            <button
              onClick={testDirectInvoke}
              className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded"
            >
              测试直接调用
            </button>
            
            <button
              onClick={testSimplePasskey}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
            >
              测试简化签名
            </button>
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
        
        {/* 测试直接调用WebAuthn的按钮 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">WebAuthn API 直接测试</h2>
          
          <div className="flex gap-2">
            <button
              onClick={async () => {
                addLog("测试WebAuthn支持状态...");
                try {
                  const supported = await invoke('webauthn_supported');
                  addLog(`WebAuthn支持: ${supported}`);
                  alert(`WebAuthn支持: ${supported}`);
                } catch (e) {
                  addLog(`错误: ${e instanceof Error ? e.message : String(e)}`);
                  alert(`错误: ${e instanceof Error ? e.message : String(e)}`);
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              测试WebAuthn支持
            </button>
            
            <button
              onClick={async () => {
                addLog("测试生物识别支持状态...");
                try {
                  const supported = await invoke('webauthn_biometric_supported');
                  addLog(`生物识别支持: ${supported}`);
                  alert(`生物识别支持: ${supported}`);
                } catch (e) {
                  addLog(`错误: ${e instanceof Error ? e.message : String(e)}`);
                  alert(`错误: ${e instanceof Error ? e.message : String(e)}`);
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            >
              测试生物识别支持
            </button>
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
                
                {/* 显示错误详情 */}
                {(error as any)?.details && (
                  <div className="mt-3 p-3 bg-red-100 rounded text-xs">
                    <p className="font-semibold">详细信息:</p>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                      {(error as any).details}
                    </pre>
                  </div>
                )}
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
        <p>COS72 - 社区操作系统 v0.2.8</p>
      </footer>
    </div>
  );
} 