/**
 * 此脚本用于测试Tauri命令
 * 运行方式: node test-tauri-commands.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('======= COS72-Tauri 命令测试 =======');

// 测试Tauri命令
function testTauriCommand(command, args = {}) {
  console.log(`\n测试命令: ${command}`);
  console.log('参数:', JSON.stringify(args));
  
  try {
    // 构建CLI命令
    const argsJson = JSON.stringify(args).replace(/"/g, '\\"');
    const cliCommand = `cd src-tauri && cargo run --bin cos72-tauri -- ${command} '${argsJson}'`;
    
    console.log('执行:', cliCommand);
    
    // 执行命令
    const output = execSync(cliCommand, { encoding: 'utf8' });
    console.log('输出:', output);
    return { success: true, output };
  } catch (error) {
    console.error('错误:', error.message);
    return { success: false, error: error.message };
  }
}

// 创建直接的测试脚本
function createDirectTest() {
  console.log('\n生成直接调用Rust函数的测试脚本...');
  
  const testCode = `
use std::env;
use cos72_tauri::hardware::detect;

fn main() {
    println!("直接调用硬件检测函数测试");
    
    match detect::get_hardware_info() {
        Ok(info) => {
            println!("检测成功:");
            println!("CPU: {}", info.cpu.model_name);
            println!("架构: {}", info.cpu.architecture);
            println!("核心数: {}", info.cpu.cores);
            println!("是ARM架构: {}", info.cpu.is_arm);
            println!("内存: {} MB", info.memory);
            println!("TEE类型: {}", info.tee.tee_type);
        },
        Err(e) => {
            println!("检测失败: {}", e);
        }
    }
}
`;

  // 写入测试脚本
  fs.writeFileSync('src-tauri/examples/direct_test.rs', testCode);
  console.log('已生成测试脚本: src-tauri/examples/direct_test.rs');
  
  // 创建examples目录
  if (!fs.existsSync('src-tauri/examples')) {
    fs.mkdirSync('src-tauri/examples', { recursive: true });
  }
  
  // 确保Cargo.toml有examples配置
  const cargoToml = path.join('src-tauri', 'Cargo.toml');
  if (fs.existsSync(cargoToml)) {
    let content = fs.readFileSync(cargoToml, 'utf8');
    if (!content.includes('[[example]]')) {
      content += `
[[example]]
name = "direct_test"
path = "examples/direct_test.rs"
`;
      fs.writeFileSync(cargoToml, content);
      console.log('已更新Cargo.toml配置');
    }
  }
  
  console.log('使用以下命令运行测试:');
  console.log('cd src-tauri && cargo run --example direct_test');
}

// 创建调试信息页面
function createDebugPage() {
  console.log('\n生成调试页面...');
  
  const debugCode = `import { useState, useEffect } from 'react';
import { invoke as invokeCommand, isTauriEnvironment } from '../lib/tauri-api';

export default function Debug() {
  const [results, setResults] = useState([]);
  const [command, setCommand] = useState('detect_hardware');
  const [args, setArgs] = useState('{}');
  const [status, setStatus] = useState('就绪');
  
  // 测试命令
  const testCommand = async () => {
    try {
      setStatus('执行中...');
      console.log(\`执行命令: \${command}\`);
 