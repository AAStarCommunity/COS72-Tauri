/**
 * 此脚本用于测试Tauri命令调用 - 专注于passkey签名
 */
const { execSync } = require('child_process');

console.log('======= 测试FIDO2 Passkey签名 =======');

function testPasskeyCommand() {
  console.log('\n测试verify_passkey命令...');
  
  try {
    // 模拟challenge
    const challenge = 'SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IGNoYWxsZW5nZQ==';
    const argsJson = JSON.stringify({ challenge }).replace(/"/g, '\\"');
    
    // 构建CLI命令
    const cliCommand = `cd src-tauri && cargo run --bin cos72-tauri -- verify_passkey '${argsJson}'`;
    
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

// 执行测试
const result = testPasskeyCommand();

// 报告结果
if (result.success) {
  console.log('\n✅ 签名测试成功!');
} else {
  console.log('\n❌ 签名测试失败!');
}

console.log('\n测试完成。'); 