#!/usr/bin/env node
/**
 * ETH Wallet Service Mock
 * 
 * This script creates a mock service that simulates the TEE-based ETH wallet
 * functionality for testing purposes. It provides the same API interface as 
 * the COS72-Tauri app, but works in a standard Linux environment without
 * TEE hardware.
 * 
 * Usage:
 * 1. Install dependencies: npm install express cors crypto uuid
 * 2. Run: node eth-wallet-service-mock.js
 * 3. Access API at http://localhost:3030
 */

const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3030;
const STORAGE_DIR = path.join(__dirname, '.eth-wallet-mock');
const WALLET_FILE = path.join(STORAGE_DIR, 'wallets.json');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Initialize wallet storage
let wallets = {};
if (fs.existsSync(WALLET_FILE)) {
  try {
    wallets = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    console.log(`Loaded ${Object.keys(wallets).length} existing wallets`);
  } catch (err) {
    console.error('Error loading wallets:', err);
  }
}

// Save wallets to storage
function saveWallets() {
  fs.writeFileSync(WALLET_FILE, JSON.stringify(wallets, null, 2));
}

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes

// Get TEE status (always reports as available)
app.get('/api/tee/status', (req, res) => {
  res.json({
    available: true,
    initialized: true,
    type_name: "Linux Mock TEE",
    version: "1.0.0",
    wallet_created: Object.keys(wallets).length > 0
  });
});

// Initialize TEE
app.post('/api/tee/initialize', (req, res) => {
  res.json({
    success: true,
    message: "TEE environment initialized"
  });
});

// Create wallet
app.post('/api/tee/wallet', (req, res) => {
  const walletId = uuidv4();
  
  // Generate a random private key (32 bytes)
  const privateKey = crypto.randomBytes(32);
  
  // Generate a mock public key (64 bytes) - in reality it would be derived from private key
  const publicKey = Buffer.concat([
    crypto.randomBytes(31),
    Buffer.from([0x01]) // Set last byte to 0x01 to simulate a valid public key
  ]);
  
  // Generate a mock address (20 bytes) - in reality it would be derived from public key
  const address = '0x' + publicKey.slice(12, 32).toString('hex');
  
  // Store wallet
  wallets[walletId] = {
    id: walletId,
    privateKey: privateKey.toString('hex'),
    publicKey: '0x' + publicKey.toString('hex'),
    address: address,
    createdAt: new Date().toISOString()
  };
  
  saveWallets();
  
  res.json({
    success: true,
    message: "Wallet created successfully",
    data: JSON.stringify({
      wallet_id: walletId,
      address: address,
      public_key: '0x' + publicKey.toString('hex')
    })
  });
});

// Get wallet public key
app.get('/api/tee/wallet/:walletId/publickey', (req, res) => {
  const { walletId } = req.params;
  
  if (!wallets[walletId]) {
    return res.status(404).json({
      success: false,
      message: "Wallet not found"
    });
  }
  
  res.json({
    success: true,
    message: "Public key retrieved successfully",
    data: JSON.stringify({
      wallet_id: walletId,
      address: wallets[walletId].address,
      public_key: wallets[walletId].publicKey
    })
  });
});

// Sign transaction
app.post('/api/tee/wallet/:walletId/sign', (req, res) => {
  const { walletId } = req.params;
  const { txData } = req.body;
  
  if (!wallets[walletId]) {
    return res.status(404).json({
      success: false,
      message: "Wallet not found"
    });
  }
  
  if (!txData) {
    return res.status(400).json({
      success: false,
      message: "Transaction data required"
    });
  }
  
  // Generate a mock signature (65 bytes)
  // In reality, this would be created using the private key to sign the transaction
  const mock_sig = Buffer.concat([
    crypto.randomBytes(64),
    Buffer.from([27]) // v value (recovery id)
  ]);
  
  // Create a deterministic but random-looking tx hash based on the input
  const txHash = '0x' + crypto.createHash('sha256')
    .update(txData + walletId)
    .digest('hex')
    .substring(0, 64);
  
  res.json({
    success: true,
    message: "Transaction signed successfully",
    data: JSON.stringify({
      wallet_id: walletId,
      signature: '0x' + mock_sig.toString('hex'),
      tx_hash: txHash
    })
  });
});

// Export wallet
app.get('/api/tee/wallet/:walletId/export', (req, res) => {
  const { walletId } = req.params;
  const { includePrivate } = req.query;
  
  if (!wallets[walletId]) {
    return res.status(404).json({
      success: false,
      message: "Wallet not found"
    });
  }
  
  const exportData = {
    wallet_id: walletId,
    address: wallets[walletId].address,
    public_key: wallets[walletId].publicKey,
    has_private_key: includePrivate === 'true'
  };
  
  // Only include private key if specifically requested
  if (includePrivate === 'true') {
    exportData.private_key = '0x' + wallets[walletId].privateKey;
  }
  
  res.json({
    success: true,
    message: "Wallet exported successfully",
    data: JSON.stringify(exportData)
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`ETH Wallet Service Mock running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/tee/status`);
  console.log(`Storage location: ${STORAGE_DIR}`);
  console.log(`Mock TEE environment: Linux Mock TEE v1.0.0`);
}); 