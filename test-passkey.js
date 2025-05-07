/**
 * 直接测试FIDO2 Passkey签名的命令行脚本
 * 使用方法: node test-passkey.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const { invoke } = require('@tauri-apps/api');

// 测试挑战 - Base64编码的"Hello, this is a test challenge"
const TEST_CHALLENGE = "SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IGNoYWxsZW5nZQ==";

// 创建logs目录（如果不存在）
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// 日志文件名
const logFileName = `logs/passkey-test-${new Date().toISOString().replace(/:/g, '-')}.log`;

// 写入日志
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // 输出到控制台
  console.log(message);
  
  // 写入日志文件
  fs.appendFileSync(logFileName, logMessage);
}

// 基础测试工具
const error = (msg) => console.error(`[${new Date().toLocaleTimeString()}] ERROR: ${msg}`);

// 测试WebAuthn支持
async function testWebAuthnSupport() {
  log('检查WebAuthn支持...');
  try {
    const supported = await invoke('webauthn_supported');
    log(`WebAuthn支持: ${supported}`);
    
    const biometricSupported = await invoke('webauthn_biometric_supported');
    log(`生物识别支持: ${biometricSupported}`);
    
    return supported;
  } catch (err) {
    error(`检查WebAuthn支持失败: ${err}`);
    return false;
  }
}

// 测试Passkey签名
async function testPasskeySignature() {
  log('测试Passkey签名...');
  
  // 创建测试挑战
  const challenge = Buffer.from('test challenge ' + Date.now()).toString('base64');
  log(`使用挑战: ${challenge}`);
  
  try {
    log('调用verify_passkey命令...');
    const result = await invoke('verify_passkey', { challenge });
    log('签名结果:');
    console.log(result);
    return result;
  } catch (err) {
    error(`签名测试失败: ${err}`);
    throw err;
  }
}

// 执行所有测试
async function runAllTests() {
  try {
    log('===== 开始WebAuthn/Passkey测试 =====');
    
    // 检查WebAuthn支持
    const supported = await testWebAuthnSupport();
    if (!supported) {
      log('WebAuthn不支持，跳过后续测试');
      return;
    }
    
    // 测试签名
    await testPasskeySignature();
    
    log('===== 测试完成 =====');
  } catch (err) {
    error(`测试过程中发生错误: ${err}`);
  }
}

// 执行测试
runAllTests().catch(error => {
  log(`顶层错误: ${error}`);
  process.exit(1);
}); 