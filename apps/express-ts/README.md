# Azoth DAO AI Agent

Privacy-preserving AI assistant for DAO proposal analysis and governance advice.

## Tech Stack

- **nilAI**: TEE-based LLM inference for private AI queries
- **nilDB**: Encrypted distributed storage for chat history
- **x402**: Micropayments for pay-per-query model
- **ERC-8004**: Agent identity registration

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy the `.env` file and update the values if needed:

```env
NILLION_API_KEY=your_nillion_api_key
NILDB_COLLECTION_ID=your_collection_id
PAYMENT_WALLET_ADDRESS=your_wallet_address
X402_PRICE=$0.01
PORT=3001
PRIVATE_KEY=your_private_key
PINATA_JWT=your_pinata_jwt
```

### 3. Setup nilDB Collection (First Time Only)

```bash
pnpm setup-collection
```

This creates an encrypted collection for storing chat history.

### 4. Register Agent on ERC-8004 (Optional)

```bash
pnpm register
```

This registers the agent on the ERC-8004 Identity Registry.

### 5. Start the Server

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Agent Info
```
GET /agent
```
Returns agent capabilities, pricing, and privacy info.

### Chat (Paid - x402)
```
POST /api/chat
{
  "prompt": "Analyze this proposal...",
  "sessionId": "uuid",
  "walletAddress": "0x...",
  "proposalContext": "Optional proposal description",
  "enableWebSearch": false
}
```
Requires x402 payment header.

### Chat (Free - No Payment)
```
POST /api/chat/free
```
Same body as above, no payment required.

### Chat History
```
GET /api/history/:sessionId
```
Returns chat history for a session.

## Architecture

```
src/
├── config/
│   ├── nillion.ts      # nilDB & nilAI configuration
│   └── payment.ts      # x402 payment config
├── services/
│   ├── nilai.service.ts   # AI inference service
│   ├── nildb.service.ts   # Encrypted storage service
│   └── erc8004.service.ts # Agent registration
├── routes/
│   └── chat.routes.ts     # API endpoints
└── server.ts              # Main Express server
```

## Privacy Features

1. **TEE Inference**: All AI queries run in a Trusted Execution Environment
2. **Encrypted Storage**: Chat history is encrypted before storage in nilDB
3. **No Logging**: User queries are not logged or stored outside of nilDB
4. **Session Isolation**: Each session's data is encrypted separately

## Payment Flow

1. User sends chat request with x402 payment header
2. Payment is verified by x402 facilitator
3. If valid, AI inference is executed
4. Response is returned to user

Free endpoints are available for testing without payment.
