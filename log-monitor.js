#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 创建日志目录
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 获取当前时间作为日志文件名
const now = new Date();
const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
const logFile = path.join(logDir, `app_${timestamp}.log`);

// 创建日志文件流
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// 记录启动信息
logStream.write(`======= COS72-Tauri 日志监控启动 (${new Date().toISOString()}) =======\n\n`);

// 设置环境变量
const env = {
  ...process.env,
  RUST_LOG: 'tauri=trace,cos72_tauri=trace,info'
};

// 启动应用
console.log(`启动Tauri应用，详细日志将保存到: ${logFile}`);
const tauriProcess = spawn('pnpm', ['tauri:dev'], { 
  env,
  shell: true
});

// 处理标准输出
tauriProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  logStream.write(`[STDOUT] ${output}`);
  
  // 分析日志以查找关键事件
  if (output.includes('DOM就绪事件触发') || 
      output.includes('[TAURI-INJECT]') ||
      output.includes('__TAURI__') ||
      output.includes('IPC通道')) {
    logStream.write(`[关键事件] ${new Date().toISOString()}: ${output.trim()}\n`);
  }
});

// 处理标准错误
tauriProcess.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output);
  logStream.write(`[STDERR] ${output}`);
});

// 处理进程结束
tauriProcess.on('close', (code) => {
  const exitMessage = `\n======= 应用进程退出，退出码: ${code} (${new Date().toISOString()}) =======\n`;
  console.log(exitMessage);
  logStream.write(exitMessage);
  logStream.end();
});

// 捕获中断信号
process.on('SIGINT', () => {
  const shutdownMessage = `\n======= 用户中断应用，正在关闭 (${new Date().toISOString()}) =======\n`;
  console.log(shutdownMessage);
  logStream.write(shutdownMessage);
  
  // 杀死子进程
  tauriProcess.kill();
  
  // 给日志文件写入一些时间后结束进程
  setTimeout(() => {
    logStream.end();
    process.exit(0);
  }, 1000);
}); 