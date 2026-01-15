# Azoth Protocol

[![Inco Lightning](https://img.shields.io/badge/Inco%20Lightning-TEE-orange)](https://inco.org)
[![Base Sepolia](https://img.shields.io/badge/Base-Sepolia-blue)](https://base.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.30-blue)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)

> Privacy-first DAO with encrypted voting, confidential balances, and zero-signature UX using Inco's Trusted Execution Environment

## Overview

Azoth Protocol implements a complete confidential governance system where all sensitive data remains encrypted throughout the lifecycle. Built with Inco's TEE technology, it ensures privacy for balances, votes, and proposal amounts while maintaining full functionality.

## Architecture

The project consists of three main applications:

### 1. Smart Contracts (`apps/inco-lite-template`)
Hardhat-based Solidity contracts implementing confidential DAO operations:
- **CUSDCMarketplace.sol**: ETH to encrypted cUSDC conversion
- **ConfidentialVault.sol**: ERC-4626 vault with encrypted shares
- **ConfidentialGovernanceToken.sol**: Soulbound governance tokens
- **AzothDAO.sol**: Main governance with encrypted voting

**Key Features:**
- Encrypted storage using `euint256` and `ebool` types
- Homomorphic operations (add, compare) on encrypted data
- ACL-based access control for decryption

### 2. Frontend (`apps/nextjs-template`)
Next.js application providing the user interface:
- Encrypted balance viewing with selective decryption
- Session key pattern for zero-signature UX (93% reduction in signatures)
- Confidential proposal creation and voting
- Multi-wallet support (MetaMask, Privy embedded wallets)

**Tech Stack:** Next.js 16, TypeScript, Wagmi, Privy, Inco SDK 0.7.10

### 3. AI Agent (`apps/express-ts`)
Express.js backend for AI-powered DAO assistance:
- Privacy-preserving proposal analysis using nilAI (TEE-based LLM)
- Encrypted chat history storage with nilDB
- Pay-per-query model via x402 micropayments
- ERC-8004 agent registration

**Tech Stack:** Express, Nillion nilAI/nilDB, x402 payments

## Core Features

- **Encrypted Balances**: All cUSDC, vault shares, and cGOV tokens stored encrypted
- **Private Voting**: Votes and weights remain hidden until proposal finalization
- **Hidden Proposal Amounts**: Prevents MEV and front-running
- **Session Keys**: Sign once, decrypt unlimited times for 1 hour
- **Dual-Token Economy**: Separate economic (cUSDC) and governance (cGOV) tokens

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| CUSDCMarketplace | `0x637076397294eC96A92415Be58ca3e24fE44d529` |
| ConfidentialVault | `0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82` |
| ConfidentialGovernanceToken | `0xdA9B7d018e06f4CE070e708653da7629781A101b` |
| AzothDAO | `0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7` |

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Hardhat (for contracts)

### Installation
```bash
pnpm install
```

### Development
```bash
# Frontend
cd apps/nextjs-template && pnpm dev

# Contracts
cd apps/inco-lite-template && pnpm test

# AI Agent
cd apps/express-ts && pnpm dev
```

## Documentation

- [Smart Contracts Guide](apps/inco-lite-template/README.md)
- [Frontend Integration](apps/nextjs-template/README.md)
- [Inco SDK Usage](apps/nextjs-template/README.md)
- [AI Agent Setup](apps/express-ts/README.md)

## User Flow

1. **Purchase cUSDC**: 0.01 ETH → 20 encrypted cUSDC
2. **Deposit to Vault**: Receive encrypted shares
3. **Join DAO**: Requires vault shares
4. **Mint cGOV**: 0.01 ETH → 10 encrypted governance tokens
5. **Create Proposal**: Encrypted amount + recipient
6. **Vote**: Encrypted weight (cGOV balance)
7. **Enable Session Key**: Sign once for unlimited decryptions
8. **Finalize**: Decrypt tallies with session key
9. **Execute**: 2-day timelock, transfer funds

## Security & Privacy

- All computations happen in Inco's Trusted Execution Environment
- Zero-knowledge proofs for encrypted operations
- Cryptographic attestations for all decryptions
- No plaintext data ever leaves the TEE