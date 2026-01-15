# Azoth DAO AI Agent

A privacy-preserving AI assistant specifically designed for confidential DAO governance analysis within the Azoth Protocol ecosystem. This agent provides objective, secure analysis of DAO proposals while maintaining complete privacy of all user interactions and proposal data.

## Project Overview

The Azoth DAO AI Agent serves as an intelligent advisor for members of Azoth DAO, a confidential governance system built on Inco's Trusted Execution Environment (TEE). Unlike traditional AI assistants, this agent operates entirely within privacy-preserving infrastructure, ensuring that:

- **Proposal Analysis**: Users can query about proposal implications without revealing sensitive details
- **Governance Guidance**: Provides objective analysis of voting mechanics, treasury impacts, and governance best practices
- **Privacy-First Design**: All conversations and AI inferences occur within Nillion's TEE network
- **Encrypted History**: Chat sessions are stored encrypted and can only be accessed by the user

## Core Functionality

### DAO Proposal Analysis
The agent specializes in analyzing proposals within the Azoth DAO context:
- **Treasury Impact Assessment**: Evaluates funding requests and their effect on encrypted cUSDC reserves
- **Governance Risk Analysis**: Identifies potential conflicts of interest or governance vulnerabilities
- **Proposal Structure Review**: Suggests improvements to proposal wording and implementation
- **Voting Strategy Guidance**: Explains implications of different voting modes (normal vs quadratic)
- **Ragequit Considerations**: Analyzes exit scenarios and member withdrawal impacts

### Privacy-Preserving Features
- **TEE-Based Inference**: All AI processing happens in Nillion's secure enclaves
- **Encrypted Storage**: Chat history is encrypted using Nillion's SecretVaults
- **Zero-Knowledge Queries**: Users can analyze proposals without disclosing confidential details
- **Session Isolation**: Each conversation is cryptographically separated
- **No Data Leakage**: No plaintext data ever leaves the secure environment

## Architecture

```
src/
├── config/
│   ├── nillion.ts          # nilAI and nilDB configuration
│   └── payment.ts          # x402 micropayment setup
├── services/
│   ├── nilai.service.ts    # TEE-based LLM inference for DAO analysis
│   ├── nildb.service.ts    # Encrypted chat history storage
│   └── erc8004.service.ts  # Agent identity registration
├── routes/
│   ├── chat.routes.ts      # Main chat API endpoints
│   └── a2a.routes.ts       # Agent-to-Agent protocol support
├── scripts/
│   └── setup-collection.ts # nilDB collection initialization
└── types/
    └── index.ts            # TypeScript type definitions
```

## Technology Stack

- **nilAI**: Trusted Execution Environment for private LLM inference
- **nilDB**: Distributed encrypted storage for chat conversations
- **x402**: Micropayment protocol for pay-per-query model
- **ERC-8004**: Decentralized agent identity and registration standard
- **A2A Protocol**: Inter-agent communication and orchestration

## Integration with Azoth DAO

The AI agent is deeply integrated with Azoth DAO's confidential governance system:

### Understanding DAO Mechanics
The agent has comprehensive knowledge of:
- **Dual-Token Architecture**: Separation of cUSDC (economic) and cGOV (governance) tokens
- **Encrypted Operations**: How homomorphic operations work on encrypted balances
- **Voting Privacy**: How votes remain hidden until proposal finalization
- **Session Keys**: Zero-signature UX patterns for decryption
- **Vault Mechanics**: ERC-4626 inspired confidential vault operations

### Proposal Context Awareness
When analyzing proposals, the agent considers:
- **Encrypted Amounts**: Funding requests in cUSDC that remain hidden until execution
- **Member Stakes**: Impact on vault shares and governance participation
- **Timelock Requirements**: 2-day delays for ragequit protection
- **Quadratic Voting**: Alternative voting mechanisms for fair representation

## API Endpoints

### Core Chat Functionality
```
POST /api/chat
```
Main endpoint for DAO proposal analysis with x402 payment verification.

**Request Body:**
```json
{
  "message": "Analyze the treasury impact of this 1000 cUSDC proposal",
  "sessionId": "uuid-v4-session-identifier",
  "userWallet": "0x...",
  "proposalContext": "Optional encrypted proposal details",
  "enableWebSearch": false
}
```

**Response:**
```json
{
  "response": "Analysis of treasury impact...",
  "sessionId": "session-uuid",
  "recordId": "nildb-record-id",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Free Tier Access
```
POST /api/chat/free
```
Same functionality as paid endpoint but without payment requirements for testing.

### Session History
```
GET /api/history/:sessionId
```
Retrieves encrypted chat history for a specific session, decryptable only by the user.

### Agent Metadata
```
GET /agent
```
Returns agent capabilities, pricing information, and privacy guarantees.

## Privacy & Security Implementation

### Trusted Execution Environment
- **nilAI Processing**: All LLM inferences occur within Nillion's TEE
- **Cryptographic Attestation**: Verifiable proof of secure execution
- **No Model Access**: AI models cannot be extracted or compromised

### Encrypted Data Storage
- **nilDB Collections**: Chat history stored in distributed encrypted vaults
- **User-Controlled Keys**: Only users can decrypt their conversation data
- **Session Encryption**: Each session uses unique encryption parameters

### Payment Privacy
- **x402 Micropayments**: Pay-per-query without revealing query content
- **Transaction Privacy**: Payment verification doesn't expose conversation details
- **Wallet Integration**: Seamless connection with DAO member wallets

## Agent-to-Agent Protocol (A2A)

The agent supports A2A protocol for inter-agent communication:
- **Proposal Orchestration**: Coordinate with other agents for complex analysis
- **Data Sharing**: Secure exchange of analysis results between agents
- **Workflow Automation**: Automated proposal review pipelines

## ERC-8004 Registration

The agent registers on the ERC-8004 Identity Registry to establish:
- **Verifiable Identity**: Cryptographically provable agent authenticity
- **Capability Declaration**: Published API endpoints and supported operations
- **Trust Establishment**: Decentralized reputation and capability verification

## Payment Flow

1. **Query Submission**: User sends analysis request with payment intent
2. **x402 Verification**: Payment facilitator confirms micropayment
3. **TEE Inference**: Query processed in nilAI enclave
4. **Encrypted Storage**: Response stored in nilDB with user encryption
5. **Attested Response**: User receives analysis with cryptographic proof

## Future Extensions

The architecture supports expansion into:
- **Multi-Agent Orchestration**: Coordinating multiple specialized AI agents
- **Proposal Simulation**: Running governance simulations in TEE
- **Automated Alerts**: Privacy-preserving notification systems
- **Cross-DAO Analysis**: Comparative governance analysis across protocols
