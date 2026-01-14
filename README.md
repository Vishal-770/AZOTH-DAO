# Azoth Protocol: Confidential DAO with Inco TEE

[![Inco Lightning](https://img.shields.io/badge/Inco%20Lightning-TEE-orange)](https://inco.org)
[![Base Sepolia](https://img.shields.io/badge/Base-Sepolia-blue)](https://base.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.30-blue)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)

> Privacy-first DAO with encrypted voting, confidential balances, and zero-signature UX using Inco's Trusted Execution Environment

---

## 🎯 What We Built

A complete confidential governance system where:
- **All balances are encrypted** (cUSDC, vault shares, cGOV tokens)
- **Votes remain private** until voting ends (no bandwagon effect)
- **Proposal amounts are hidden** (prevents MEV/front-running)
- **Session keys eliminate signature fatigue** (93% reduction in MetaMask popups)

---

---

## 📚 Documentation

### **Smart Contracts (Solidity + Inco Integration)**
- **[General Overview](apps/inco-lite-template/README-PROJECT.md)** - Contract architecture, deployment, testing
- **[Inco Smart Contract Guide](apps/inco-lite-template/README-INCO.md)** - How we use `euint256`, `ebool`, homomorphic ops, ACL

### **Frontend (Next.js + Inco SDK)**
- **[General Overview](apps/nextjs-template/README-PROJECT.md)** - Frontend architecture, components, wallet integration
- **[Inco SDK Guide](apps/nextjs-template/README-INCO.md)** - Encryption, decryption, session keys, batch operations

---

## 🚀 Deployed Contracts (Base Sepolia)

| Contract | Address | Basescan |
|----------|---------|----------|
| CUSDCMarketplace | `0x637076397294eC96A92415Be58ca3e24fE44d529` | [View](https://sepolia.basescan.org/address/0x637076397294eC96A92415Be58ca3e24fE44d529) |
| ConfidentialVault | `0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82` | [View](https://sepolia.basescan.org/address/0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82) |
| ConfidentialGovernanceToken | `0xdA9B7d018e06f4CE070e708653da7629781A101b` | [View](https://sepolia.basescan.org/address/0xdA9B7d018e06f4CE070e708653da7629781A101b) |
| AzothDAO | `0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7` | [View](https://sepolia.basescan.org/address/0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7) |


## ✨ Core Features

### 1. Encrypted Storage (`euint256`, `ebool`)
```solidity
mapping(address => euint256) private _balances;  // Hidden token balances
euint256 public forVotes;                        // Hidden vote tallies
euint256 public requestedAmount;                 // Hidden proposal amounts
```
All sensitive data stored using Inco's encrypted types.

### 2. Homomorphic Operations
```solidity
euint256 newBalance = oldBalance.add(amount);    // Addition on encrypted values
ebool hasVoted = votes.gt(threshold);            // Comparison without decryption
euint256 total = vote1.add(vote2).add(vote3);    // Accumulation stays encrypted
```
Perform calculations without revealing values.

### 3. Session Key Pattern (Zero-Signature UX)
```typescript
// Sign ONCE
const voucher = await grantSessionKeyVoucher({ expiresAt: oneHourLater });

// Decrypt UNLIMITED times (no more signatures!)
const [balance, votes, shares] = await decryptWithVoucher({ handles, voucher });
```
**Result:** 1 signature → unlimited decryptions for 1 hour

### 4. Dual-Token Architecture
- **cUSDC** (economic) → Purchase with ETH, deposit to vault
- **cGOV** (governance) → Mint with ETH, vote on proposals
- Separation prevents governance farming and whale domination

---

## 📚 Documentation

### **Smart Contracts (Solidity + Inco Integration)**
- **[General Overview](apps/inco-lite-template/README-PROJECT.md)** - Contract architecture, deployment, testing
- **[Inco Smart Contract Guide](apps/inco-lite-template/README-INCO.md)** - How we use `euint256`, `ebool`, homomorphic ops, ACL

### **Frontend (Next.js + Inco SDK)**
- **[General Overview](apps/nextjs-template/README-PROJECT.md)** - Frontend architecture, components, wallet integration
- **[Inco SDK Guide](apps/nextjs-template/README-INCO.md)** - Encryption, decryption, session keys, batch operations

---

## 🔐 How We Use Inco

### Smart Contract Side (`@inco/lightning`)

**1. Encrypted Types**
```solidity
import {euint256, ebool, e, inco} from "@inco/lightning/src/Lib.sol";

euint256 private _totalAssets;     // 256-bit encrypted integer
ebool private _hasVotingPower;     // Encrypted boolean
```

**2. Homomorphic Operations**
```solidity
using e for euint256;

// Add encrypted values (no decryption needed!)
euint256 sum = balance1.add(balance2);

// Compare encrypted values
ebool isGreater = amount.gt(threshold);

// Conditional selection
euint256 result = inco.select(condition, valueIfTrue, valueIfFalse);
```

**3. Access Control (ACL)**
```solidity
// Grant decryption permission
euint256 encrypted = value.asEuint256();
encrypted.allowThis();        // Contract can read
encrypted.allow(userAddress); // User can decrypt off-chain
```

**Example: Encrypted Voting**
```solidity
function castVote(uint256 proposalId, VoteType support) external {
    // Get encrypted voting power
    euint256 votingPower = cGOV.balanceOf(msg.sender);
    
    // Add to encrypted tally (homomorphic addition!)
    if (support == VoteType.For) {
        euint256 newForVotes = proposal.forVotes.add(votingPower);
        proposal.forVotes = newForVotes;
        newForVotes.allowThis();
    }
    
    // Vote weight remains encrypted throughout!
}
```

### Frontend Side (`@inco/js@0.7.10`)

**1. Encryption**
```typescript
import { Lightning } from "@inco/js/lite";

const inco = await Lightning.latest("testnet", 84532);
const encryptedHandle = await inco.encrypt(1000n, {
  accountAddress: userAddress,
  dappAddress: contractAddress,
  handleType: handleTypes.euint256,
});
// Returns: 0x1a2b3c4d... (32-byte handle)
```

**2. Decryption**
```typescript
const results = await inco.attestedDecrypt(
  walletClient,
  [handle1, handle2, handle3]
);
// User signs once, decrypts multiple values
```

**3. Session Keys (Zero-Signature UX)**
```typescript
// Step 1: Create ephemeral keypair
const keypair = generateSecp256k1Keypair();

// Step 2: Grant 1-hour voucher (ONE signature)
const voucher = await inco.grantSessionKeyAllowanceVoucher(
  walletClient,
  ephemeralAddress,
  new Date(Date.now() + 3600000)
);

// Step 3: Decrypt unlimited times (ZERO signatures!)
const results = await inco.attestedDecryptWithVoucher(
  keypair,
  voucher,
  publicClient,
  [handle1, handle2, handle3, ...]
);
```

**Example: Finalize Proposal**
```typescript
// Read encrypted handles from contract
const proposal = await readContract({ functionName: "proposals", args: [proposalId] });

// Decrypt with session key (no new signature!)
const [forVotes, againstVotes, abstainVotes] = await decryptWithVoucher({
  handles: [proposal.forVotes, proposal.againstVotes, proposal.abstainVotes],
  voucher: sessionData.voucher,
  ephemeralKeypair: sessionData.keypair,
});

// Submit attestations on-chain
await writeContract({
  functionName: "finalizeProposal",
  args: [proposalId, forVotes, againstVotes, abstainVotes, signatures],
});
```

---

## 🏗️ Architecture

2. **Decryption Flow (Traditional)**:
   ```
   User Request → Sign EIP-712 Message → Inco Covalidator 
   → TEE Decrypts → Returns Plaintext + Attestation
   ```

3. **Session Key Flow**:
   ```
   User Signs Once → Create Ephemeral Keypair → Grant Voucher 
   → Use Voucher for All Decrypts (No Wallet Signatures)
   ```

### Smart Contracts (4 Contracts)

| Contract | Purpose | Key Inco Features |
|----------|---------|-------------------|
| **CUSDCMarketplace** | Buy cUSDC with ETH | `euint256` balances, homomorphic `.add()` |
| **ConfidentialVault** | ERC-4626 inspired vault | Encrypted shares, `.mul()`, `.div()` operations |
| **ConfidentialGovernanceToken** | Soulbound governance token | Non-transferable, encrypted minting |
| **AzothDAO** | Main governance | Encrypted voting, proposal amounts, tallies |

### Frontend (Next.js)

- **[components/dao/](apps/nextjs-template/components/dao/)** - 5 DAO interaction components
- **[utils/inco.ts](apps/nextjs-template/utils/inco.ts)** - Complete Inco SDK wrapper (600 lines)
- **Session key management** - Persistent storage, auto-renewal

---

## 🔑 Key Implementation Details

### Smart Contract: Encrypted Voting

**File:** [apps/inco-lite-template/contracts/AzothDAO.sol](apps/inco-lite-template/contracts/AzothDAO.sol#L290)

```solidity
function castVote(uint256 proposalId, VoteType support) external payable {
    Proposal storage proposal = proposals[proposalId];
    
    // Get encrypted voting power (cGOV balance)
    euint256 votingPower = cGOV.balanceOf(msg.sender);
    
    // Add to encrypted tally (HOMOMORPHIC!)
    if (support == VoteType.For) {
        euint256 newForVotes = proposal.forVotes.add(votingPower);
        proposal.forVotes = newForVotes;
        newForVotes.allowThis(); // ACL permission
    }
    // Vote weight NEVER decrypted during voting!
}
```

### Frontend: Session Key Decryption

**File:** [apps/nextjs-template/components/dao/Proposals.tsx](apps/nextjs-template/components/dao/Proposals.tsx#L460)

```typescript
// Enable session key (user signs ONCE)
const voucher = await grantSessionKeyVoucher({
  walletClient,
  granteeAddress: ephemeralAddress,
  expiresAt: new Date(Date.now() + 3600000), // 1 hour
});

sessionStorage.setItem("sessionKey", JSON.stringify({ keypair, voucher }));

// Later: Decrypt 10+ proposals (ZERO signatures!)
const results = await decryptWithVoucher({
  ephemeralKeypair: sessionData.keypair,
  voucher: sessionData.voucher,
  handles: [forVotes1, againstVotes1, abstainVotes1, forVotes2, ...],
});
```

---

## 📊 Inco Integration Stats

| Feature | Implementation | Files |
|---------|---------------|-------|
| **Encrypted Types** | `euint256`, `ebool` | 4 contracts |
| **Homomorphic Ops** | `.add()`, `.sub()`, `.mul()`, `.div()`, `.gt()`, `.lt()` | AzothDAO.sol, ConfidentialVault.sol |
| **ACL Management** | `.allow()`, `.allowThis()` | All contracts |
| **Client Encryption** | `inco.encrypt()` | utils/inco.ts:69 |
| **Basic Decryption** | `inco.attestedDecrypt()` | utils/inco.ts:100 |
| **Batch Decryption** | Multiple handles, 1 signature | utils/inco.ts:483 |
| **Session Keys** | `grantSessionKeyAllowanceVoucher()` | utils/inco.ts:331 |
| **Zero-Sig Decrypt** | `attestedDecryptWithVoucher()` | utils/inco.ts:365 |
| **Frontend Components** | 5 DAO components | components/dao/ |

---

## 🎮 User Flow

### Implemented Inco Features

#### 1. **Client-Side Encryption**
**File:** `apps/nextjs-template/utils/inco.ts` (Line 69)

```typescript
export async function encryptValue({
  value,
  address,
  contractAddress,
}: {
  value: bigint;
  address: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<`0x${string}`> {
  const inco = await getConfig();

  const encryptedData = await inco.encrypt(value, {
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,
  });

  return encryptedData as `0x${string}`;
}
```

**Usage in Proposals Component:**
```typescript
// Encrypt proposal amount before submitting
const encryptedAmount = await encryptValue({
  value: parseUnits(amount, 6), // 1000 cUSDC
  address: userAddress,
  contractAddress: AZOTH_DAO_ADDRESS,
});

// Submit encrypted handle on-chain
await walletClient.writeContract({
  functionName: "propose",
  args: [description, encryptedAmount, recipient],
  value: fee, // Inco encryption fee
});
```

#### 2. **Basic Decryption (With Signature)**
**File:** `apps/nextjs-template/utils/inco.ts` (Line 100)

```typescript
export async function decryptValue({
  walletClient,
  handle,
  contractAddress,
}: {
  walletClient: IncoWalletClient;
  handle: string;
  contractAddress?: `0x${string}`;
}): Promise<bigint> {
  const inco = await getConfig();

  const backoffConfig = {
    maxRetries: 10,
    initialDelay: 3000,
    maxDelay: 30000
  };

  const attestedDecrypt = await inco.attestedDecrypt(
    walletClient, 
    [handle as `0x${string}`],
    backoffConfig
  );

  return attestedDecrypt[0].plaintext.value as bigint;
}
```

**What Happens Under the Hood:**
1. User signs EIP-712 message via MetaMask
2. SDK sends signed message + handle to Inco covalidator
3. TEE verifies ACL permissions
4. TEE decrypts inside secure enclave
5. Returns plaintext + cryptographic attestation

#### 3. **Batch Decryption (Multiple Handles, One Signature)**
**File:** `apps/nextjs-template/utils/inco.ts` (Line 490)

```typescript
export async function decryptMultiple({
  walletClient,
  handles,
}: {
  walletClient: IncoWalletClient;
  handles: `0x${string}`[];
}): Promise<Map<`0x${string}`, bigint>> {
  const validHandles = handles.filter(h => h !== ZERO_HANDLE);
  
  const inco = await getConfig();

  const results = await inco.attestedDecrypt(
    walletClient, 
    validHandles,
    backoffConfig
  );

  const decryptedMap = new Map();
  results.forEach((result, index) => {
    decryptedMap.set(validHandles[index], result.plaintext.value as bigint);
  });

  return decryptedMap;
}
```

**Usage in ConfidentialVault Component:**
```typescript
// Get encrypted handles from contract
const sharesHandle = await publicClient.readContract({
  functionName: "shares",
  args: [address],

1. **Purchase cUSDC** (0.01 ETH → 20 cUSDC encrypted)
2. **Deposit to Vault** (20 cUSDC → receive encrypted shares)
3. **Join DAO** (requires vault shares)
4. **Mint cGOV** (0.01 ETH → 10 cGOV encrypted)
5. **Create Proposal** (50 cUSDC encrypted, recipient address)
6. **Cast Vote** (For/Against/Abstain, weight = cGOV balance)
7. **Enable Session Key** (sign once for 1 hour)
8. **Finalize Proposal** (decrypt votes with session key - no signature!)
9. **Queue & Execute** (2-day timelock, transfer funds)

---

## 🔗 Repository Structure

```
azoth-protocol/
├── apps/
│   ├── inco-lite-template/          # Smart Contracts
│   │   ├── contracts/
│   │   │   ├── AzothDAO.sol         # Main governance (846 lines)
│   │   │   ├── ConfidentialVault.sol # ERC-4626 vault (478 lines)
│   │   │   ├── ConfidentialGovernanceToken.sol # cGOV (349 lines)
│   │   │   └── CUSDCMarketplace.sol # Token sale (325 lines)
│   │   ├── test/
│   │   │   └── AzothDAO.test.ts     # Integration tests
│   │   ├── README-PROJECT.md         # 📘 Contract overview
│   │   └── README-INCO.md           # 📗 Inco smart contract guide
│   │
│   └── nextjs-template/              # Frontend
│       ├── app/
│       │   └── dao/page.tsx         # Main DAO UI
│       ├── components/dao/
│       │   ├── CUSDCMarketplace.tsx
│       │   ├── ConfidentialVault.tsx
│       │   ├── CGOVToken.tsx
│       │   ├── DAOMembership.tsx
│       │   └── Proposals.tsx        # Full voting flow
│       ├── utils/
│       │   └── inco.ts              # 600-line Inco wrapper
│       ├── README-PROJECT.md         # 📙 Frontend overview
│       └── README-INCO.md           # 📕 Inco SDK guide
│
└── README.md                         # This file
```

---

## 📖 Documentation Index

### 🎯 Start Here
- **[Main README](README.md)** (this file) - Overview, features, Inco integration summary

### 📘 Smart Contracts
1. **[Contract Overview](apps/inco-lite-template/README-PROJECT.md)** - Architecture, deployment, testing, user workflow
2. **[Inco Smart Contract Guide](apps/inco-lite-template/README-INCO.md)** - `euint256`, homomorphic ops, ACL, code examples

### 📙 Frontend
3. **[Frontend Overview](apps/nextjs-template/README-PROJECT.md)** - Next.js architecture, components, wallet integration
4. **[Inco SDK Guide](apps/nextjs-template/README-INCO.md)** - Encryption, decryption, session keys, batch operations

---

## 🏆 Technical Achievements

### Inco Lightning Protocol Integration

✅ **Encrypted Storage**
- 4 contracts using `euint256` for balances
- 1 contract using `ebool` for conditional logic
- All sensitive data encrypted on-chain

✅ **Homomorphic Operations**
- `.add()` - Vote accumulation, balance updates
- `.sub()` - Withdrawals, share burning
- `.mul()`, `.div()` - Vault share calculations
- `.gt()`, `.lt()`, `.ge()` - Encrypted comparisons

✅ **Access Control Lists (ACL)**
- `.allowThis()` - Contract self-permission
- `.allow(address)` - User decryption permission
- Cross-contract permissions (vault ↔ marketplace)

✅ **Client-Side Encryption**
- All user inputs encrypted before blockchain submission
- Prevents data leakage during transaction broadcast
- MEV protection

✅ **Batch Decryption**
- 10+ handles with 1 signature
- Implemented in all frontend components

✅ **Session Key Pattern**
- 1-hour sessions with zero-signature decryption
- Persistent storage management
- Automatic expiration handling

### DAO Architecture

✅ **Dual-Token Design**
- Economic layer (cUSDC + vault shares)
- Governance layer (cGOV soulbound tokens)
- Prevents governance farming

✅ **Confidential Voting**
- Hidden vote weights during voting period
- Encrypted vote tallies
- Attested decryption for finalization

✅ **ERC-4626 Inspired Vault**
- Virtual offset inflation protection (δ=3)
- Ragequit functionality
- Encrypted share calculations

---



---

## 🛠️ Tech Stack

- **Blockchain**: Base Sepolia (EVM)
- **Confidential Computing**: Inco Lightning Protocol
- **Smart Contracts**: Solidity 0.8.30, Hardhat, OpenZeppelin
- **Frontend**: Next.js 16.1, TypeScript 5.9, Privy, Wagmi, Viem
- **TEE**: Trusted Execution Environment (Inco covalidators)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

---

**Built for hackathons 🚀 | Powered by Inco TEE 🔐**

    uint256 cUSDCAmount = (msg.value * EXCHANGE_RATE) / 1e18;
    euint256 encryptedAmount = cUSDCAmount.asEuint256();

    // Update balance with local variable
    euint256 newBalance;
    if (euint256.unwrap(_balances[msg.sender]) == bytes32(0)) {
        newBalance = encryptedAmount;
    } else {
        newBalance = _balances[msg.sender].add(encryptedAmount);
    }
    _balances[msg.sender] = newBalance;

    // ACL grants using local variable
    newBalance.allowThis();      // Contract can do math
    newBalance.allow(msg.sender); // User can decrypt
}
```

#### 7. **Fee Estimation**
**File:** `apps/nextjs-template/utils/inco.ts` (Line 217)

```typescript
export async function getFee(): Promise<bigint> {
  const inco = await getConfig();

  const fee = await publicClient.readContract({
    address: inco.executorAddress,
    abi: [
      {
        type: "function",
        inputs: [],
        name: "getFee",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "pure",
      },
    ],
    functionName: "getFee",
  });

  return fee; // Typically ~0.001 ETH
}
```

**Usage:**
```typescript
const fee = await getFee();

await walletClient.writeContract({
  functionName: "propose",
  args: [description, encryptedAmount, recipient],
  value: fee, // Must send fee with encrypted operations
});
```

---

## 📂 Project Structure

```
azoth-protocol/
├── apps/
│   ├── inco-lite-template/          # Smart Contracts
│   │   ├── contracts/
│   │   │   ├── AzothDAO.sol         # Main DAO contract (846 lines)
│   │   │   ├── ConfidentialVault.sol # Vault contract (478 lines)
│   │   │   ├── ConfidentialGovernanceToken.sol # cGOV token (349 lines)
│   │   │   └── CUSDCMarketplace.sol # Marketplace contract (325 lines)
│   │   ├── hardhat.config.ts
│   │   ├── test/
│   │   │   └── AzothDAO.test.ts
│   │   └── utils/
│   │       └── incoHelper.ts
│   │
│   └── nextjs-template/             # Frontend Application
│       ├── app/
│       │   ├── dao/                 # DAO pages
│       │   ├── agent/               # AI integration
│       │   └── test/                # Testing page
│       ├── components/
│       │   └── dao/
│       │       ├── ConfidentialVault.tsx    # Vault UI (460 lines)
│       │       ├── Proposals.tsx            # Governance UI (800+ lines)
│       │       ├── CUSDCMarketplace.tsx     # Token purchase UI
│       │       └── Membership.tsx           # DAO membership UI
│       ├── utils/
│       │   ├── inco.ts              # Inco SDK wrapper (598 lines)
│       │   └── constants.ts         # Contract addresses & ABIs
│       └── package.json
│
├── docs/
│   └── inco-llms.txt                # Inco protocol documentation (3200+ lines)
├── packages/
│   ├── typescript-config/
│   └── ui/
├── turbo.json
└── README.md
```

---

## 📜 Smart Contracts

### 1. AzothDAO.sol
**Location:** `apps/inco-lite-template/contracts/AzothDAO.sol`  
**Lines:** 846  
**Purpose:** Main DAO governance contract

**Key Encrypted State:**
```solidity
struct Proposal {
    uint256 id;
    address proposer;
    string description;
    euint256 requestedAmount;  // Encrypted cUSDC request
    address recipient;
    uint256 startBlock;
    uint256 endBlock;
    uint256 queuedTime;
    euint256 forVotes;         // Encrypted vote tally
    euint256 againstVotes;     // Encrypted vote tally
    euint256 abstainVotes;     // Encrypted vote tally
    ProposalState state;
    VotingMode votingMode;
    bool executed;
}

struct Receipt {
    bool hasVoted;
    euint256 votes;  // Encrypted vote weight
    VoteType support;
}
```

**Core Functions:**
```solidity
// Membership
function joinDAO() external;
function leaveDAO() external;

// Proposals
function propose(
    string memory description,
    bytes memory encryptedAmount, // Client-encrypted handle
    address recipient,
    VotingMode votingMode
) external payable returns (uint256);

// Voting
function castVote(uint256 proposalId, VoteType support) external;

// Reveal & Finalize
function revealVotes(uint256 proposalId) external;
function finalizeProposal(
    uint256 proposalId,
    uint256 forVotes,      // Plaintext from decryption
    uint256 againstVotes   // Plaintext from decryption
) external;

// Execution
function queueProposal(uint256 proposalId) external;
function executeProposal(uint256 proposalId) external;
```

**Governance Parameters:**
```solidity
uint256 public votingDelay;    // Blocks before voting starts
uint256 public votingPeriod;   // Blocks for voting duration
uint256 public timelockPeriod; // Seconds before execution
uint256 public quorumBps;      // Minimum participation (basis points)
uint256 public approvalBps;    // Minimum approval ratio (basis points)
```

### 2. ConfidentialVault.sol
**Location:** `apps/inco-lite-template/contracts/ConfidentialVault.sol`  
**Lines:** 478  
**Purpose:** ERC-4626-inspired encrypted vault for cUSDC

**Inflation Attack Protection:**
```solidity
uint256 private constant OFFSET = 3;
uint256 private constant DECIMAL_OFFSET = 10 ** OFFSET; // 1000
uint256 private constant VIRTUAL_SHARES = DECIMAL_OFFSET; // 1000
uint256 private constant VIRTUAL_ASSETS = 1;
```

**Encrypted State:**
```solidity
euint256 private _totalAssets;  // Encrypted TVL
euint256 private _totalShares;  // Encrypted total shares
mapping(address => euint256) public shares; // Encrypted user shares
```

**Core Functions:**
```solidity
function deposit() external nonReentrant returns (euint256 sharesReceived);
function withdraw() external nonReentrant returns (uint256 assetsReturned);
function ragequit() external nonReentrant;
function balanceOf(address user) external view returns (euint256);
function hasShares(address user) external view returns (bool);
```

**Share Calculation Formula:**
```solidity
// shares = (assets × 10^δ × totalShares) / totalAssets
euint256 assetsScaled = actualAssets.mul(DECIMAL_OFFSET.asEuint256());
euint256 numerator = assetsScaled.mul(_totalShares);
sharesReceived = numerator.div(_totalAssets);
```

### 3. ConfidentialGovernanceToken.sol (cGOV)
**Location:** `apps/inco-lite-template/contracts/ConfidentialGovernanceToken.sol`  
**Lines:** 349  
**Purpose:** Non-transferable encrypted governance token

**Encrypted State:**
```solidity
mapping(address => euint256) private _balances;  // Encrypted cGOV balances
euint256 private _totalSupply;                    // Encrypted total supply
mapping(address => ebool) private _hasVotingPower; // Encrypted eligibility
```

**Core Functions:**
```solidity
function mint(uint256 amount) external payable;
function burnAll() external;
function balanceOf(address account) external view returns (euint256);
function hasVotingPower(address account) external view returns (bool);
function hasHeldToken(address account) external view returns (bool);
```

**Mint Pricing:**
```solidity
uint256 public mintPrice = 0.001 ether; // ETH cost per cGOV
```

### 4. CUSDCMarketplace.sol
**Location:** `apps/inco-lite-template/contracts/CUSDCMarketplace.sol`  
**Lines:** 325  
**Purpose:** Mock marketplace for buying encrypted cUSDC

**Exchange Rate:**
```solidity
uint256 public constant EXCHANGE_RATE = 2000 * 1e6; // 2000 cUSDC per ETH
```

**Encrypted State:**
```solidity
mapping(address => euint256) internal _balances;
euint256 public totalMinted;
```

**Core Functions:**
```solidity
function purchaseCUSDC() external payable nonReentrant;
function balanceOf(address user) external view returns (euint256);
function vaultTransfer(address from, euint256 amount) external;
function vaultWithdraw(address to, euint256 amount) external;
```

---

## 🎨 Frontend Implementation

### Component Architecture

#### 1. ConfidentialVault Component
**Location:** `apps/nextjs-template/components/dao/ConfidentialVault.tsx`  
**Lines:** 460

**State Management:**
```typescript
const [shares, setShares] = useState<string | null>(null);
const [cUSDCBalance, setCUSDCBalance] = useState<string | null>(null);

// Session key state
const [sessionData, setSessionData] = useState<{
  keypair: ReturnType<typeof generateSecp256k1Keypair>;
  voucher: SessionKeyVoucher;
  expiresAt: Date;
} | null>(null);

const isSessionValid = useMemo(() => {
  if (!sessionData) return false;
  return new Date() < sessionData.expiresAt;
}, [sessionData]);
```

**Key Functions:**
```typescript
// Create 1-hour session (user signs once)
const handleCreateSession = async () => {
  const ephemeralKeypair = generateSecp256k1Keypair();
  const ephemeralAccount = privateKeyToAccount(
    `0x${ephemeralKeypair.kp.getPrivate('hex')}`
  );
  const expiresAt = new Date(Date.now() + 3600000);
  
  const voucher = await inco.grantSessionKeyAllowanceVoucher(
    walletClient,
    ephemeralAccount.address,
    expiresAt,
    DEFAULT_SESSION_VERIFIER
  );

  setSessionData({ keypair: ephemeralKeypair, voucher, expiresAt });
};

// Reveal 2 balances with zero signatures (using session)
const handleGetBalances = async () => {
  // Get encrypted handles from contract
  const sharesHandle = await publicClient.readContract({
    functionName: "shares",
    args: [address],
  });

  const balanceHandle = await publicClient.readContract({
    functionName: "balanceOf",
    args: [address],
  });

  // Batch decrypt with session key (NO SIGNATURE)
  const results = await inco.attestedDecryptWithVoucher(
    sessionData.keypair,
    sessionData.voucher,
    publicClient,
    [sharesHandle as `0x${string}`, balanceHandle as `0x${string}`]
  );

  setShares(formatUnits(results[0].plaintext.value as bigint, 18));
  setCUSDCBalance(formatUnits(results[1].plaintext.value as bigint, 6));
};
```

**UI Features:**
- Session status indicator (active/expired)
- One-click session creation
- Revoke button for active sessions
- Info box explaining benefits

#### 2. Proposals Component
**Location:** `apps/nextjs-template/components/dao/Proposals.tsx`  
**Lines:** 800+

**State Management:**
```typescript
const [proposals, setProposals] = useState<Proposal[]>([]);
const [voteResults, setVoteResults] = useState<Record<number, VoteResults>>({});

// Session key state
const [sessionData, setSessionData] = useState<{
  keypair: ReturnType<typeof generateSecp256k1Keypair>;
  voucher: SessionKeyVoucher;
  expiresAt: Date;
} | null>(null);
```

**Key Functions:**
```typescript
// Create proposal with encrypted amount
const handleCreateProposal = async () => {
  const amountBigInt = parseUnits(amount, 6); // cUSDC has 6 decimals
  
  // Encrypt amount client-side
  const encryptedAmount = await encryptValue({
    value: amountBigInt,
    address,
    contractAddress: AZOTH_DAO_ADDRESS,
  });

  // Submit with Inco fee
  const fee = await getFee();
  const hash = await walletClient.writeContract({
    address: AZOTH_DAO_ADDRESS,
    functionName: "propose",
    args: [description, encryptedAmount, recipient, votingMode],
    value: fee,
  });
};

// Reveal 3 vote tallies with session key (zero signatures)
const handleRevealVotes = async (proposalId: number) => {
  // Step 1: Grant ACL access on-chain
  const hash = await walletClient.writeContract({
    functionName: "revealVotes",
    args: [BigInt(proposalId)],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  // Step 2: Get 3 vote handles
  const votes = await publicClient.readContract({
    functionName: "getVotes",
    args: [BigInt(proposalId)],
  });
  const [forHandle, againstHandle, abstainHandle] = votes;

  // Step 3: Batch decrypt with session key (NO SIGNATURE)
  const results = await inco.attestedDecryptWithVoucher(
    sessionData.keypair,
    sessionData.voucher,
    publicClient,
    [forHandle, againstHandle, abstainHandle]
  );

  // Extract values
  const forVotes = formatUnits(results[0].plaintext.value as bigint, 18);
  const againstVotes = formatUnits(results[1].plaintext.value as bigint, 18);
  const abstainVotes = formatUnits(results[2].plaintext.value as bigint, 18);

  setVoteResults(prev => ({
    ...prev,
    [proposalId]: { forVotes, againstVotes, abstainVotes }
  }));
};

// Finalize proposal outcome
const handleFinalizeProposal = async (proposalId: number) => {
  const results = voteResults[proposalId];
  const forVotesWei = parseUnits(results.forVotes, 18);
  const againstVotesWei = parseUnits(results.againstVotes, 18);

  await walletClient.writeContract({
    functionName: "finalizeProposal",
    args: [BigInt(proposalId), forVotesWei, againstVotesWei],
  });
};
```

**UI Features:**
- Proposal creation form with AI integration
- Real-time proposal status (Pending, Active, Succeeded, Defeated, etc.)
- Voting buttons (For, Against, Abstain)
- Session status indicator
- Vote reveal button with dynamic text based on session
- Finalize button after vote reveal

#### 3. Utils/Inco.ts - SDK Wrapper
**Location:** `apps/nextjs-template/utils/inco.ts`  
**Lines:** 598

**Complete Inco SDK Abstraction:**
```typescript
// Configuration
export async function getConfig() { ... }

// Encryption
export async function encryptValue({ value, address, contractAddress }) { ... }

// Basic Decryption
export async function decryptValue({ walletClient, handle }) { ... }

// Batch Decryption
export async function decryptMultiple({ walletClient, handles }) { ... }

// Session Key Pattern
export async function grantSessionKeyVoucher({ walletClient, granteeAddress, expiresAt }) { ... }
export async function decryptWithVoucher({ ephemeralKeypair, voucher, publicClient, handles }) { ... }

// Attested Compute
export async function attestedCompute({ walletClient, lhsHandle, op, rhsPlaintext }) { ... }

// Fee Estimation
export async function getFee() { ... }

// Error Handling
// - ACL disallowed detection
// - Exponential backoff retry
// - Zero handle filtering
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **pnpm** or npm
- **MetaMask** or compatible Web3 wallet
- **Base Sepolia testnet** ETH ([Faucet](https://www.alchemy.com/faucets/base-sepolia))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/azoth-protocol.git
   cd azoth-protocol
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   pnpm install

   # Or use npm
   npm install
   ```

3. **Set up environment variables:**

   Create `.env.local` in `apps/nextjs-template/`:
   ```env
   # Wallet
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
   
   # Network
   NEXT_PUBLIC_CHAIN_ID=84532
   NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
   
   # Contracts (update after deployment)
   NEXT_PUBLIC_CUSDC_MARKETPLACE=0x...
   NEXT_PUBLIC_CONFIDENTIAL_VAULT=0x...
   NEXT_PUBLIC_CGOV_TOKEN=0x...
   NEXT_PUBLIC_AZOTH_DAO=0x...
   ```

### Running the Frontend

```bash
# Navigate to Next.js app
cd apps/nextjs-template

# Start development server
pnpm dev

# Or with npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploying Smart Contracts

```bash
# Navigate to contracts folder
cd apps/inco-lite-template

# Compile contracts
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia

# Run tests
npx hardhat test
```

---

## 📖 Usage Guide

### 1. **Join the DAO**

1. Navigate to **Membership** tab
2. Purchase cUSDC tokens (minimum 1000 cUSDC)
3. Deposit cUSDC into Confidential Vault → Receive encrypted shares
4. Click **"Join DAO"** (requires vault shares)

### 2. **Mint Governance Tokens**

1. Navigate to **cGOV Token** tab
2. Enter amount to mint (costs 0.001 ETH per cGOV)
3. Click **"Mint cGOV"**
4. Confirm transaction

### 3. **Create a Proposal**

1. Navigate to **Proposals** tab
2. Click **"+ New Proposal"**
3. Fill in:
   - Description (e.g., "Fund marketing campaign")
   - Recipient address
   - Requested cUSDC amount (encrypted automatically)
   - Voting mode (Normal or Quadratic)
4. Click **"Create Proposal"**
5. Confirm transaction + Inco fee (~0.001 ETH)

### 4. **Vote on Proposals**

1. Find active proposal
2. Click **For**, **Against**, or **Abstain**
3. Confirm transaction
4. Your vote weight (cGOV balance) is **encrypted** - no one can see

### 5. **Reveal Vote Results** (After Voting Ends)

**Option A: Without Session Key (Multiple Signatures)**
1. Click **"Reveal Vote Results"**
2. Sign 3 MetaMask popups (one per vote tally)

**Option B: With Session Key (Zero Signatures)**
1. Click **"Reveal Vote Results (Create Session)"**
2. Sign **once** to create 1-hour session
3. All subsequent reveals require **zero signatures**
4. Repeat for multiple proposals seamlessly

### 6. **Finalize Proposal Outcome**

1. After revealing votes, click **"Finalize Proposal Outcome"**
2. Contract compares forVotes vs. againstVotes
3. State updates to **Succeeded** or **Defeated**

### 7. **Execute Proposal** (If Succeeded)

1. Click **"Queue for Execution"**
2. Wait for timelock period (configured in contract)
3. Click **"Execute Proposal"**
4. cUSDC transferred to recipient from vault

---

## 🔬 Advanced Features

### Session Key Pattern Deep Dive

**Security Guarantees:**
- Ephemeral keypair never leaves browser memory
- Session expires automatically after 1 hour
- User can revoke manually at any time
- Covalidator verifies voucher signature on each request

**Technical Details:**
```typescript
// Voucher structure (EIP-712 signed message)
{
  domain: {
    name: "Inco Lightning",
    version: "1",
    chainId: 84532,
    verifyingContract: "0xc34569efc25901bdd6b652164a2c8a7228b23005",
  },
  types: {
    AllowanceVoucher: [
      { name: "granter", type: "address" },
      { name: "grantee", type: "address" },
      { name: "expiresAt", type: "uint256" },
    ],
  },
  message: {
    granter: "0xUser...",
    grantee: "0xEphemeral...",
    expiresAt: 1736796000, // Unix timestamp
  },
}
```

**Covalidator Verification Flow:**
```
1. Frontend sends decrypt request with:
   - Ephemeral keypair signature
   - Voucher (contains user's signature)
   - Handles to decrypt

2. Covalidator calls session verifier contract:
   - Verifies user signature on voucher
   - Checks grantee address matches ephemeral key
   - Validates expiration timestamp

3. If valid:
   - TEE decrypts handles
   - Returns plaintext + attestation

4. If invalid:
   - Returns error (session expired / invalid signature)
```

### ACL Permission Model

**Three-Tier Access Control:**

1. **Contract Self-Read** (for arithmetic):
   ```solidity
   balance.allowThis();
   ```

2. **User Decryption** (via attestedDecrypt):
   ```solidity
   balance.allow(userAddress);
   ```

3. **Cross-Contract Read** (vault reading marketplace):
   ```solidity
   balance.allow(vaultContractAddress);
   ```

**Critical Pattern - Local Variable Rule:**
```solidity
// ❌ WRONG - Storage read creates new handle without ACL
_balances[user].allow(user); // Fails!

// ✅ CORRECT - Use local variable
euint256 newBalance = _balances[user].add(amount);
_balances[user] = newBalance;
newBalance.allow(user); // Works!
```

### Error Handling

**ACL Disallowed:**
```typescript
try {
  const decrypted = await decryptValue({ walletClient, handle });
} catch (error) {
  if (error.message.includes("acl disallowed")) {
    console.error("User doesn't have permission to decrypt this handle");
    // Possible causes:
    // 1. User hasn't interacted with contract yet
    // 2. Contract forgot to call .allow(user)
    // 3. Wrong handle or wrong user
  }
}
```

**Covalidator Timeout:**
```typescript
const backoffConfig = {
  maxRetries: 10,           // Try 10 times
  initialDelay: 3000,       // Wait 3s first time
  maxDelay: 30000,          // Cap at 30s
};

// Exponential backoff: 3s → 6s → 12s → 24s → 30s (capped)
const results = await inco.attestedDecrypt(walletClient, handles, backoffConfig);
```

---

## 🔐 Security Considerations

### Trust Assumptions

1. ✅ **Inco Covalidators** are honest (run TEE enclaves)
2. ✅ **Intel SGX / AMD SEV** hardware security guarantees
3. ✅ **Attestation signatures** prove computation happened in TEE
4. ❌ **Smart contract** cannot decrypt (only stores handles)
5. ❌ **Frontend** cannot decrypt without user permission (ACL)

### Attack Resistance

- **MEV Protection**: Searchers can't see encrypted proposal amounts
- **Front-running Protection**: Transaction ordering doesn't reveal votes
- **Whale Hiding**: Large holders' cGOV balances are encrypted
- **Vote Manipulation**: Running tallies hidden until voting ends
- **Inflation Attacks**: Virtual offset (δ=3) provides 1000x share precision

### Privacy Guarantees

| **Data** | **Visibility** |
|----------|----------------|
| Individual votes | ✅ Encrypted (only voter knows) |
| Vote weights | ✅ Encrypted (cGOV balances hidden) |
| Running tallies | ✅ Encrypted during voting |
| Final results | ❌ Revealed after voting ends |
| Proposal amounts | ✅ Encrypted until execution |
| User balances | ✅ Encrypted (selective decryption) |

---

## 🌐 Deployed Contracts

**Network:** Base Sepolia (Chain ID: 84532)  
**RPC URL:** https://sepolia.base.org  
**Explorer:** https://sepolia.basescan.org  
**Deployed:** January 12, 2026

| Contract | Address | Verified |
|----------|---------|----------|
| **CUSDCMarketplace** | `0x637076397294eC96A92415Be58ca3e24fE44d529` | ✅ |
| **ConfidentialVault** | `0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82` | ✅ |
| **ConfidentialGovernanceToken** | `0xdA9B7d018e06f4CE070e708653da7629781A101b` | ✅ |
| **AzothDAO** | `0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7` | ✅ |

**Default Session Verifier:** `0xc34569efc25901bdd6b652164a2c8a7228b23005`

---

## 🙏 Acknowledgments

- **[Inco Network](https://www.inco.org/)** for Lightning Protocol and TEE infrastructure
- **Inco Documentation** for comprehensive SDK examples and best practices
- **Base** for L2 infrastructure and testnet support
- **Privy** for seamless wallet authentication
- **OpenZeppelin** for ERC-4626 inflation attack protection patterns

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 📞 Support

- **Documentation:** [docs/inco-llms.txt](docs/inco-llms.txt)
- **Inco Docs:** https://docs.inco.org/
- **Issues:** GitHub Issues
- **Discord:** [Inco Community](https://discord.gg/inco)

---

**Built with ❤️ using Inco's Lightning Protocol**
