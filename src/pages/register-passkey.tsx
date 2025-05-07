import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { isTauriEnvironment } from '../lib/tauri-api';
import { 
  checkPasskeySupport, 
  registerPasskey, 
  PasskeyStatus 
} from '../lib/passkey-manager-simple';

// Create registration page
export default function RegisterPasskey() {
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('Detecting...');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('Ready');
  const [support, setSupport] = useState<PasskeyStatus | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [tauriAPIInfo, setTauriAPIInfo] = useState<string>('Not detected');

  // Add log
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Detect environment
  useEffect(() => {
    const checkEnvironment = async () => {
      const isTauri = await isTauriEnvironment();
      const env = isTauri ? 'Tauri App' : 'Web Browser';
      console.log(`Detected environment: ${env}`);
      setEnvironment(env);
      addLog(`Environment detection: ${env}`);
      
      // Check window.__TAURI__ object
      console.log('window.__TAURI__ exists:', window.__TAURI__ !== undefined);
      addLog(`window.__TAURI__ exists: ${window.__TAURI__ !== undefined}`);
      
      // Check window.__TAURI_IPC__ object
      console.log('window.__TAURI_IPC__ type:', typeof window.__TAURI_IPC__);
      addLog(`window.__TAURI_IPC__ type: ${typeof window.__TAURI_IPC__}`);
      
      // Check window.__IS_TAURI_APP__
      console.log('window.__IS_TAURI_APP__:', window.__IS_TAURI_APP__);
      addLog(`window.__IS_TAURI_APP__: ${window.__IS_TAURI_APP__}`);
      
      // Check UserAgent
      const userAgent = navigator.userAgent;
      console.log('UserAgent:', userAgent);
      addLog(`UserAgent: ${userAgent}`);
      
      // Collect Tauri API information
      const tauri_exists = window.__TAURI__ !== undefined ? 'exists' : 'not found';
      const tauri_ipc_type = typeof window.__TAURI_IPC__ === 'undefined' ? 'undefined' : typeof window.__TAURI_IPC__;
      
      const apiInfo = [
        `Environment: ${env}`,
        `window.__TAURI__: ${tauri_exists}`,
        `window.__TAURI_IPC__: ${tauri_ipc_type}`,
        `window.__IS_TAURI_APP__: ${window.__IS_TAURI_APP__ ? 'true' : 'false'}`,
        `Tauri in UserAgent: ${userAgent.includes('Tauri') || userAgent.includes('wry')}`
      ].join('\n');
      
      setTauriAPIInfo(apiInfo);
    };
    
    checkEnvironment();
  }, []);

  // Check WebAuthn support
  useEffect(() => {
    checkPasskeySupport().then(result => {
      setSupport(result);
      addLog(`WebAuthn support: ${result.isSupported}`);
      addLog(`Biometric support: ${result.isBiometricSupported}`);
      addLog(`Platform authenticator: ${result.isPlatformAuthenticator}`);
    }).catch(error => {
      console.error('WebAuthn detection error:', error);
      addLog(`WebAuthn detection error: ${error}`);
    });
  }, []);

  // Start registration process
  const handleStartRegistration = async () => {
    try {
      setIsRegistering(true);
      setStatus('Starting registration process...');
      setError(null);
      setResult(null);

      if (!username || username.trim() === '') {
        setError('Username cannot be empty');
        setStatus('Registration failed');
        setIsRegistering(false);
        return;
      }

      addLog(`Starting registration process, username: ${username}`);

      // Use the new passkey-manager for registration
      try {
        // Call registration API
        const registrationResult = await registerPasskey(username);
        
        if (registrationResult.status === 'success') {
          console.log('Registration result:', registrationResult);
          addLog(`Registration completed: ${JSON.stringify(registrationResult.status)}`);
          
          setResult(registrationResult);
          setStatus('Registration successful');
          
          // Save user ID if available
          if (registrationResult.credential && registrationResult.credential.userId) {
            setUserId(registrationResult.credential.userId);
          }
        } else {
          throw new Error(registrationResult.error || 'Registration failed');
        }
      } catch (apiError: any) {
        console.error('API error:', apiError);
        addLog(`API error: ${apiError.message || apiError}`);
        throw apiError;
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = err instanceof Error ? err.message : String(err);
      
      addLog(`Registration failed: ${errorMessage}`);
      setError(errorMessage);
      setStatus('Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Register Passkey - COS72</title>
        <meta name="description" content="Register FIDO2 Passkey functionality" />
      </Head>

      {/* Top navigation menu */}
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-bold text-xl">COS72 - Community OS</span>
          <div className="space-x-4">
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              Home
            </Link>
            <Link href="/register-passkey" className="text-blue-700 font-semibold">
              Register Passkey
            </Link>
            <Link href="/test-passkey" className="text-blue-500 hover:text-blue-700">
              Test Signature
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Register FIDO2 Passkey</h1>
        
        {/* Environment information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
          <p className="text-sm text-gray-600 mb-4">Current environment: <span className="font-medium">{environment}</span></p>
          
          {support && (
            <div className="mb-4">
              <p className="text-sm">
                WebAuthn support: 
                <span className={support.isSupported ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                  {support.isSupported ? 'Yes' : 'No'}
                </span>
              </p>
              <p className="text-sm">
                Biometric support: 
                <span className={support.isBiometricSupported ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                  {support.isBiometricSupported ? 'Yes' : 'No'}
                </span>
              </p>
              <p className="text-sm">
                Platform authenticator: 
                <span className={support.isPlatformAuthenticator ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                  {support.isPlatformAuthenticator ? 'Yes' : 'No'}
                </span>
              </p>
            </div>
          )}
          
          {environment !== 'Tauri App' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
              <p className="text-yellow-700">
                ⚠️ Note: FIDO2 Passkey functionality needs to run in the Tauri app environment.
                It may not function correctly in a browser environment.
              </p>
            </div>
          )}
          
          {/* Debug toggle */}
          <div className="flex justify-end">
            <button 
              onClick={() => setShowDebug(!showDebug)} 
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
          </div>
        </div>
        
        {/* Registration form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Register New Passkey</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Enter username"
              disabled={isRegistering}
            />
            <p className="text-xs text-gray-500 mt-1">This username will be associated with your Passkey</p>
          </div>
          
          <button
            onClick={handleStartRegistration}
            disabled={!!(isRegistering || (support && !support.isSupported))}
            className={`
              ${isRegistering 
                ? 'bg-blue-300 cursor-not-allowed'
                : (support && !support.isSupported)
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white py-2 px-4 rounded w-full
            `}
          >
            {isRegistering ? 'Registering...' : 'Register Passkey'}
          </button>
          
          <div className="mt-4">
            <div className={`p-3 rounded ${
                status === 'Registration successful' ? 'bg-green-50 text-green-800 border border-green-200' :
                status === 'Registration failed' ? 'bg-red-50 text-red-800 border border-red-200' :
                status !== 'Ready' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'hidden'
              }`}
            >
              <p className="font-medium">{status}</p>
              {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
              
              {result && result.credential && (
                <div className="mt-2">
                  <h3 className="text-sm font-semibold">Registration successful!</h3>
                  <p className="text-xs mt-1">Your Passkey has been registered. You can now use it for authentication.</p>
                  
                  {userId && (
                    <div className="text-xs mt-2">
                      <span className="font-medium">User ID: </span>
                      <span className="font-mono bg-gray-100 px-1">{userId}</span>
                      <p className="mt-1">Save this ID for testing your Passkey.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Debug information */}
        {showDebug && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Tauri API Status</h3>
              <pre className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
                {tauriAPIInfo}
              </pre>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Debug Logs</h3>
              <div className="bg-gray-50 p-3 rounded h-60 overflow-y-auto">
                {debugLogs.map((log, index) => (
                  <div key={index} className="text-xs font-mono mb-1">{log}</div>
                ))}
                {debugLogs.length === 0 && (
                  <p className="text-xs text-gray-500">No logs available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 