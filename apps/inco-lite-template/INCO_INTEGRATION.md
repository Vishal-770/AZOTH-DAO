# Inco Protocol Integration - Smart Contracts

> Complete documentation of Inco Lightning Protocol usage in Azoth Protocol smart contracts

---

## 📋 Table of Contents

- [Overview](#overview)
- [Inco Library Import](#inco-library-import)
- [Encrypted Data Types](#encrypted-data-types)
- [Contract-by-Contract Integration](#contract-by-contract-integration)
- [ACL Pattern](#acl-pattern)
- [Common Operations](#common-operations)
- [Gas Costs](#gas-costs)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🌐 Overview

All four smart contracts in Azoth Protocol use **Inco's Lightning Protocol** for TEE-based confidential computing. Data is encrypted on-chain using Inco's encrypted types (`euint256`, `ebool`) and can only be decrypted via attested operations through Inco's covalidator network.

### Why Inco in Smart Contracts?

- **On-Chain Privacy**: Sensitive data encrypted in contract storage
- **Encrypted Arithmetic**: Perform operations on encrypted data without decryption
- **Selective Disclosure**: Only authorized users can decrypt via ACL
- **TEE Security**: Hardware-backed confidentiality guarantees
- **Composability**: Encrypted values can interact across contracts

---

## 📦 Inco Library Import

### Library Version

**Package:** `@inco/lightning` (Hardhat dependency)

### Import Statement

```solidity
import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
```

**Breakdown:**
- `inco`: Core library namespace
- `e`: Extension library for encrypted operations
- `ebool`: Encrypted boolean type
- `euint256`: Encrypted 256-bit unsigned integer type

**Used in All Contracts:**
- `AzothDAO.sol` (Line 4)
- `ConfidentialVault.sol` (Line 4)
- `ConfidentialGovernanceToken.sol` (Line 4)
- `CUSDCMarketplace.sol` (Line 4)

---

## 🔐 Encrypted Data Types

### Available Types

```solidity
// Encrypted integers (various sizes)
euint8, euint16, euint32, euint64, euint128, euint256

// Encrypted boolean
ebool

// Encrypted address
eaddress
```

**In This Project:** We primarily use `euint256` and `ebool`

### Type Conversion

**Plaintext → Encrypted:**
```solidity
using e for uint256;
using e for bool;

euint256 encrypted = uint256(1000).asEuint256();
ebool encryptedBool = true.asEbool();
```

**Encrypted → Plaintext:**
```solidity
// Cannot decrypt directly in Solidity!
// Must use off-chain attestedDecrypt via Inco SDK
// See frontend INCO_INTEGRATION.md
```

---

## 📜 Contract-by-Contract Integration

### 1. CUSDCMarketplace.sol

**File:** `contracts/CUSDCMarketplace.sol`  
**Deployed:** `TBD`

#### Inco Imports

```solidity
import {inco, e, euint256, ebool} from "@inco/lightning/src/Lib.sol";
```

#### Encrypted State Variables

```solidity
using e for euint256;
using e for ebool;
using e for uint256;

mapping(address => euint256) internal _balances;  // Encrypted cUSDC balances
euint256 public totalMinted;                      // Encrypted total supply
```

#### Purchase Function (Encryption)

**Location:** Line 82

```solidity
function purchaseCUSDC() external payable nonReentrant {
    if (msg.value == 0) revert MustSendETH();

    // Calculate cUSDC amount (ETH * EXCHANGE_RATE)
    uint256 cUSDCAmount = (msg.value * EXCHANGE_RATE) / 1e18;

    // Convert plaintext to encrypted
    euint256 encryptedAmount = cUSDCAmount.asEuint256();

    // Update user balance - IMPORTANT: Use local variables
    euint256 newBalance;
    if (euint256.unwrap(_balances[msg.sender]) == bytes32(0)) {
        newBalance = encryptedAmount;
    } else {
        // Encrypted arithmetic: add to existing balance
        newBalance = _balances[msg.sender].add(encryptedAmount);
    }
    _balances[msg.sender] = newBalance;

    // Update total minted
    euint256 newTotalMinted = totalMinted.add(encryptedAmount);
    totalMinted = newTotalMinted;

    // Grant ACL permissions - MUST use local variables
    newBalance.allowThis();      // Contract can read
    newBalance.allow(msg.sender); // User can decrypt
    newTotalMinted.allowThis();   // Contract can read

    emit CUSDCPurchased(msg.sender, msg.value);
}
```

**Why This Works:**
1. User sends ETH (plaintext)
2. Contract calculates cUSDC amount (plaintext)
3. Convert to encrypted: `cUSDCAmount.asEuint256()`
4. Store encrypted value in mapping
5. User can decrypt via frontend (see `apps/nextjs-template/INCO_INTEGRATION.md`)

#### Balance Query

```solidity
function balanceOf(address user) external view returns (euint256) {
    return _balances[user];
}
```

**Returns:** Encrypted handle (bytes32), **NOT** plaintext value

#### Vault Transfer Function

**Location:** Line 124

```solidity
function vaultTransfer(
    address from,
    euint256 amount
) external onlyAuthorizedVault nonReentrant returns (euint256) {
    // Read user's stored balance (avoids ACL issues)
    euint256 userBalance = _balances[from];
    
    // Encrypted subtraction
    euint256 newBalance = userBalance.sub(amount);
    _balances[from] = newBalance;
    
    // ACL grants using local variable
    newBalance.allowThis();
    newBalance.allow(from);
    
    return amount; // Return encrypted amount to vault
}
```

**Key Pattern:** Reads stored balance to avoid ACL issues with passed encrypted values

---

### 2. ConfidentialVault.sol

**File:** `contracts/ConfidentialVault.sol`  
**Deployed:** `TBD`

#### Inco Imports

```solidity
import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
```

#### Encrypted State Variables

```solidity
using e for euint256;
using e for ebool;
using e for uint256;

euint256 private _totalAssets;   // Total cUSDC in vault
euint256 private _totalShares;   // Total shares issued
mapping(address => euint256) public shares; // User share balances
```

#### Deposit Function (Complex Encrypted Arithmetic)

**Location:** Line 127

```solidity
function deposit() external nonReentrant returns (euint256 sharesReceived) {
    // Transfer user's full cUSDC balance from marketplace
    euint256 dummyHandle = uint256(0).asEuint256();
    euint256 actualAssets = cUSDC.vaultTransfer(msg.sender, dummyHandle);

    // Calculate shares using encrypted arithmetic:
    // shares = (assets × 10^δ × totalShares) / totalAssets
    
    // Step 1: Scale assets by decimal offset (1000)
    euint256 assetsScaled = actualAssets.mul(DECIMAL_OFFSET.asEuint256());
    
    // Step 2: Multiply by total shares
    euint256 numerator = assetsScaled.mul(_totalShares);
    
    // Step 3: Divide by total assets
    sharesReceived = numerator.div(_totalAssets);

    // Update vault state - use local variables
    euint256 newTotalAssets = _totalAssets.add(actualAssets);
    euint256 newTotalShares = _totalShares.add(sharesReceived);
    _totalAssets = newTotalAssets;
    _totalShares = newTotalShares;

    // Update user shares
    euint256 newShares;
    if (euint256.unwrap(shares[msg.sender]) == bytes32(0)) {
        newShares = sharesReceived;
    } else {
        newShares = shares[msg.sender].add(sharesReceived);
    }
    shares[msg.sender] = newShares;

    // ACL grants - CRITICAL: Use local variables
    newTotalAssets.allowThis();
    newTotalShares.allowThis();
    newShares.allowThis();
    newShares.allow(msg.sender);

    emit Deposit(msg.sender, block.timestamp);
}
```

**Complex Operations:**
- `mul()`: Encrypted multiplication
- `div()`: Encrypted division
- All intermediate results stay encrypted
- Final shares encrypted until user decrypts

#### Withdraw Function (Encrypted to Plaintext Conversion)

**Location:** Line 184

```solidity
function withdraw() external nonReentrant returns (uint256 assetsReturned) {
    euint256 userShares = shares[msg.sender];
    
    // Calculate assets: (shares × totalAssets) / (totalShares × DECIMAL_OFFSET)
    euint256 numerator = userShares.mul(_totalAssets);
    euint256 denominator = _totalShares.mul(DECIMAL_OFFSET.asEuint256());
    euint256 assetsToReturn = numerator.div(denominator);

    // Update state
    euint256 newTotalAssets = _totalAssets.sub(assetsToReturn);
    euint256 newTotalShares = _totalShares.sub(userShares);
    _totalAssets = newTotalAssets;
    _totalShares = newTotalShares;

    // Clear user shares
    shares[msg.sender] = uint256(0).asEuint256();
    shares[msg.sender].allowThis();

    // ACL grants
    newTotalAssets.allowThis();
    newTotalShares.allowThis();

    // Convert encrypted to plaintext for vault withdrawal
    // Uses .decrypt() - requires special permissions
    assetsReturned = assetsToReturn.decrypt();
    
    // Transfer via marketplace
    cUSDC.vaultWithdraw(msg.sender, assetsToReturn);

    emit Withdraw(msg.sender, block.timestamp);
}
```

**Key Point:** `.decrypt()` only works within contract - users must use `attestedDecrypt` via SDK

#### Has Shares Check (Encrypted Boolean)

**Location:** Line 240

```solidity
function hasShares(address user) external view returns (bool) {
    euint256 userShares = shares[user];
    euint256 zero = uint256(0).asEuint256();
    
    // Encrypted comparison: userShares > 0
    ebool hasSharesBool = userShares.gt(zero);
    
    // Decrypt boolean (special contract permission)
    return hasSharesBool.decrypt();
}
```

**Operations Used:**
- `.gt()`: Greater than (encrypted comparison)
- `.decrypt()`: Contract-only decryption

---

### 3. ConfidentialGovernanceToken.sol (cGOV)

**File:** `contracts/ConfidentialGovernanceToken.sol`  
**Deployed:** `TBD`

#### Inco Imports

```solidity
import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
```

#### Encrypted State Variables

```solidity
using e for euint256;
using e for ebool;
using e for uint256;

mapping(address => euint256) private _balances;        // Encrypted balances
euint256 private _totalSupply;                          // Encrypted total supply
mapping(address => ebool) private _hasVotingPower;      // Encrypted eligibility
mapping(address => bool) public hasHeldToken;           // Public tracking
```

#### Mint Function

**Location:** Line 105

```solidity
function mint(uint256 amount) external payable nonReentrant {
    if (!authorizedDAO.isMember(msg.sender)) revert NotDAOMember();
    
    uint256 requiredETH = amount * mintPrice;
    if (msg.value < requiredETH) revert InsufficientETH();

    // Convert plaintext to encrypted
    euint256 encryptedAmount = amount.asEuint256();

    // Update balance
    euint256 newBalance;
    if (euint256.unwrap(_balances[msg.sender]) == bytes32(0)) {
        newBalance = encryptedAmount;
    } else {
        newBalance = _balances[msg.sender].add(encryptedAmount);
    }
    _balances[msg.sender] = newBalance;

    // Update total supply
    euint256 newTotalSupply = _totalSupply.add(encryptedAmount);
    _totalSupply = newTotalSupply;

    // Set voting power flag (encrypted boolean)
    _hasVotingPower[msg.sender] = true.asEbool();
    hasHeldToken[msg.sender] = true;

    // ACL grants
    newBalance.allowThis();
    newBalance.allow(msg.sender);
    newBalance.allow(address(authorizedDAO)); // DAO can read for voting
    newTotalSupply.allowThis();
    _hasVotingPower[msg.sender].allowThis();

    emit TokensMinted(msg.sender, msg.value);
}
```

**Key ACL Grant:**
```solidity
newBalance.allow(address(authorizedDAO));
```
Allows DAO contract to read balance for vote weight calculation

#### Balance Query

```solidity
function balanceOf(address account) external view returns (euint256) {
    return _balances[account];
}
```

#### Has Voting Power Check

**Location:** Line 172

```solidity
function hasVotingPower(address account) external view returns (bool) {
    if (!hasHeldToken[account]) {
        return false;
    }
    
    euint256 balance = _balances[account];
    euint256 zero = uint256(0).asEuint256();
    
    // Encrypted comparison
    ebool hasPower = balance.gt(zero);
    
    // Decrypt boolean
    return hasPower.decrypt();
}
```

---

### 4. AzothDAO.sol

**File:** `contracts/AzothDAO.sol`  
**Deployed:** `TBD`

#### Inco Imports

```solidity
import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
```

#### Encrypted State Variables

```solidity
using e for euint256;
using e for ebool;
using e for uint256;

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

#### Propose Function

**Location:** Line 272

```solidity
function propose(
    string memory description,
    bytes memory encryptedAmount,  // Client-encrypted via Inco SDK
    address recipient,
    VotingMode votingMode
) external payable onlyMember returns (uint256) {
    if (!cGOV.hasVotingPower(msg.sender)) revert NoVotingPower();
    if (msg.value < fee) revert FeeTooLow();
    if (recipient == address(0)) revert InvalidRecipient();

    proposalCount++;
    uint256 proposalId = proposalCount;
    Proposal storage proposal = proposals[proposalId];

    proposal.id = proposalId;
    proposal.proposer = msg.sender;
    proposal.description = description;
    
    // Rehydrate client-encrypted amount
    proposal.requestedAmount = inco.reencryptFromBytes(encryptedAmount);
    
    proposal.recipient = recipient;
    proposal.startBlock = block.number + votingDelay;
    proposal.endBlock = proposal.startBlock + votingPeriod;
    proposal.state = ProposalState.Pending;
    proposal.votingMode = votingMode;

    // Initialize encrypted vote tallies to zero
    proposal.forVotes = uint256(0).asEuint256();
    proposal.againstVotes = uint256(0).asEuint256();
    proposal.abstainVotes = uint256(0).asEuint256();

    // ACL grants
    proposal.requestedAmount.allowThis();
    proposal.forVotes.allowThis();
    proposal.againstVotes.allowThis();
    proposal.abstainVotes.allowThis();

    emit ProposalCreated(
        proposalId,
        msg.sender,
        description,
        recipient,
        proposal.startBlock,
        proposal.endBlock,
        votingMode
    );

    return proposalId;
}
```

**Key Operation:**
```solidity
proposal.requestedAmount = inco.reencryptFromBytes(encryptedAmount);
```
Takes client-encrypted bytes and converts to contract-usable `euint256`

#### Cast Vote Function (Encrypted Vote Weight)

**Location:** Line 358

```solidity
function castVote(uint256 proposalId, VoteType support) external {
    Proposal storage proposal = proposals[proposalId];
    Receipt storage receipt = receipts[proposalId][msg.sender];
    
    if (proposal.state != ProposalState.Active) revert ProposalNotActive();
    if (block.number < proposal.startBlock) revert VotingNotStarted();
    if (block.number > proposal.endBlock) revert VotingEnded();
    if (receipt.hasVoted) revert AlreadyVoted();
    if (!cGOV.hasVotingPower(msg.sender)) revert NoVotingPower();

    // Get encrypted vote weight (user's cGOV balance)
    euint256 weight = cGOV.balanceOf(msg.sender);
    
    // Store encrypted weight in receipt
    receipt.hasVoted = true;
    receipt.votes = weight;
    receipt.support = support;

    // Add to encrypted tally - NO ONE can see running totals
    if (support == VoteType.For) {
        euint256 newForVotes = proposal.forVotes.add(weight);
        proposal.forVotes = newForVotes;
        newForVotes.allowThis();
    } else if (support == VoteType.Against) {
        euint256 newAgainstVotes = proposal.againstVotes.add(weight);
        proposal.againstVotes = newAgainstVotes;
        newAgainstVotes.allowThis();
    } else {
        euint256 newAbstainVotes = proposal.abstainVotes.add(weight);
        proposal.abstainVotes = newAbstainVotes;
        newAbstainVotes.allowThis();
    }

    emit VoteCast(msg.sender, proposalId, support);
}
```

**Privacy Guarantee:**
- `weight = cGOV.balanceOf(msg.sender)` returns **encrypted** balance
- `.add(weight)` performs **encrypted** addition
- Running tallies (`forVotes`, `againstVotes`, `abstainVotes`) remain **encrypted** during voting
- No one can see interim results until voting ends

#### Reveal Votes Function (ACL Grant)

**Location:** Line 421

```solidity
function revealVotes(uint256 proposalId) external onlyMember {
    Proposal storage proposal = proposals[proposalId];
    
    if (block.number <= proposal.endBlock) revert VotingNotEnded();
    if (proposal.executed || proposal.state == ProposalState.Canceled) {
        revert AlreadyExecutedOrCanceled();
    }

    // Grant ACL access for members to decrypt vote tallies
    proposal.forVotes.allow(msg.sender);
    proposal.againstVotes.allow(msg.sender);
    proposal.abstainVotes.allow(msg.sender);
}
```

**Purpose:** Grants ACL permission for user to decrypt via frontend

**Frontend Decryption Flow:**
1. User calls `revealVotes(proposalId)` on-chain
2. Frontend reads encrypted handles: `const votes = await getVotes(proposalId)`
3. Frontend uses Inco SDK: `await inco.attestedDecrypt(walletClient, votes)`
4. User sees plaintext results

#### Finalize Proposal Function

**Location:** Line 449

```solidity
function finalizeProposal(
    uint256 proposalId,
    uint256 forVotes,       // Plaintext from off-chain decryption
    uint256 againstVotes    // Plaintext from off-chain decryption
) external onlyMember {
    Proposal storage proposal = proposals[proposalId];
    
    if (block.number <= proposal.endBlock) revert VotingNotEnded();
    if (proposal.state != ProposalState.Active && proposal.state != ProposalState.Pending) {
        revert ProposalNotActive();
    }

    // Compare plaintext votes to determine outcome
    if (forVotes > againstVotes) {
        proposal.state = ProposalState.Succeeded;
        emit ProposalSucceeded(proposalId, forVotes, againstVotes);
    } else {
        proposal.state = ProposalState.Defeated;
        emit ProposalDefeated(proposalId, forVotes, againstVotes);
    }
}
```

**Why Plaintext Parameters?**
- Contract cannot decrypt encrypted values for comparison
- Members decrypt off-chain via Inco SDK
- Pass plaintext results to finalize
- Trust model: Members collectively verify results

---

## 🔐 ACL Pattern

### The Critical Rule

**ALWAYS use local variables for ACL operations, NOT storage reads**

#### ❌ WRONG Pattern

```solidity
function updateBalance(address user, uint256 amount) external {
    euint256 encrypted = amount.asEuint256();
    _balances[user] = encrypted;
    
    // ❌ BUG: Storage read creates new handle without ACL
    _balances[user].allow(user);  // FAILS!
}
```

#### ✅ CORRECT Pattern

```solidity
function updateBalance(address user, uint256 amount) external {
    euint256 encrypted = amount.asEuint256();
    
    // Update balance
    _balances[user] = encrypted;
    
    // ✅ Grant ACL using LOCAL variable (not storage read)
    encrypted.allowThis();      // Contract can read
    encrypted.allow(user);      // User can decrypt
}
```

### Why This Matters

**Storage Read Behavior:**
```solidity
euint256 stored = _balances[user];  // Creates NEW reference
stored.allow(user);                 // Grants ACL to NEW handle (not stored one!)
```

**Local Variable Behavior:**
```solidity
euint256 newBalance = oldBalance.add(amount);  // Same reference
_balances[user] = newBalance;                  // Store
newBalance.allow(user);                        // Grants ACL to stored handle ✅
```

### ACL Permissions

**Three Types:**

1. **Contract Self-Read** (for arithmetic):
   ```solidity
   balance.allowThis();
   ```

2. **User Decryption** (via attestedDecrypt):
   ```solidity
   balance.allow(userAddress);
   ```

3. **Cross-Contract Read** (e.g., DAO reading cGOV):
   ```solidity
   balance.allow(daoContractAddress);
   ```

---

## 🛠️ Common Operations

### Arithmetic Operations

```solidity
using e for euint256;

// Addition
euint256 sum = a.add(b);

// Subtraction
euint256 diff = a.sub(b);

// Multiplication
euint256 product = a.mul(b);

// Division
euint256 quotient = a.div(b);
```

### Comparison Operations

```solidity
using e for euint256;

// Greater than
ebool isGreater = a.gt(b);

// Less than
ebool isLess = a.lt(b);

// Equals
ebool isEqual = a.eq(b);

// Greater than or equal
ebool isGTE = a.gte(b);

// Less than or equal
ebool isLTE = a.lte(b);
```

### Conditional Operations

```solidity
using e for euint256;
using e for ebool;

// Select (encrypted if/else)
euint256 result = condition.select(ifTrue, ifFalse);

// Example: max(a, b)
ebool aGreater = a.gt(b);
euint256 max = aGreater.select(a, b);
```

### Decryption (Contract-Only)

```solidity
// Only works inside contract with special permissions
uint256 plaintext = encryptedValue.decrypt();
bool plaintextBool = encryptedBool.decrypt();
```

**Note:** Users cannot call `.decrypt()` - must use `attestedDecrypt` via Inco SDK

---

## ⛽ Gas Costs

### Encrypted Operations

| Operation | Estimated Gas | Comparison to Plaintext |
|-----------|---------------|------------------------|
| `asEuint256()` | ~30K | N/A (conversion) |
| `add()` | ~50K | ~200 (plaintext) |
| `sub()` | ~50K | ~200 (plaintext) |
| `mul()` | ~60K | ~400 (plaintext) |
| `div()` | ~70K | ~800 (plaintext) |
| `gt()` | ~45K | ~100 (plaintext) |
| `eq()` | ~40K | ~100 (plaintext) |
| `allowThis()` | ~25K | N/A |
| `allow(address)` | ~30K | N/A |

### Transaction Examples

| Function | Gas Cost | Breakdown |
|----------|----------|-----------|
| `purchaseCUSDC()` | ~120K | 30K convert + 50K add + 30K ACL |
| `deposit()` | ~200K | 60K mul + 70K div + 50K add + 20K ACL |
| `mint()` | ~100K | 30K convert + 50K add + 20K ACL |
| `castVote()` | ~90K | 50K add + 30K ACL + 10K storage |

---

## 📋 Best Practices

### 1. Always Initialize Encrypted State

```solidity
// ✅ GOOD: Initialize in constructor
constructor() {
    _totalSupply = uint256(0).asEuint256();
    _totalSupply.allowThis();
}

// ❌ BAD: Uninitialized encrypted state
euint256 public totalSupply; // Uninitialized = issues
```

### 2. Check for Zero Handles

```solidity
// Check if encrypted value exists
if (euint256.unwrap(_balances[user]) == bytes32(0)) {
    // First time - initialize
    _balances[user] = amount.asEuint256();
} else {
    // Existing - add to it
    _balances[user] = _balances[user].add(amount);
}
```

### 3. Use Local Variables for Complex Operations

```solidity
// ✅ GOOD: Clear intermediate steps
euint256 scaled = amount.mul(MULTIPLIER.asEuint256());
euint256 result = scaled.div(divisor);
_balances[user] = result;
result.allow(user);

// ❌ BAD: Chained operations (harder to debug)
_balances[user] = amount.mul(MULTIPLIER.asEuint256()).div(divisor);
_balances[user].allow(user); // Wrong! Storage read
```

### 4. Grant ACL Immediately After Update

```solidity
// ✅ GOOD: Grant ACL right after update
euint256 newBalance = oldBalance.add(amount);
_balances[user] = newBalance;
newBalance.allowThis();
newBalance.allow(user);

// ❌ BAD: Delay between update and ACL grant
euint256 newBalance = oldBalance.add(amount);
_balances[user] = newBalance;
// ... more code ...
newBalance.allow(user); // Too late if other operations in between
```

### 5. Document Encrypted vs. Plaintext

```solidity
/// @param amount Encrypted amount (euint256 handle)
/// @return plaintext Plaintext balance (uint256)
function withdraw(euint256 amount) external returns (uint256 plaintext) {
    // Clear parameter types in comments
}
```

---

## 🚨 Troubleshooting

### Issue: "ACL Disallowed" During Decryption

**Cause:** Contract didn't grant ACL permission or used storage read

**Solution:**
```solidity
// ✅ Use local variable
euint256 newBalance = _balances[user].add(amount);
_balances[user] = newBalance;
newBalance.allow(user);
```

### Issue: "Cannot Decrypt in View Function"

**Cause:** `.decrypt()` only works in state-changing functions

**Solution:**
```solidity
// ❌ WRONG
function getBalance(address user) external view returns (uint256) {
    return _balances[user].decrypt(); // Fails!
}

// ✅ CORRECT: Return encrypted handle
function getBalance(address user) external view returns (euint256) {
    return _balances[user]; // User decrypts off-chain
}
```

### Issue: "Division by Zero"

**Cause:** Encrypted division with zero denominator

**Solution:**
```solidity
// Check denominator before division
euint256 zero = uint256(0).asEuint256();
ebool isZero = denominator.eq(zero);

// Revert if zero
require(!isZero.decrypt(), "Division by zero");

euint256 result = numerator.div(denominator);
```

### Issue: "Overflow in Encrypted Arithmetic"

**Cause:** Encrypted arithmetic doesn't revert on overflow (wraps around)

**Solution:**
```solidity
// Manually check before operation
euint256 max = type(uint256).max.asEuint256();
ebool willOverflow = a.gt(max.sub(b));

require(!willOverflow.decrypt(), "Overflow");
euint256 sum = a.add(b);
```

---

## 🔗 Contract Addresses (Base Sepolia)

| Contract | Address | Verified |
|----------|---------|----------|
| **CUSDCMarketplace** | `TBD` | ⏳ |
| **ConfidentialVault** | `TBD` | ⏳ |
| **ConfidentialGovernanceToken** | `TBD` | ⏳ |
| **AzothDAO** | `TBD` | ⏳ |

**Inco Executor:** `TBD` (for fee estimation)  
**Session Verifier:** `0xc34569efc25901bdd6b652164a2c8a7228b23005`

---

## 📚 Additional Resources

- **Inco Official Docs:** https://docs.inco.org/
- **Lightning Protocol:** https://docs.inco.org/lightning
- **Frontend Integration:** `apps/nextjs-template/INCO_INTEGRATION.md`
- **Example Contracts:** https://github.com/Inco-fhevm/inco-contracts

---

**Built with ❤️ using Inco Lightning Protocol Solidity Library**
