# Azoth DAO - Confidential Governance System

A fully confidential governance system built on Base Sepolia using Inco's Trusted Execution Environment (TEE) technology. Implements a dual-token architecture that separates economic stake from governance power while maintaining complete privacy of all financial operations and voting decisions.

## Project Overview

Azoth DAO represents a fundamental innovation in decentralized governance by implementing privacy-preserving mechanisms that prevent information leakage while maintaining full functionality. Unlike traditional DAOs where token holdings create both economic incentives and governance power, Azoth DAO separates these concerns through encrypted dual-token economics.

The system ensures that:
- **Economic participation** (cUSDC deposits) is separate from **governance power** (cGOV tokens)
- **All balances and transactions** remain encrypted throughout their lifecycle
- **Voting decisions** are completely private until final tally revelation
- **Proposal funding amounts** are hidden to prevent MEV and front-running
- **Membership stakes** cannot be exploited for governance farming

## Core Innovation: Dual-Token Architecture

### Economic Layer (cUSDC + Vault)
The economic layer provides treasury participation and exit rights:
- **cUSDC Acquisition**: Members purchase encrypted cUSDC tokens with ETH
- **Vault Deposits**: cUSDC is deposited into an ERC-4626 compatible vault
- **Share Issuance**: Members receive encrypted vault shares representing their stake
- **Ragequit Mechanism**: Members can withdraw their proportional share at any time
- **Inflation Protection**: Virtual offset (δ=3) prevents share dilution attacks

### Governance Layer (cGOV)
The governance layer provides voting rights independent of economic stake:
- **cGOV Minting**: Members pay ETH to mint encrypted governance tokens
- **Soulbound Design**: cGOV tokens are non-transferable (ERC-5484 compliant)
- **Voting Power**: Each cGOV token provides one vote (quadratic voting supported)
- **Separate Economics**: Governance power costs real value, preventing free participation

### Why This Matters
Traditional DAOs suffer from:
- **Free Governance**: Anyone can participate without economic stake
- **Whale Domination**: Large holders control both economics and governance
- **Governance Farming**: Members acquire voting power without real commitment
- **Information Leakage**: Transaction amounts reveal strategic information

Azoth DAO solves these through cryptographic separation and encryption.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AZOTH DAO SYSTEM                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  cUSDC Market    │         │  cGOV Token      │     │
│  │  (Economic)      │         │  (Governance)    │     │
│  └────────┬─────────┘         └────────┬─────────┘     │
│           │                             │               │
│           ▼                             ▼               │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  Vault (ERC4626) │◄────────┤   DAO Contract   │     │
│  │  • Inflation prot│         │   • Proposals    │     │
│  │  • Ragequit      │         │   • Voting       │     │
│  └──────────────────┘         │   • Execution    │     │
│                                └──────────────────┘     │
│  ┌────────────────────────────────────────────────┐    │
│  │         Inco TEE Layer (Privacy)               │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Smart Contract Ecosystem

### CUSDCMarketplace.sol
**Purpose**: Economic entry point for DAO participation
- **Token Economics**: 1 ETH = 2000 cUSDC (encrypted)
- **Encrypted Balances**: All cUSDC holdings stored as `euint256`
- **Access Control**: Balances grant vault deposit permissions
- **Inco Integration**: Uses `TFHE.asEuint256()` for encryption

### ConfidentialVault.sol
**Purpose**: ERC-4626 compatible vault with privacy preservation
- **Deposit Mechanism**: Accepts encrypted cUSDC, issues encrypted shares
- **Inflation Protection**: Virtual shares/assets prevent manipulation
- **Ragequit Functionality**: Proportional withdrawal with auto-DAO exit
- **Homomorphic Operations**: Share calculations use encrypted arithmetic
- **Access Control**: Only vault members can participate in governance

### ConfidentialGovernanceToken.sol
**Purpose**: Soulbound governance tokens for voting rights
- **Minting Process**: 0.001 ETH per cGOV token (configurable)
- **Non-Transferable**: ERC-5484 soulbound implementation
- **Encrypted Balances**: Voting power stored as `euint256`
- **Membership Verification**: Requires vault shares for minting
- **DAO Integration**: Grants voting permissions in AzothDAO

### AzothDAO.sol
**Purpose**: Main governance contract with confidential voting
- **Proposal Creation**: Encrypted funding amounts and descriptions
- **Voting System**: Supports normal and quadratic voting modes
- **Encrypted Tallies**: Vote weights and running totals remain hidden
- **Timelock Execution**: 2-day delay for ragequit protection
- **Finalization**: Batch decryption reveals outcomes
- **Access Control**: Only cGOV holders can vote

## Privacy Implementation

### Inco TEE Integration
All sensitive operations occur within Inco's Trusted Execution Environment:
- **Encrypted Types**: `euint256`, `ebool` for confidential data
- **Homomorphic Operations**: Addition, comparison on encrypted values
- **Access Control Lists**: Granular permission for decryption
- **Cryptographic Attestation**: Verifiable proof of secure computation

### What Remains Private
- **Token Balances**: cUSDC, vault shares, cGOV holdings
- **Transaction Amounts**: All financial transfers
- **Voting Decisions**: Individual votes and weights
- **Proposal Funding**: Requested treasury amounts
- **Membership Stakes**: Economic participation levels

### What is Public
- **Proposal Metadata**: Descriptions, recipients, deadlines
- **Governance Parameters**: Voting periods, quorum requirements
- **Final Outcomes**: Pass/fail results after decryption
- **Contract Addresses**: All deployed contracts are public

## Security Architecture

### ERC-4626 Inflation Attack Protection
Implements OpenZeppelin recommended protections:
- **Virtual Offset**: δ = 3 (1000x precision multiplier)
- **Virtual Shares**: 1000 initial shares prevent zero-share attacks
- **Virtual Assets**: 1 initial asset prevents donation attacks
- **Attack Cost**: Manipulation requires 1000x the potential gain

### Sybil Resistance Mechanisms
Multi-layered protection against fake participation:
- **Economic Barrier**: ETH payment for cUSDC acquisition
- **Governance Barrier**: Additional ETH payment for cGOV minting
- **Vault Requirement**: Must deposit economic stake to join
- **Soulbound Tokens**: Prevents governance token trading

### Governance Attack Vectors Mitigated
- **Free Participation**: Economic stake required
- **Whale Manipulation**: Separated economic and governance power
- **Vote Buying**: Encrypted votes prevent verification
- **Front-Running**: Hidden proposal amounts
- **Exit Scams**: Ragequit mechanism for fair withdrawal

## Governance Mechanics

### Proposal Lifecycle
1. **Creation**: Member submits proposal with encrypted funding amount
2. **Voting Delay**: 1 block waiting period
3. **Voting Period**: 50,400 blocks (~1 week) for participation
4. **Queue**: Successful proposals enter 2-day timelock
5. **Execution**: Treasury transfer after timelock expires

### Voting System
- **Normal Voting**: 1 vote per cGOV token
- **Quadratic Voting**: Square root weighting for fair representation
- **Encrypted Weights**: Individual voting power remains hidden
- **Running Tallies**: Intermediate results stay encrypted
- **Final Revelation**: Only outcome revealed after voting ends

### Treasury Management
- **Encrypted Reserves**: cUSDC treasury balance hidden
- **Proportional Distribution**: Ragequit withdrawals based on share percentage
- **Timelock Protection**: 2-day delay prevents flash loan attacks
- **Emergency Exit**: Members can leave with fair share at any time

## Integration with Azoth Protocol

### Frontend Integration
The contracts are designed for seamless integration with the Next.js frontend:
- **Session Key Support**: Zero-signature decryption patterns
- **Batch Operations**: Multiple encrypted value handling
- **Wallet Compatibility**: MetaMask, Privy, and external wallet support
- **Real-time Updates**: Event-driven UI state management

### AI Agent Integration
The Express.js AI agent provides governance assistance:
- **Proposal Analysis**: Objective evaluation without data leakage
- **Privacy Preservation**: Queries processed in TEE
- **Context Awareness**: Understanding of Azoth DAO mechanics
- **Encrypted History**: Chat storage in nilDB

## Technical Specifications

### Deployment Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| cGOV Mint Price | 0.001 ETH | Cost per governance token |
| Voting Delay | 1 block | Time before voting starts |
| Voting Period | 50,400 blocks | ~1 week voting window |
| Timelock | 172,800 seconds | 2-day execution delay |
| Quorum | 20% (2000 bps) | Minimum participation |
| Approval | 50% (5000 bps) | Minimum approval ratio |

### Gas Optimization
- **Efficient Encryption**: Minimal gas overhead for TEE operations
- **Batch Processing**: Multiple operations in single transactions
- **Storage Optimization**: Packed encrypted data structures
- **Event Emission**: Comprehensive logging for frontend integration

## Future Extensions

The architecture supports advanced governance features:
- **Delegate Voting**: Encrypted proxy voting mechanisms
- **Proposal Templates**: Standardized proposal formats
- **Multi-Sig Integration**: Encrypted multi-signature execution
- **Cross-Chain Governance**: Interoperability with other chains
- **Automated Execution**: Smart contract-based proposal implementation

## Project Structure

```
contracts/
├── CUSDCMarketplace.sol          # Economic entry point
├── ConfidentialVault.sol         # ERC-4626 vault implementation
├── ConfidentialGovernanceToken.sol # Soulbound governance tokens
└── AzothDAO.sol                  # Main governance logic

ignition/modules/
└── AzothDAO.ts                   # Deployment orchestration

test/
└── AzothDAO.test.ts              # Comprehensive test suite

utils/
├── incoHelper.ts                 # Inco SDK utilities
└── wallet.ts                     # Wallet configuration helpers
```

This confidential governance system represents a new paradigm for DAO design, where privacy and security are fundamental rather than afterthoughts, enabling truly decentralized decision-making without compromising participant confidentiality.
