import { useState, useEffect } from 'react';
import { invoke as invokeCommand, isTauriEnvironment } from '../lib/tauri-api';

export default function Debug() {
  const [results, setResults] = useState<any[]>([]);
  const [command, setCommand] = useState('detect_hardware');
  const [args, setArgs] = useState('{}');
  const [status, setStatus] = useState('就绪');
  
  // 测试命令
  const testCommand = async () => {
    try {
      setStatus('执行中...');
      console.log(`执行命令: ${command}`);
      console.log('参数:', args);
      
      // 解析参数
      let parsedArgs = {};
      try {
        if (args && args.trim() !== '{}') {
          parsedArgs = JSON.parse(args);
        }
      } catch (e) {
        setStatus(`参数解析错误: ${e instanceof Error ? e.message : String(e)}`);
        return;
      }
      
      // 执行命令
      const startTime = Date.now();
      const result = await invokeCommand(command, parsedArgs);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // 添加结果
      setResults(prev => [
        {
          id: Date.now(),
          command,
          args: parsedArgs,
          result,
          time: executionTime,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      
      setStatus('成功');
    } catch (error) {
      console.error('命令执行错误:', error);
      
      // 添加错误结果
      setResults(prev => [
        {
          id: Date.now(),
          command,
          args: args,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      
      setStatus(`错误: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // 预设命令列表
  const presetCommands = [
    { name: '检测硬件', command: 'detect_hardware', args: '{}' },
    { name: '验证密钥', command: 'verify_passkey', args: '{"challenge": "test_challenge"}' },
    { name: '创建钱包', command: 'perform_tee_operation', args: '{"operation": "CreateWallet"}' },
    { name: 'TEE状态', command: 'get_tee_status', args: '{}' }
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tauri 命令调试</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">执行命令</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">命令名称</label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">参数 (JSON)</label>
          <textarea
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={3}
          />
        </div>
        
        <button
          onClick={testCommand}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          执行
        </button>
        
        <p className="mt-2 text-sm text-gray-500">状态: {status}</p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">预设命令</h2>
        <div className="flex flex-wrap gap-2">
          {presetCommands.map((preset, index) => (
            <button
              key={index}
              onClick={() => {
                setCommand(preset.command);
                setArgs(preset.args);
              }}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">执行结果</h2>
        
        {results.length === 0 ? (
          <p className="text-gray-500">暂无结果</p>
        ) : (
          <div className="space-y-4">
            {results.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{item.command}</h3>
                  <span className="text-xs text-gray-500">{item.timestamp}</span>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600">参数: {JSON.stringify(item.args)}</p>
                  {item.time && <p className="text-xs text-gray-500">执行时间: {item.time}ms</p>}
                </div>
                
                <div className="mt-2">
                  {item.error ? (
                    <div className="bg-red-50 p-2 rounded text-red-700 text-sm">
                      <p className="font-medium">错误:</p>
                      <pre className="whitespace-pre-wrap">{item.error}</pre>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-2 rounded text-sm">
                      <p className="font-medium">结果:</p>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(item.result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 