pub mod passkey;
pub mod webauthn;  // 新的WebAuthn实现模块
pub mod biometric;  // 新增biometric子模块

// 此模块提供FIDO2/WebAuthn相关功能，用于生物识别签名

// 其他辅助或共享功能可在此添加 

// 重新导出常用功能
pub use webauthn::*;
pub use passkey::*;
pub use biometric::*; 