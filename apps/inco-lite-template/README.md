# **Azoth DAO - Confidential Governance System**

A fully confidential governance system built on Base Sepolia using Inco's TEE (Trusted Execution Environment) technology. Implements a dual-token architecture that separates economic stake from governance power while maintaining complete privacy.

## 🌟 Key Innovation

**Separation of Economic Stake and Governance Power**

Unlike traditional DAOs where token holdings determine both economic interest and voting power, Azoth DAO separates these concerns:

- **cUSDC (via Vault Shares)**: Economic stake and treasury participation
- **cGOV**: Governance power and voting rights

This design prevents:
- ✅ Free governance (requires ETH payment for cGOV)
- ✅ Governance farming (cGOV minting costs real value)
- ✅ Whale domination (voting power independent of economic stake)
- ✅ Information leakage (all amounts encrypted end-to-end)

## 🏗️ Architecture

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

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| `CUSDCMarketplace.sol` | Sells cUSDC for ETH (2000 cUSDC per ETH) |
| `ConfidentialVault.sol` | ERC-4626 vault with inflation attack protection |
| `ConfidentialGovernanceToken.sol` | Non-transferable (soulbound) governance token |
| `AzothDAO.sol` | Main governance with confidential voting |

## 🚀 Quick Start

### Prerequisites

- Node.js v20+
- pnpm (or npm/yarn)
- Base Sepolia ETH ([Get from faucet](https://www.coinbase.com/faucets/base-sepolia-faucet))
- Docker (for local development)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your private key (NO 0x prefix!)
```

### 3. Run Local Development (Optional)

```bash
docker compose up
```

### 4. Compile Contracts

```bash
pnpm hardhat compile
```

### 5. Run Tests

```bash
# Local anvil node
pnpm hardhat test --network anvil

# Base Sepolia testnet
pnpm hardhat test --network baseSepolia
```

### 6. Deploy to Base Sepolia

```bash
pnpm hardhat ignition deploy ./ignition/modules/AzothDAO.ts --network baseSepolia
```

## 📋 User Workflow

### Step 1: Acquire cUSDC (Economic Stake)
```
User pays ETH → Receives encrypted cUSDC
Exchange Rate: 1 ETH = 2000 cUSDC
```

### Step 2: Deposit into Vault
```
User deposits cUSDC → Receives encrypted vault shares
Inflation protection: δ = 3 (1000x precision)
```

### Step 3: Join DAO
```
Requires vault shares → Grants membership eligibility
```

### Step 4: Mint cGOV (Governance Power)
```
User pays ETH → Receives encrypted cGOV
Default: 0.001 ETH per token
```

### Step 5-10: Governance
```
Create Proposal → Vote (encrypted) → Queue → Execute
All voting weights and tallies remain encrypted
```

## 🔐 Privacy Guarantees

**What is Hidden:**
- All token balances (cUSDC, vault shares, cGOV)
- Proposal funding amounts
- Individual votes and vote weights
- Running vote tallies
- Who voted and how

**What is Public:**
- Proposal descriptions
- Proposal recipients
- Final outcomes (Pass/Fail)
- Membership status

## 🛡️ Security Features

### ERC-4626 Inflation Attack Protection

Based on OpenZeppelin's guidance:
- Virtual offset: δ = 3
- Virtual shares: 1000
- Virtual assets: 1
- Attack cost = 1000× potential gain

### Sybil Resistance

1. **Economic Layer**: ETH payment for cUSDC
2. **Governance Layer**: ETH payment for cGOV
3. **Dual protection**: Both required for full participation

## 📦 Deployment Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| cGOV Mint Price | 0.001 ETH | Cost per governance token |
| Voting Delay | 1 block | Time before voting starts |
| Voting Period | 50,400 blocks | ~1 week voting window |
| Timelock | 172,800 seconds | 2-day execution delay |
| Quorum | 20% (2000 bps) | Minimum participation |
| Approval | 50% (5000 bps) | Minimum approval ratio |

## 📁 Project Structure

```
contracts/
├── CUSDCMarketplace.sol      # Economic stake acquisition
├── ConfidentialVault.sol     # ERC-4626 vault with TEE
├── ConfidentialGovernanceToken.sol  # Soulbound governance token
└── AzothDAO.sol              # Main governance contract

ignition/modules/
└── AzothDAO.ts               # Deployment script

test/
└── AzothDAO.test.ts          # Integration tests

utils/
├── incoHelper.ts             # Inco encryption utilities
└── wallet.ts                 # Wallet configuration
```

## 🔗 Resources

- [Inco Documentation](https://docs.inco.org)
- [OpenZeppelin ERC4626](https://docs.openzeppelin.com/contracts/4.x/erc4626)
- [OpenZeppelin Governance](https://docs.openzeppelin.com/contracts/4.x/governance)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)

## License

MIT
