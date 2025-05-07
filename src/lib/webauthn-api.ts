// WebAuthn API 封装
// 提供前端与WebAuthn功能交互的封装

import { invoke } from './tauri-api';

// 类型定义
export interface WebAuthnSupport {
  webauthnSupported: boolean;
  biometricsSupported: boolean;
}

export interface RegistrationChallenge {
  challenge: any;
  user_id: string;
}

export interface RegistrationResult {
  status: string;
  credential: any;
}

export interface AuthenticationChallenge {
  publicKey: any;
}

export interface AuthenticationResult {
  status: string;
  user_id: string;
  counter: number;
}

// 检查是否支持WebAuthn
export async function checkWebAuthnSupport(): Promise<WebAuthnSupport> {
  try {
    const webauthnSupported = await invoke('webauthn_supported');
    const biometricsSupported = await invoke('webauthn_biometric_supported');
    
    return {
      webauthnSupported: Boolean(webauthnSupported),
      biometricsSupported: Boolean(biometricsSupported)
    };
  } catch (error) {
    console.error('[WebAuthn] 检查WebAuthn支持失败:', error);
    return {
      webauthnSupported: false,
      biometricsSupported: false
    };
  }
}

// 注册流程

// 开始注册
export async function startRegistration(username: string): Promise<RegistrationChallenge> {
  try {
    console.log('[WebAuthn] 开始注册流程');
    const result = await invoke('webauthn_start_registration', { username });
    console.log('[WebAuthn] 注册挑战:', result);
    return result as RegistrationChallenge;
  } catch (error) {
    console.error('[WebAuthn] 开始注册失败:', error);
    throw new Error(`注册失败: ${error}`);
  }
}

// 完成注册
export async function finishRegistration(userId: string, response: any): Promise<RegistrationResult> {
  try {
    console.log('[WebAuthn] 完成注册流程');
    const responseJson = typeof response === 'string' ? response : JSON.stringify(response);
    const result = await invoke('webauthn_finish_registration', { 
      userId, 
      response: responseJson 
    });
    console.log('[WebAuthn] 注册结果:', result);
    return result as RegistrationResult;
  } catch (error) {
    console.error('[WebAuthn] 完成注册失败:', error);
    throw new Error(`注册失败: ${error}`);
  }
}

// 验证流程

// 开始验证
export async function startAuthentication(userId: string): Promise<AuthenticationChallenge> {
  try {
    console.log('[WebAuthn] 开始验证流程');
    const result = await invoke('webauthn_start_authentication', { userId });
    console.log('[WebAuthn] 验证挑战:', result);
    return result as AuthenticationChallenge;
  } catch (error) {
    console.error('[WebAuthn] 开始验证失败:', error);
    throw new Error(`验证失败: ${error}`);
  }
}

// 完成验证
export async function finishAuthentication(userId: string, response: any): Promise<AuthenticationResult> {
  try {
    console.log('[WebAuthn] 完成验证流程');
    const responseJson = typeof response === 'string' ? response : JSON.stringify(response);
    const result = await invoke('webauthn_finish_authentication', { 
      userId, 
      response: responseJson 
    });
    console.log('[WebAuthn] 验证结果:', result);
    return result as AuthenticationResult;
  } catch (error) {
    console.error('[WebAuthn] 完成验证失败:', error);
    throw new Error(`验证失败: ${error}`);
  }
}

// 获取用户凭证
export async function getUserCredentials(userId: string): Promise<any> {
  try {
    console.log('[WebAuthn] 获取用户凭证');
    const result = await invoke('webauthn_get_credentials', { userId });
    console.log('[WebAuthn] 用户凭证:', result);
    return result;
  } catch (error) {
    console.error('[WebAuthn] 获取用户凭证失败:', error);
    throw new Error(`获取凭证失败: ${error}`);
  }
}

// 挑战签名验证（兼容旧API）
export async function verifyChallenge(challenge: string): Promise<any> {
  try {
    console.log('[WebAuthn] 验证挑战签名');
    const result = await invoke('verify_passkey', { challenge });
    console.log('[WebAuthn] 验证结果:', result);
    return result;
  } catch (error) {
    console.error('[WebAuthn] 验证失败:', error);
    throw new Error(`验证失败: ${error}`);
  }
} 