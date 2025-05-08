import { useState, useEffect } from 'react';
import Head from 'next/head';
import { invoke } from '../lib/tauri-api';

// 直接调用示例组件
const DirectCallExample = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const handleDirectCall = async () => {
    if (!input.trim()) {
      setError('请输入一些文本');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 直接调用后端echo命令
      const response = await invoke<string>('echo_message', { message: input });
      setResult(response);
    } catch (err) {
      console.error('调用失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white my-4">
      <h3 className="font-medium text-lg mb-2">方法1: 直接调用</h3>
      <p className="text-gray-600 text-sm mb-4">
        最基本的通信方式，前端直接调用Rust函数并获取返回值。
      </p>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">输入消息：</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入任意文本..."
            className="flex-grow px-3 py-2 border rounded-md"
          />
          <button
            onClick={handleDirectCall}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? '处理中...' : '发送'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
          {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <div className="font-medium text-sm mb-1">响应结果：</div>
          <div className="p-3 bg-gray-50 border rounded-md text-sm">
            {result}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 border-t pt-2">
        <details>
          <summary className="cursor-pointer font-medium">查看代码实现</summary>
          <div className="mt-2 space-y-2">
            <div>
              <div className="font-medium">前端代码:</div>
              <pre className="bg-gray-50 p-2 rounded-md overflow-x-auto text-xs">
                {`const response = await invoke<string>('echo_message', { message: input });`}
              </pre>
            </div>
            <div>
              <div className="font-medium">后端代码 (Rust):</div>
              <pre className="bg-gray-50 p-2 rounded-md overflow-x-auto text-xs">
                {`#[tauri::command]
fn echo_message(message: String) -> Result<String, String> {
    Ok(format!("收到消息: {}", message))
}`}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

// 计算器模式示例
const CalculatorModeExample = () => {
  const [num1, setNum1] = useState<number>(0);
  const [num2, setNum2] = useState<number>(0);
  const [operation, setOperation] = useState<string>('+');
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 调用后端计算函数
      const calculationResult = await invoke<number>('perform_calculation', { 
        num1, 
        num2, 
        operation 
      });
      setResult(calculationResult);
    } catch (err) {
      console.error('计算失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white my-4">
      <h3 className="font-medium text-lg mb-2">方法2: 计算器模式</h3>
      <p className="text-gray-600 text-sm mb-4">
        适用于处理和计算场景，前端发送数据，后端处理后返回结果。
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">数值1:</label>
          <input
            type="number"
            value={num1}
            onChange={(e) => setNum1(Number(e.target.value))}
            className="w-24 px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">操作:</label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="w-20 px-3 py-2 border rounded-md"
          >
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="*">×</option>
            <option value="/">÷</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">数值2:</label>
          <input
            type="number"
            value={num2}
            onChange={(e) => setNum2(Number(e.target.value))}
            className="w-24 px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? '计算中...' : '计算'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
          {error}
        </div>
      )}
      
      {result !== null && (
        <div className="mt-4">
          <div className="font-medium text-sm mb-1">计算结果：</div>
          <div className="p-3 bg-gray-50 border rounded-md flex items-center">
            <span className="text-lg font-medium">{result}</span>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 border-t pt-2">
        <details>
          <summary className="cursor-pointer font-medium">查看代码实现</summary>
          <div className="mt-2 space-y-2">
            <div>
              <div className="font-medium">前端代码:</div>
              <pre className="bg-gray-50 p-2 rounded-md overflow-x-auto text-xs">
                {`const calculationResult = await invoke<number>('perform_calculation', { 
  num1, 
  num2, 
  operation 
});`}
              </pre>
            </div>
            <div>
              <div className="font-medium">后端代码 (Rust):</div>
              <pre className="bg-gray-50 p-2 rounded-md overflow-x-auto text-xs">
                {`#[tauri::command]
fn perform_calculation(num1: f64, num2: f64, operation: String) -> Result<f64, String> {
    match operation.as_str() {
        "+" => Ok(num1 + num2),
        "-" => Ok(num1 - num2),
        "*" => Ok(num1 * num2),
        "/" => {
            if num2 == 0.0 {
                Err("除数不能为零".to_string())
            } else {
                Ok(num1 / num2)
            }
        },
        _ => Err("不支持的操作".to_string())
    }
}`}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

// 事件模式示例
const EventModeExample = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 启动长时间运行的操作
  const startOperation = async () => {
    setError(null);
    setProgress(0);
    setMessages([]);
    
    try {
      // 处理Tauri环境检测
      if (typeof window === 'undefined' || !window.__TAURI__ || !window.__TAURI__.event) {
        // 在非Tauri环境中启动模拟操作
        setIsRunning(true);
        return;
      }
      
      // 注册事件监听器
      const unlisten = await window.__TAURI__.event.listen('progress-update', (event: any) => {
        setProgress(event.payload);
        setMessages(prev => [...prev, `进度更新: ${event.payload}%`]);
      });
      
      const unlistenComplete = await window.__TAURI__.event.listen('operation-complete', (event: any) => {
        setMessages(prev => [...prev, `操作完成: ${event.payload}`]);
        setIsRunning(false);
        
        // 清除监听器
        if (unlisten) unlisten();
        if (unlistenComplete) unlistenComplete();
      });
      
      setIsRunning(true);
      
      // 调用后端启动长操作
      await invoke('start_long_operation');
      
    } catch (err) {
      console.error('操作失败:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsRunning(false);
    }
  };

  // 模拟Tauri环境中的事件监听与进度更新
  useEffect(() => {
    // 模拟事件更新(仅在非Tauri环境中)
    if (isRunning && !window.__TAURI__) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress > 100) {
            clearInterval(interval);
            setIsRunning(false);
            setMessages(prev => [...prev, '操作完成: 模拟操作已完成']);
            return 100;
          }
          setMessages(prev => [...prev, `进度更新: ${newProgress}%`]);
          return newProgress;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  return (
    <div className="p-4 border rounded-lg bg-white my-4">
      <h3 className="font-medium text-lg mb-2">方法3: 后端事件模式</h3>
      <p className="text-gray-600 text-sm mb-4">
        适用于长时间运行的操作，后端可以主动向前端发送消息。
      </p>
      
      <div className="mb-4">
        <button
          onClick={startOperation}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isRunning ? '处理中...' : '启动长时间操作'}
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
          {error}
        </div>
      )}
      
      {isRunning && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>进度: {progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {messages.length > 0 && (
        <div className="mt-4">
          <div className="font-medium text-sm mb-1">事件消息：</div>
          <div className="max-h-60 overflow-y-auto border rounded-md">
            {messages.map((msg, index) => (
              <div key={index} className="p-2 text-sm border-b last:border-b-0">
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 border-t pt-2">
        <details>
          <summary className="cursor-pointer font-medium">查看代码实现</summary>
          <div className="mt-2 space-y-2">
            <div>
              <div className="font-medium">前端代码:</div>
              <pre className="bg-gray-50 p-2 rounded-md overflow-x-auto text-xs">
                {`// 注册事件监听器
const unlisten = await window.__TAURI__?.event.listen('progress-update', (event) => {
  setProgress(event.payload);
});

// 启动后端操作
await invoke('start_long_operation');`}
              </pre>
            </div>
            <div>
              <div className="font-medium">后端代码 (Rust):</div>
              <pre className="bg-gray-50 p-2 rounded-md overflow-x-auto text-xs">
                {`#[tauri::command]
fn start_long_operation(window: tauri::Window) -> Result<(), String> {
    // 启动线程处理长时间运行操作
    std::thread::spawn(move || {
        for i in 0..=10 {
            // 模拟工作
            std::thread::sleep(std::time::Duration::from_millis(500));
            
            // 发送进度更新事件
            let progress = i * 10;
            window.emit("progress-update", progress).expect("failed to emit");
        }
        
        // 操作完成时发送事件
        window.emit("operation-complete", "操作已成功完成").expect("failed to emit");
    });
    
    Ok(())
}`}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default function TauriCommunicationDemo() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Head>
        <title>Tauri通信示例 - COS72</title>
        <meta name="description" content="展示Tauri前后端通信的不同方式" />
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Tauri前后端通信示例</h1>
        <p className="text-gray-600">
          本页面展示了Tauri应用中前后端通信的三种常见模式，包括直接调用、计算器模式和事件模式。
        </p>
      </div>
      
      <DirectCallExample />
      
      <CalculatorModeExample />
      
      <EventModeExample />
      
      <div className="mt-8 p-4 border rounded-lg bg-blue-50">
        <h3 className="font-medium text-lg mb-2">更多资源</h3>
        <p className="mb-2">
          查看<a href="/tauri-debug" className="text-blue-600 hover:underline">Tauri调试页面</a>获取更多系统信息和诊断工具。
        </p>
        <p>
          阅读<a href="#" className="text-blue-600 hover:underline">Tauri通信方法指南</a>了解更多技术细节。
        </p>
      </div>
    </div>
  );
} 