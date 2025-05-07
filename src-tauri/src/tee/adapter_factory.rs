// TEE Adapter Factory
// Responsible for creating and managing TEE adapter instances based on environment

use std::sync::Arc;
use tokio::sync::Mutex;

use super::adapter_interface::{TEEAdapter, TEEConnectionType};
use super::teaclave_adapter::TeaclaveAdapter;
use super::optee_adapter::OpTeeAdapter;
use super::TeeError;

/// TEE type enumeration - different TEE implementations
#[derive(Debug, Clone, PartialEq)]
pub enum TEEType {
    /// Teaclave SGX implementation
    Teaclave,
    /// OP-TEE TrustZone implementation
    OpTee,
}

/// Factory for creating and managing TEE adapters
pub struct TEEAdapterFactory;

impl TEEAdapterFactory {
    /// Create a new TEE adapter based on type and connection
    pub fn create_adapter(tee_type: TEEType, connection_type: Option<TEEConnectionType>) 
        -> Box<dyn TEEAdapter> 
    {
        match tee_type {
            TEEType::Teaclave => {
                let mut adapter = TeaclaveAdapter::new();
                if let Some(conn_type) = connection_type {
                    adapter.set_connection_type(conn_type);
                }
                Box::new(adapter) as Box<dyn TEEAdapter>
            },
            TEEType::OpTee => {
                let mut adapter = OpTeeAdapter::new();
                if let Some(conn_type) = connection_type {
                    adapter.set_connection_type(conn_type);
                }
                Box::new(adapter) as Box<dyn TEEAdapter>
            }
        }
    }
    
    /// Auto-detect the best available TEE implementation
    pub fn detect_best_tee() -> Result<(TEEType, TEEConnectionType), TeeError> {
        // First check if local Teaclave is available
        if TeaclaveAdapter::is_supported()? {
            return Ok((TEEType::Teaclave, TEEConnectionType::Local));
        }
        
        // Then check if local OP-TEE is available
        if OpTeeAdapter::is_supported()? {
            return Ok((TEEType::OpTee, TEEConnectionType::Local));
        }
        
        // If no local TEE, check for remote TEE services
        // This would involve network discovery or configuration
        // For now, default to OP-TEE in remote mode if we detect we're in development
        if cfg!(debug_assertions) {
            return Ok((TEEType::OpTee, TEEConnectionType::Remote("http://localhost:3030".to_string())));
        }
        
        // Default to Teaclave in simulation mode
        Ok((TEEType::Teaclave, TEEConnectionType::Simulated))
    }
    
    /// Create the best available TEE adapter
    pub fn create_best_adapter() -> Result<Arc<Mutex<Box<dyn TEEAdapter>>>, TeeError> {
        let (tee_type, connection_type) = Self::detect_best_tee()?;
        let adapter = Self::create_adapter(tee_type, Some(connection_type));
        Ok(Arc::new(Mutex::new(adapter)))
    }
} 