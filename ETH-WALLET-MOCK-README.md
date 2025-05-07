# ETH Wallet Mock Service for COS72-Tauri

This is a mock service that simulates the TEE-based ETH wallet functionality for testing purposes. It provides the same API interface as the COS72-Tauri app but works in a standard Linux environment without TEE hardware requirements.

## Features

- Simulates all TEE operations in COS72-Tauri
- Provides wallet creation, public key retrieval, and transaction signing
- Persists wallet data to local storage
- Runs as a standalone Express.js service
- Can be deployed via Docker

## Usage Options

### 1. Running Directly in Node.js

```bash
# Install dependencies
npm install express cors crypto uuid

# Run the service
node eth-wallet-service-mock.js
```

The service will start on port 3030 by default.

### 2. Using Docker

```bash
# Build the Docker image
docker build -t eth-wallet-mock -f Dockerfile.eth-wallet-mock .

# Run the container
docker run -p 3030:3030 -v ./wallet-data:/app/.eth-wallet-mock eth-wallet-mock
```

### 3. Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  eth-wallet-mock:
    build:
      context: .
      dockerfile: Dockerfile.eth-wallet-mock
    ports:
      - "3030:3030"
    volumes:
      - ./wallet-data:/app/.eth-wallet-mock
```

Then run:

```bash
docker-compose up -d
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tee/status` | GET | Get TEE status |
| `/api/tee/initialize` | POST | Initialize TEE environment |
| `/api/tee/wallet` | POST | Create a new wallet |
| `/api/tee/wallet/:walletId/publickey` | GET | Get wallet public key |
| `/api/tee/wallet/:walletId/sign` | POST | Sign a transaction |
| `/api/tee/wallet/:walletId/export` | GET | Export wallet data |

## Using with COS72-Tauri

To use this mock service with COS72-Tauri:

1. Run the mock service on your Linux machine
2. Configure COS72-Tauri to connect to the mock service instead of using local TEE

### Configuration Example

Add a configuration in your `.env` file or application settings:

```
ETH_WALLET_SERVICE=http://localhost:3030
USE_REMOTE_TEE=true
```

## Example API Requests

### Create Wallet

```bash
curl -X POST http://localhost:3030/api/tee/wallet
```

### Get Public Key

```bash
curl http://localhost:3030/api/tee/wallet/YOUR_WALLET_ID/publickey
```

### Sign Transaction

```bash
curl -X POST \
  http://localhost:3030/api/tee/wallet/YOUR_WALLET_ID/sign \
  -H "Content-Type: application/json" \
  -d '{"txData":"0x..."}'
```

## Security Considerations

This is a testing tool and should NOT be used in production environments:

- No actual cryptographic operations are performed
- Private keys are stored in plain text
- No authentication or authorization is implemented
- The service is meant for local development and testing only

## License

This mock service is provided under the same license as the COS72-Tauri project. 