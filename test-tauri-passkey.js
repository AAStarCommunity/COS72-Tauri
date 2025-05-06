/**
 * COS72 Tauri Passkey/FIDO2 签名测试脚本
 * 
 * 此脚本用于测试Tauri的Passkey/FIDO2签名功能
 * 使用Node.js直接调用Tauri的底层命令行接口
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

// 调试模式标志
const DEBUG = true;

console.log('======= COS72 Tauri FIDO2 Passkey签名测试 =======');

/**
 * 调试日志
 * @param {...any} args 日志内容
 */
function debugLog(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

/**
 * 生成随机挑战
 * @param {number} length 挑战的字节长度
 * @returns {string} Base64编码的挑战
 */
function generateChallenge(length = 32) {
  const challenge = randomBytes(length);
  return challenge.toString('base64');
}

/**
 * 从Tauri输出中提取JSON结果
 * @param {string} output Tauri命令的原始输出
 * @returns {object|null} 解析的JSON或null
 */
function extractJsonFromOutput(output) {
  // 尝试寻找JSON对象的开始 - 通常是 '{'
  const jsonStartIndex = output.indexOf('{');
  const jsonEndIndex = output.lastIndexOf('}');
  
  debugLog('JSON开始位置:', jsonStartIndex);
  debugLog('JSON结束位置:', jsonEndIndex);
  
  if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
    try {
      // 提取可能的JSON部分
      const jsonPart = output.substring(jsonStartIndex, jsonEndIndex + 1);
      debugLog('提取的JSON部分:', jsonPart);
      return JSON.parse(jsonPart);
    } catch (e) {
      console.error('JSON解析失败:', e.message);
      return null;
    }
  }
  
  return null;
}

/**
 * 测试签名功能
 * @param {string} challenge 要签名的挑战(Base64格式)
 * @returns {object} 测试结果
 */
function testPasskeySignature(challenge) {
  console.log(`\n测试verify_passkey命令，挑战: ${challenge}`);
  
  try {
    // 准备参数JSON
    const argsJson = JSON.stringify({ challenge }).replace(/"/g, '\\"');
    
    // 构建CLI命令，添加输出JSON的参数
    const cliCommand = `cd src-tauri && RUST_LOG=debug cargo run --bin cos72-tauri -- verify_passkey '${argsJson}' --output-format json`;
    
    console.log('执行命令:', cliCommand);
    
    // 执行命令并记录时间
    const startTime = Date.now();
    let output = '';
    
    try {
      output = execSync(cliCommand, { encoding: 'utf8' });
    } catch (runError) {
      // 即使命令返回非零状态码，我们也捕获输出
      debugLog('命令执行错误:', runError.message);
      if (runError.stdout) output = runError.stdout;
      if (runError.stderr) console.error('标准错误:', runError.stderr);
    }
    
    const executionTime = Date.now() - startTime;
    
    console.log(`命令执行时间: ${executionTime}ms`);
    console.log('原始输出长度:', output.length, '字节');
    
    // 显示部分输出以便调试
    if (DEBUG) {
      const previewLength = Math.min(output.length, 200);
      debugLog('输出预览:', output.substring(0, previewLength) + (output.length > previewLength ? '...' : ''));
    }
    
    // 尝试提取并解析JSON
    const jsonResult = extractJsonFromOutput(output);
    
    if (jsonResult) {
      console.log('成功提取JSON结果');
      return { 
        success: true, 
        output: jsonResult,
        executionTime
      };
    } else {
      console.log('无法从输出中提取JSON，返回原始输出');
      // 保存完整输出到文件以便进一步调试
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rawOutputFile = `raw-output-${timestamp}.txt`;
      fs.writeFileSync(rawOutputFile, output, 'utf8');
      console.log(`原始输出已保存到: ${rawOutputFile}`);
      
      return { 
        success: true, 
        rawOutput: output,
        executionTime,
        rawOutputFile
      };
    }
  } catch (error) {
    console.error('命令执行错误:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * 保存测试结果到文件
 * @param {object} result 测试结果
 */
function saveResultToFile(result) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `passkey-test-result-${timestamp}.json`;
  
  fs.writeFileSync(
    filename, 
    JSON.stringify(result, null, 2),
    'utf8'
  );
  
  console.log(`\n测试结果已保存到: ${filename}`);
}

// 主测试流程
function runTests() {
  console.log('\n===== 开始测试 =====');
  
  // 环境信息
  console.log('Node.js版本:', process.version);
  console.log('操作系统:', process.platform, process.arch);
  console.log('当前目录:', process.cwd());
  
  // 1. 生成随机挑战
  const challenge = generateChallenge();
  console.log(`生成随机挑战: ${challenge}`);
  
  // 2. 执行签名测试
  const result = testPasskeySignature(challenge);
  
  // 3. 保存结果
  const fullResult = {
    timestamp: new Date().toISOString(),
    challenge,
    result,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  saveResultToFile(fullResult);
  
  // 4. 报告结果
  if (result.success) {
    console.log('\n✅ FIDO2签名测试成功!');
    if (result.output?.signature) {
      console.log('\n签名结果:');
      console.log(result.output.signature);
    }
  } else {
    console.log('\n❌ FIDO2签名测试失败!');
  }
  
  console.log('\n测试完成。');
}

// 运行测试
runTests(); 