// TEE Module
// Provides TEE-related interfaces and implementations
// v0.3.3 - Added OP-TEE adapter and interface abstraction

use serde::{Serialize, Deserialize};
use std::io::Error as IoError;
use std::fmt;
use tokio::sync::Mutex;
use once_cell::sync::Lazy;
use std::sync::Arc;

// Submodules
mod adapter_interface;
mod teaclave_adapter;
mod optee_adapter;
mod adapter_factory;

// Re-export key components
pub use adapter_interface::{TEEAdapter, TEEConnectionType};
pub use adapter_factory::{TEEAdapterFactory, TEEType};

// Global adapter instance, using Mutex for thread safety
static TEE_ADAPTER: Lazy<Arc<Mutex<Box<dyn TEEAdapter>>>> = Lazy::new(|| {
    TEEAdapterFactory::create_best_adapter().unwrap_or_else(|_| {
        // Fallback to Teaclave in simulation mode
        let adapter = TEEAdapterFactory::create_adapter(
            TEEType::Teaclave, 
            Some(TEEConnectionType::Simulated)
        );
        Arc::new(Mutex::new(adapter))
    })
});

// TEE operation types
#[derive(Debug, Serialize, Deserialize)]
pub enum TeeOperation {
    CreateWallet,                      // Create new wallet
    SignTransaction(String),           // Sign transaction, parameter is transaction data
    VerifySignature(String, String),   // Verify signature, parameters are message and signature
    GetPublicKey,                      // Get public key
    ExportWallet(bool),                // Export wallet (boolean parameter indicates whether to export private key)
    ImportWallet(String),              // Import wallet, parameter is wallet data
}

// TEE operation result
#[derive(Debug, Serialize, Deserialize)]
pub struct TeeResult {
    pub success: bool,
    pub message: String,
    pub data: Option<String>,
}

// TEE status
#[derive(Debug, Serialize, Deserialize)]
pub struct TeeStatus {
    pub available: bool,          // Whether TEE is available
    pub initialized: bool,        // Whether TEE is initialized
    pub type_name: String,        // TEE type name
    pub version: String,          // TEE version
    pub wallet_created: bool,     // Whether wallet is created
}

// Error types
#[derive(Debug)]
pub enum TeeError {
    NotSupported,                 // TEE not supported
    NotInitialized,               // TEE not initialized
    OperationFailed(String),      // Operation failed
    IoError(IoError),             // I/O error
}

// Implement Display trait for TeeError
impl fmt::Display for TeeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TeeError::NotSupported => write!(f, "TEE not supported on this device"),
            TeeError::NotInitialized => write!(f, "TEE environment not initialized"),
            TeeError::OperationFailed(msg) => write!(f, "TEE operation failed: {}", msg),
            TeeError::IoError(e) => write!(f, "I/O error: {}", e),
        }
    }
}

impl From<IoError> for TeeError {
    fn from(error: IoError) -> Self {
        TeeError::IoError(error)
    }
}

// Get TEE status - async function
pub async fn get_tee_status() -> Result<TeeStatus, TeeError> {
    // Get adapter lock asynchronously
    let adapter = TEE_ADAPTER.lock().await;
    adapter.get_status()
}

// Initialize TEE environment
pub async fn initialize_tee() -> Result<bool, TeeError> {
    // First check current status to avoid redundant initialization
    if let Ok(status) = get_tee_status().await {
        if status.initialized {
            return Ok(true); // Already initialized, return success
        }
    }
    
    // Get adapter and initialize - tokio::sync::Mutex returns the lock directly, not a Result
    let mut adapter = TEE_ADAPTER.lock().await;
        
    adapter.initialize().await
}

// Configure TEE with specific parameters
pub async fn configure_tee(tee_type: TEEType, connection_type: TEEConnectionType) -> Result<bool, TeeError> {
    // Create a new adapter with the specified configuration
    let new_adapter = TEEAdapterFactory::create_adapter(tee_type, Some(connection_type));
    
    // Replace the global adapter
    *TEE_ADAPTER.lock().await = new_adapter;
    
    // Initialize the new adapter
    initialize_tee().await
}

// Perform TEE operation
pub async fn perform_tee_operation(op: TeeOperation) -> Result<TeeResult, TeeError> {
    // Get adapter and perform operation
    let mut adapter = TEE_ADAPTER.lock().await;
    adapter.perform_operation(op).await
} 