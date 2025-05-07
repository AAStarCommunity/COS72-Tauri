// TEE Adapter Interface
// This module defines the common interface that all TEE implementations must implement

use async_trait::async_trait;
use crate::tee::{TeeOperation, TeeResult, TeeStatus, TeeError};

/// TEEAdapter trait defines the interface that any TEE implementation must implement
/// This enables the application to work with different TEE implementations
#[async_trait]
pub trait TEEAdapter: Send + Sync {
    /// Create a new instance of the adapter
    fn new() -> Self where Self: Sized;
    
    /// Check if this TEE implementation is supported on the current hardware
    fn is_supported() -> Result<bool, TeeError> where Self: Sized;
    
    /// Initialize the TEE environment
    async fn initialize(&mut self) -> Result<bool, TeeError>;
    
    /// Get the current status of the TEE
    fn get_status(&self) -> Result<TeeStatus, TeeError>;
    
    /// Perform a TEE operation
    async fn perform_operation(&mut self, op: TeeOperation) -> Result<TeeResult, TeeError>;
}

/// Represents the connection type to the TEE
#[derive(Debug, Clone, PartialEq)]
pub enum TEEConnectionType {
    /// TEE is implemented directly on the current device
    Local,
    /// TEE is implemented on a remote device (e.g., Raspberry Pi)
    Remote(String), // Contains the URL to the remote TEE service
    /// Simulated TEE environment (for testing and development)
    Simulated,
} 