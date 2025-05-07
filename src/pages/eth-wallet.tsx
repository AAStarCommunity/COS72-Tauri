import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { invoke as invokeCommand, getTeeStatus, initializeTee, performTeeOperation, isTauriEnvironment } from '../lib/tauri-api';
import Layout from '../components/Layout';

// 钱包信息接口
interface WalletInfo {
  walletId?: string;
  address?: string;
  publicKey?: string;
  mnemonic?: string;
}

// TEE状态接口
interface TeeStatus {
  available: boolean;
  initialized: boolean;
  type_name: string;
  version: string;
  wallet_created: boolean;
}

export default function EthWallet() {
  // 状态定义
  const [environment, setEnvironment] = useState<string>('检测中...');
  const [teeStatus, setTeeStatus] = useState<TeeStatus | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txData, setTxData] = useState<string>('');
  const [signatureResult, setSignatureResult] = useState<string | null>(null);
  const [isTauriEnv, setIsTauriEnv] = useState<boolean>(false);

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // 检测环境
  useEffect(() => {
    const checkEnvironment = async () => {
      const isTauri = await isTauriEnvironment();
      setEnvironment(isTauri ? 'Tauri 应用' : '网页浏览器');
      addLog(`环境检测: ${isTauri ? 'Tauri 应用' : '网页浏览器'}`);
      
      // 如果在Tauri环境中，获取TEE状态
      const inTauriEnvironment = await isTauriEnvironment();
      setIsTauriEnv(inTauriEnvironment);
      
      // 获取TEE状态
      if (isTauri) {
        try {
          const status = await getTeeStatus();
          // 使用类型断言，确保status是TeeStatus类型
          setTeeStatus(status as TeeStatus);
          addLog(`TEE状态: ${JSON.stringify(status)}`);
        } catch (error: any) {
          addLog(`TEE状态检测失败: ${error.message || error}`);
          setError(`TEE状态检测失败: ${error.message || error}`);
        }
      }
    };
    
    checkEnvironment();
  }, []);

  // 初始化TEE
  const handleInitializeTee = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      addLog('开始初始化TEE环境...');
      
      const result = await invokeCommand<boolean>('initialize_tee');
      addLog(`TEE初始化结果: ${result}`);
      
      // 重新获取TEE状态
      const status = await getTeeStatus();
      // 使用类型断言
      setTeeStatus(status as TeeStatus);
      
      addLog('TEE环境初始化完成');
    } catch (error: any) {
      addLog(`TEE初始化失败: ${error.message || error}`);
      setError(`TEE初始化失败: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 创建钱包
  const handleCreateWallet = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      addLog('开始创建钱包...');
      
      const result = await invokeCommand<{
        success: boolean;
        message: string;
        data?: string;
      }>('perform_tee_operation', { 
        operation: 'CreateWallet' 
      });
      
      if (result.success) {
        addLog('钱包创建成功');
        
        // 解析钱包数据
        if (result.data) {
          const walletData = JSON.parse(result.data);
          setWalletInfo({
            walletId: walletData.wallet_id,
            mnemonic: walletData.mnemonic
          });
          
          addLog(`钱包ID: ${walletData.wallet_id}`);
          
          // 获取公钥
          await handleGetPublicKey();
        }
        
        // 重新获取TEE状态
        const status = await getTeeStatus();
        // 使用类型断言
        setTeeStatus(status as TeeStatus);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      addLog(`钱包创建失败: ${error.message || error}`);
      setError(`钱包创建失败: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 获取公钥
  const handleGetPublicKey = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      addLog('获取公钥...');
      
      const result = await invokeCommand<{
        success: boolean;
        message: string;
        data?: string;
      }>('perform_tee_operation', { 
        operation: 'GetPublicKey' 
      });
      
      if (result.success) {
        addLog('获取公钥成功');
        
        // 解析公钥数据
        if (result.data) {
          const publicKeyData = JSON.parse(result.data);
          addLog(`地址: ${publicKeyData.address}`);
          addLog(`公钥: ${publicKeyData.public_key}`);
          
          // 更新状态
          setWalletInfo(prev => ({
            ...prev,
            address: publicKeyData.address,
            publicKey: publicKeyData.public_key
          }));
        }
      } else {
        addLog(`获取公钥失败: ${result.message}`);
      }
    } catch (error) {
      console.error('获取公钥错误:', error);
      addLog(`获取公钥错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 签名交易
  const handleSignTransaction = async () => {
    if (!txData.trim()) {
      setError('请输入交易数据');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      setSignatureResult(null);
      addLog('开始签名交易...');
      
      // 解析交易数据，确保是有效的JSON
      let parsedTxData;
      try {
        parsedTxData = JSON.parse(txData);
      } catch (e) {
        throw new Error('交易数据不是有效的JSON格式');
      }
      
      const result = await invokeCommand<{
        success: boolean;
        message: string;
        data?: string;
      }>('perform_tee_operation', { 
        operation: {
          SignTransaction: JSON.stringify(parsedTxData)
        }
      });
      
      if (result.success) {
        addLog('交易签名成功');
        
        // 解析签名结果
        if (result.data) {
          const signData = JSON.parse(result.data);
          setSignatureResult(signData.signature);
          
          addLog(`签名: ${signData.signature}`);
          addLog(`交易哈希: ${signData.tx_hash}`);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      addLog(`交易签名失败: ${error.message || error}`);
      setError(`交易签名失败: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 加载示例交易数据
  const handleLoadExampleTx = () => {
    const exampleTx = {
      to: "0xc0ffee254729296a45a3885639AC7E10F9d54979",
      value: "0x64", // 100 wei
      gas: "0x5208", // 21000 gas
      gasPrice: "0x3b9aca00", // 1 Gwei
      data: "0x",
      nonce: "0x0",
      chainId: 1
    };
    
    setTxData(JSON.stringify(exampleTx, null, 2));
  };

  return (
    <Layout>
      <Head>
        <title>以太坊钱包 - COS72</title>
        <meta name="description" content="基于TEE的安全以太坊钱包" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 主内容区域 */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">安全以太坊钱包 (TEE)</h1>
        
        {/* 环境信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">环境信息</h2>
          <p className="text-sm text-gray-600 mb-4">当前运行环境: <span className="font-medium">{environment}</span></p>
          
          {environment !== 'Tauri 应用' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
              <p className="text-yellow-700">
                ⚠️ 请注意: TEE 钱包功能需要在 Tauri 应用环境中运行，且需要支持TEE的硬件。
                在浏览器环境下将使用模拟数据。
              </p>
            </div>
          )}
        </div>
        
        {/* TEE状态和操作 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">TEE 状态</h2>
          
          {teeStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="font-semibold mb-2">TEE信息</h3>
                <div className="text-sm space-y-1">
                  <p>可用性: 
                    <span className={teeStatus.available ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                      {teeStatus.available ? '可用' : '不可用'}
                    </span>
                  </p>
                  <p>类型: {teeStatus.type_name}</p>
                  <p>版本: {teeStatus.version}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="font-semibold mb-2">钱包状态</h3>
                <div className="text-sm space-y-1">
                  <p>TEE已初始化: 
                    <span className={teeStatus.initialized ? "text-green-600 ml-1" : "text-yellow-600 ml-1"}>
                      {teeStatus.initialized ? '是' : '否'}
                    </span>
                  </p>
                  <p>钱包已创建: 
                    <span className={teeStatus.wallet_created ? "text-green-600 ml-1" : "text-yellow-600 ml-1"}>
                      {teeStatus.wallet_created ? '是' : '否'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">正在获取TEE状态...</p>
          )}
          
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleInitializeTee}
              disabled={!!(isProcessing || (teeStatus && teeStatus.initialized))}
              className={`
                ${isProcessing 
                  ? 'bg-blue-300 cursor-not-allowed'
                  : (teeStatus && teeStatus.initialized)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white py-2 px-4 rounded
              `}
            >
              {isProcessing ? '处理中...' : (teeStatus && teeStatus.initialized) ? '已初始化' : '初始化TEE环境'}
            </button>
            
            <button
              onClick={handleCreateWallet}
              disabled={isProcessing || !(teeStatus && teeStatus.initialized) || (teeStatus && teeStatus.wallet_created)}
              className={`
                ${isProcessing 
                  ? 'bg-blue-300 cursor-not-allowed'
                  : !(teeStatus && teeStatus.initialized)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : (teeStatus && teeStatus.wallet_created)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                } text-white py-2 px-4 rounded
              `}
            >
              {isProcessing ? '处理中...' : (teeStatus && teeStatus.wallet_created) ? '钱包已创建' : '创建钱包'}
            </button>
            
            <button
              onClick={handleGetPublicKey}
              disabled={isProcessing || !(teeStatus && teeStatus.wallet_created)}
              className={`
                ${isProcessing 
                  ? 'bg-blue-300 cursor-not-allowed'
                  : !(teeStatus && teeStatus.wallet_created)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-600'
                } text-white py-2 px-4 rounded
              `}
            >
              {isProcessing ? '处理中...' : '获取公钥'}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
        
        {/* 钱包信息 */}
        {walletInfo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">钱包信息</h2>
            
            <div className="mb-4">
              <p className="text-sm font-semibold">钱包ID:</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {walletInfo.walletId || '未知'}
              </p>
            </div>
            
            {walletInfo.address && (
              <div className="mb-4">
                <p className="text-sm font-semibold">地址:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                  {walletInfo.address}
                </p>
              </div>
            )}
            
            {walletInfo.publicKey && (
              <div className="mb-4">
                <p className="text-sm font-semibold">公钥:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                  {walletInfo.publicKey}
                </p>
              </div>
            )}
            
            {walletInfo.mnemonic && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-yellow-600">助记词 (请妥善保管):</p>
                <p className="text-sm font-mono bg-yellow-50 p-2 rounded border border-yellow-200 break-all">
                  {walletInfo.mnemonic}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  警告: 此助记词只显示一次，请立即记录并安全保存。任何获得此助记词的人都能完全控制您的钱包。
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* 交易签名区域 */}
        {walletInfo && walletInfo.address && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">交易签名</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">交易数据 (JSON格式)</label>
              <div className="flex">
                <textarea
                  value={txData}
                  onChange={(e) => setTxData(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded font-mono text-sm"
                  rows={8}
                  placeholder='{"to": "0x...", "value": "0x...", ...}'
                  disabled={isProcessing}
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleLoadExampleTx}
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  加载示例
                </button>
              </div>
            </div>
            
            <button
              onClick={handleSignTransaction}
              disabled={isProcessing || !txData.trim()}
              className={`
                ${isProcessing 
                  ? 'bg-blue-300 cursor-not-allowed'
                  : !txData.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white py-2 px-4 rounded w-full
              `}
            >
              {isProcessing ? '签名中...' : '签名交易'}
            </button>
            
            {signatureResult && (
              <div className="mt-4">
                <p className="text-sm font-semibold">签名结果:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all mt-1">
                  {signatureResult}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* 日志区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">操作日志</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-auto max-h-64">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="py-1 border-b border-gray-800">{log}</div>
              ))
            ) : (
              <p className="italic text-gray-500">暂无日志</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 