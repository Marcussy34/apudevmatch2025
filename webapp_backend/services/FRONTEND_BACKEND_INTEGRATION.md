# Frontend-Backend Integration Guide

## Overview

This guide explains how to integrate the frontend zkLogin service with the backend credential storage system for real zkLogin testing.

## Architecture

```
Frontend (React)                    Backend (Node.js/Express)
┌─────────────────┐                ┌─────────────────────┐
│ zkLogin Service │                │ Credential Service  │
│                 │                │                     │
│ • OAuth Flow    │                │ • Seal Encryption   │
│ • Ephemeral Key │                │ • Walrus Storage    │
│ • User Profile  │                │ • Sui On-chain Log  │
└─────────────────┘                └─────────────────────┘
         │                                   │
         │ HTTP POST /api/store-credentials  │
         └───────────────────────────────────┘
```

## Setup Instructions

### 1. Start the Backend Server

```bash
cd webapp_backend/services
npm run server
```

The server will start on `http://localhost:3001` with the following endpoints:

- `GET /health` - Health check
- `GET /api/status` - Service status
- `POST /api/store-credentials` - Store credentials with zkLogin

### 2. Frontend Integration

The frontend includes:

- `BackendIntegrationService` - Service for API communication
- `BackendIntegrationTest` - React component for testing

### 3. Testing the Integration

#### Option A: Use the Test Component

1. Add `BackendIntegrationTest` to your React app
2. Click "Check Backend Status" to verify connectivity
3. Click "Test with zkLogin" to test real zkLogin integration

#### Option B: Manual Testing

1. Complete zkLogin OAuth flow in frontend
2. Extract zkLogin parameters from browser storage
3. Send API request to backend

## API Reference

### POST /api/store-credentials

**Request Body:**

```json
{
  "credentials": {
    "site": "gmail.com",
    "username": "user@example.com",
    "password": "password123",
    "notes": "Optional notes"
  },
  "zkLoginParams": {
    "ephemeralPrivateKey": "base64_encoded_private_key",
    "userProfile": {
      "name": "User Name",
      "email": "user@example.com",
      "suiAddress": "0xe9bbcfc96c21024014e022432a18168d6fb8104761c7a17fe2c6b100f138e2e7",
      "provider": "Google zkLogin",
      "jwtToken": "jwt_token_from_oauth",
      "userSalt": "user_salt"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "blobId": "IjMqnpyXaiLmYHmL3-dwmH8O5kd-GftlxepuMxSyyHk",
    "cid": "IjMqnpyXaiLmYHmL3-dwmH8O5kd-GftlxepuMxSyyHk",
    "transactionDigest": "0x1234567890abcdef..."
  },
  "message": "Credentials stored successfully"
}
```

## zkLogin Integration Flow

### 1. Frontend zkLogin Process

```typescript
// 1. User initiates zkLogin
ZkLoginService.initiateZkLoginFlow();

// 2. After OAuth callback
const userProfile = await ZkLoginService.handleOAuthCallback(urlParams);

// 3. Extract zkLogin parameters
const zkLoginParams = BackendIntegrationService.extractZkLoginParams();
```

### 2. Backend Processing

```typescript
// 1. Set zkLogin parameters
credentialService.setZkLoginParams(zkLoginParams);

// 2. Store credentials (uses real zkLogin signing)
const result = await credentialService.storeCredentials(credentials);
```

## Testing Scenarios

### Scenario 1: Real zkLogin Integration

**Prerequisites:**

- User completed zkLogin OAuth flow
- Ephemeral key in sessionStorage
- User profile in localStorage
- zkLogin address has SUI tokens

**Test:**

```typescript
const result = await BackendIntegrationService.storeCredentials(credentials);
// Uses real zkLogin ephemeral key for signing
// Real on-chain logging with zkLogin address
```

### Scenario 2: Simulation Mode

**Prerequisites:**

- Backend server running
- No zkLogin session required

**Test:**

```typescript
const result = await BackendIntegrationService.storeCredentialsWithoutZkLogin(
  credentials
);
// Uses simulation for on-chain logging
// Real Seal encryption and Walrus storage
```

## Troubleshooting

### Common Issues

1. **"zkLogin parameters not available"**

   - Solution: Complete zkLogin OAuth flow in frontend first

2. **"Invalid zkLogin parameters"**

   - Solution: Check that ephemeral key is valid Base64 format

3. **"could not find WAL coins with sufficient balance"**

   - Solution: Get WAL tokens: `walrus get-wal --context testnet --amount 100000000`

4. **"could not find SUI coins with sufficient balance"**
   - Solution: Get SUI tokens for zkLogin address from faucet

### Debug Steps

1. **Check Backend Status:**

   ```bash
   curl http://localhost:3001/api/status
   ```

2. **Check zkLogin Parameters:**

   ```javascript
   // In browser console
   console.log("Ephemeral Key:", sessionStorage.getItem("zklogin-keypair"));
   console.log("User Profile:", localStorage.getItem("userProfile"));
   ```

3. **Test Individual Components:**

   ```bash
   # Test Seal encryption
   npm run test

   # Test Walrus upload
   npm run test-zklogin
   ```

## Security Considerations

1. **Ephemeral Key Security:**

   - Ephemeral keys are stored in sessionStorage (cleared on tab close)
   - Never log or expose ephemeral private keys

2. **JWT Token Security:**

   - JWT tokens contain sensitive user information
   - Store securely and handle with care

3. **Network Security:**
   - Use HTTPS in production
   - Implement proper CORS policies
   - Validate all input data

## Production Deployment

1. **Environment Variables:**

   ```bash
   # Backend
   PORT=3001
   SUI_NETWORK=mainnet
   WALRUS_URL=https://mainnet.wal.app

   # Frontend
   REACT_APP_BACKEND_URL=https://your-backend-domain.com
   ```

2. **CORS Configuration:**

   ```typescript
   app.use(
     cors({
       origin: ["https://your-frontend-domain.com"],
       credentials: true,
     })
   );
   ```

3. **Error Handling:**
   - Implement proper error logging
   - Add rate limiting
   - Monitor API usage

## Next Steps

1. **Get SUI tokens** for the zkLogin address
2. **Test real zkLogin integration** with funded address
3. **Implement proper error handling** and user feedback
4. **Add monitoring and logging** for production use
5. **Optimize gas usage** for cost efficiency
