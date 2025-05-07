# Raspberry Pi TEE Setup Guide for COS72

This guide details how to set up a real Trusted Execution Environment (TEE) on a Raspberry Pi for use with the COS72 Ethereum wallet.

## Hardware Requirements

- Raspberry Pi 4B (recommended 4GB+ RAM)
- 32GB+ microSD card
- Power supply (3A recommended)
- Optional: Case with cooling

## Software Setup

### 1. Base System Installation

```bash
# Download Ubuntu Server 22.04 LTS for Raspberry Pi
wget https://cdimage.ubuntu.com/releases/22.04/release/ubuntu-22.04-preinstalled-server-arm64+raspi.img.xz

# Flash to SD card (replace sdX with your SD card device)
xzcat ubuntu-22.04-preinstalled-server-arm64+raspi.img.xz | sudo dd of=/dev/sdX bs=4M status=progress
```

Boot your Raspberry Pi and complete the initial setup.

### 2. Installing OP-TEE

OP-TEE provides a true TrustZone-based TEE for ARM platforms.

```bash
# Install dependencies
sudo apt update
sudo apt install -y git python3-pip wget curl build-essential python3-dev python3-pycryptodome python3-pyelftools

# Clone OP-TEE repository
mkdir -p ~/tee
cd ~/tee
repo init -u https://github.com/OP-TEE/manifest.git -m rpi4.xml
repo sync -j4

# Build OP-TEE
cd build
make toolchains
make all

# Flash the built images
sudo dd if=out/boot.img of=/dev/mmcblk0p1 bs=4M
sudo dd if=out/rootfs.img of=/dev/mmcblk0p2 bs=4M
```

Reboot your Raspberry Pi. You now have a system with OP-TEE running.

### 3. Building the Ethereum Wallet Trusted Application (TA)

```bash
# Clone the ETH wallet TA repository
git clone https://github.com/cos72/eth-wallet-ta.git
cd eth-wallet-ta

# Build the TA
make CROSS_COMPILE=aarch64-linux-gnu- TA_DEV_KIT_DIR=~/tee/optee_os/out/arm/export-ta_arm64
```

This builds a Trusted Application that will run inside the secure world.

### 4. Building the ETH Wallet Service

```bash
# Clone the ETH wallet service repository
git clone https://github.com/cos72/eth-wallet-service.git
cd eth-wallet-service

# Install Node.js dependencies
sudo apt install -y nodejs npm
npm install

# Configure the service to use the TA
cp config.example.js config.js
# Edit config.js to point to the TA location
```

## Integration with COS72-Tauri

### 1. Setting Up the REST API Server

```bash
# Start the ETH wallet service
cd ~/eth-wallet-service
npm start
```

The service will start on port 3030 by default.

### 2. Configure COS72-Tauri to Use the Remote TEE

Edit your COS72-Tauri configuration to point to the Raspberry Pi:

```
# In .env or config file
ETH_WALLET_SERVICE=http://<raspberry-pi-ip>:3030
USE_REMOTE_TEE=true
```

## Security Enhancements

### 1. Secure Communication

To secure the communication between COS72-Tauri and the Raspberry Pi:

```bash
# Generate self-signed certificates
cd ~/eth-wallet-service
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes

# Configure HTTPS in the service
# Edit config.js to enable HTTPS
```

Update your COS72-Tauri configuration to use HTTPS:

```
ETH_WALLET_SERVICE=https://<raspberry-pi-ip>:3030
```

### 2. Network Isolation

For maximum security, consider:

1. Setting up a dedicated VLAN for the Raspberry Pi
2. Using a USB-to-Ethernet adapter for physical network isolation
3. Implementing firewall rules to restrict access to the TEE service

## Key Management in TEE

The OP-TEE environment provides several secure features:

1. **Secure Storage**: Encrypted storage backed by TrustZone
2. **Hardware Key Derivation**: Keys derived from hardware-specific values
3. **Secure Memory**: Memory that cannot be accessed by normal world

Inside our TA, we implement:

```c
// Example key generation within the secure world
TEE_Result generate_wallet(uint32_t param_types, TEE_Param params[4]) {
    // Generate a random seed within the TEE
    uint8_t seed[32];
    TEE_GenerateRandom(seed, sizeof(seed));
    
    // Derive Ethereum keys
    derive_ethereum_keys(seed, &private_key, &public_key, &address);
    
    // Store keys in secure storage
    TEE_ObjectHandle object;
    TEE_CreatePersistentObject(TEE_STORAGE_PRIVATE, wallet_id, wallet_id_len,
                              TEE_DATA_FLAG_ACCESS_WRITE, NULL, 
                              private_key, private_key_len, &object);
    
    // Return public information to normal world
    memcpy(params[0].memref.buffer, public_key, public_key_len);
    memcpy(params[1].memref.buffer, address, address_len);
    
    return TEE_SUCCESS;
}
```

## Performance Considerations

TrustZone operations are slower than regular execution. Design your application to:

1. Minimize trips between secure and normal worlds
2. Batch operations when possible
3. Use asynchronous patterns to avoid blocking the UI

## Troubleshooting

### Common Issues

1. **TA Loading Fails**: Check that the UUID in your host application matches the TA's UUID
2. **Communication Errors**: Verify network connectivity and firewall settings
3. **Slow Performance**: Consider optimizing the operations performed in the TEE

### Logging and Debugging

Enable TEE logging:

```bash
# On the Raspberry Pi
sudo tee-supplicant -d 
sudo modprobe optee_armtz
```

Check logs:

```bash
dmesg | grep -i tee
```

## Further Resources

- [OP-TEE Documentation](https://optee.readthedocs.io/)
- [ARM TrustZone Guide](https://developer.arm.com/documentation/100935/0100/)
- [GlobalPlatform TEE Specifications](https://globalplatform.org/specs-library/?filter-committee=tee) 