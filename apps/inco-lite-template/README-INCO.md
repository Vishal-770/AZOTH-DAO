# Inco Lightning Protocol - Smart Contract Integration

> How we use Inco's encrypted types (`euint256`, `ebool`) in 4 Solidity contracts

---

## 🎯 What We Built

### Package

```json
{
  "dependencies": {
    "@inco/lightning": "latest"
  }
}
```

### Contract Integration

- ✅ **180 lines** in CUSDCMarketplace (encrypted balances)
- ✅ **220 lines** in ConfidentialVault (encrypted shares, δ=3 protection)
- ✅ **150 lines** in ConfidentialGovernanceToken (encrypted cGOV, non-transferable)
- ✅ **470 lines** in AzothDAO (encrypted votes, homomorphic tallying)

**Total Inco Operations**: ~40+ TFHE calls across 4 contracts

---

## 🔐 Core Inco Features

### 1. Encrypted Types

```solidity
import {euint256, ebool} from "@inco/lightning/src/Lib.sol";
import {TFHE} from "@inco/lightning/src/TFHE.sol";

contract Example {
    mapping(address => euint256) private _balances;  // Encrypted integers
    ebool private _hasVoted;                          // Encrypted boolean
}
```

### 2. Homomorphic Operations

```solidity
// Addition (encrypted + encrypted = encrypted)
euint256 newBalance = TFHE.add(_balances[user], amount);

// Subtraction
euint256 remaining = TFHE.sub(total, spent);

// Multiplication
euint256 product = TFHE.mul(price, quantity);

// Division
euint256 quotient = TFHE.div(numerator, denominator);

// Comparison (returns ebool)
ebool isGreater = TFHE.gt(balance1, balance2);

// Conditional selection
euint256 result = TFHE.select(isGreater, balance1, balance2);
```

---

## 📖 Real Contract Examples

### 1. CUSDCMarketplace.sol - Encrypted Balances

```solidity
import {TFHE, euint256} from "@inco/lightning/src/TFHE.sol";

contract CUSDCMarketplace {
    mapping(address => euint256) internal _balances;  // ⭐ Encrypted storage
    euint256 public totalMinted;
    
    // Purchase cUSDC with ETH
    function purchaseCUSDC() external payable {
        uint256 cUSDCAmount = (msg.value * 2000 * 1e6) / 1e18;
        
        // Convert plaintext → encrypted
        euint256 encryptedAmount = TFHE.asEuint256(cUSDCAmount);
        
        // Add to encrypted balance (homomorphic operation!)
        _balances[msg.sender] = TFHE.add(_balances[msg.sender], encryptedAmount);
        totalMinted = TFHE.add(totalMinted, encryptedAmount);
        
        // Grant ACL: user can decrypt their own balance
        TFHE.allow(_balances[msg.sender], msg.sender);
    }
    
    // View encrypted balance (returns encrypted handle)
    function balanceOf(address user) external view returns (euint256) {
        return _balances[user];
    }
}
```

**Key Points**:
- All balances stored as `euint256` (encrypted 256-bit integers)
- `.add()` performs homomorphic addition (result stays encrypted)
- `TFHE.allow()` grants decryption permission via ACL

---

### 2. ConfidentialVault.sol - Encrypted Shares

```solidity
contract ConfidentialVault {
    mapping(address => euint256) private _shares;
    euint256 public totalShares;
    euint256 public totalAssets;
    
    // Constants for δ=3 inflation protection
    uint256 private constant VIRTUAL_SHARES = 1000;
    uint256 private constant VIRTUAL_ASSETS = 1;
    
    // Deposit cUSDC → receive encrypted shares
    function deposit(euint256 amount) external returns (euint256 sharesIssued) {
        // Formula: shares = (amount × (totalShares + VIRTUAL_SHARES)) / (totalAssets + VIRTUAL_ASSETS)
        
        euint256 numerator = TFHE.mul(
            amount,
            TFHE.add(totalShares, TFHE.asEuint256(VIRTUAL_SHARES))
        );
        
        euint256 denominator = TFHE.add(totalAssets, TFHE.asEuint256(VIRTUAL_ASSETS));
        
        sharesIssued = TFHE.div(numerator, denominator);
        
        // Update encrypted state
        _shares[msg.sender] = TFHE.add(_shares[msg.sender], sharesIssued);
        totalShares = TFHE.add(totalShares, sharesIssued);
        totalAssets = TFHE.add(totalAssets, amount);
        
        // Grant ACL
        TFHE.allow(_shares[msg.sender], msg.sender);
        TFHE.allow(sharesIssued, msg.sender);
        
        return sharesIssued;
    }
}
```

**Key Points**:
- ERC-4626 inspired with δ=3 offset for inflation attack protection
- All share calculations use homomorphic operations
- Result stays encrypted throughout

---

### 3. AzothDAO.sol - Encrypted Voting

```solidity
struct Proposal {
    address proposer;
    string description;
    euint256 requestedAmount;     // ⭐ Encrypted funding amount
    address recipient;
    uint256 startBlock;
    uint256 endBlock;
    euint256 forVotes;            // ⭐ Encrypted vote tally
    euint256 againstVotes;        // ⭐ Encrypted vote tally
    euint256 abstainVotes;        // ⭐ Encrypted vote tally
    ProposalState state;
    VotingMode votingMode;
}

// Cast vote with encrypted weight
function castVote(uint256 proposalId, VoteType support) external payable {
    Proposal storage prop = proposals[proposalId];
    
    // Voting power = encrypted cGOV balance
    euint256 votingPower = govToken.balanceOf(msg.sender);
    
    // Homomorphic addition to encrypted tally
    if (support == VoteType.For) {
        prop.forVotes = TFHE.add(prop.forVotes, votingPower);
    } else if (support == VoteType.Against) {
        prop.againstVotes = TFHE.add(prop.againstVotes, votingPower);
    } else {
        prop.abstainVotes = TFHE.add(prop.abstainVotes, votingPower);
    }
    
    // Grant ACL: allow future decryption
    TFHE.allow(prop.forVotes, address(this));
}
```

**Key Points**:
- Vote weights encrypted (cGOV balance = `euint256`)
- Vote tallies encrypted throughout voting period
- Only decrypted during finalization with TEE attestations

---

## 🔐 Access Control (ACL)

### Granting Permissions

```solidity
// Allow specific address to decrypt
TFHE.allow(encryptedBalance, userAddress);

// Allow contract itself
TFHE.allow(encryptedBalance, address(this));

// Allow multiple addresses
TFHE.allow(encryptedBalance, user1);
TFHE.allow(encryptedBalance, user2);
```

### ACL in Practice

```solidity
contract Vault {
    mapping(address => euint256) private _shares;
    
    function deposit(euint256 amount) external returns (euint256 shares) {
        shares = calculateShares(amount);
        _shares[msg.sender] = TFHE.add(_shares[msg.sender], shares);
        
        // Grant ACL permissions
        TFHE.allow(_shares[msg.sender], msg.sender);      // User can decrypt
        TFHE.allow(_shares[msg.sender], address(dao));    // DAO can read
        TFHE.allow(shares, msg.sender);                   // Return value
        
        return shares;
    }
}
```

---

## ⚠️ Important Patterns

### 1. Conditional Operations with `TFHE.select()`

```solidity
// Check if balance > threshold
ebool hasEnough = TFHE.gt(userBalance, TFHE.asEuint256(1000));

// Select value based on condition
euint256 result = TFHE.select(
    hasEnough,
    TFHE.asEuint256(100),   // if true
    TFHE.asEuint256(0)       // if false
);
```

### 2. Encrypted Comparisons for Access Control

```solidity
// Check if user has shares (encrypted comparison)
ebool hasSharesEncrypted = TFHE.gt(_shares[user], TFHE.asEuint256(0));

// Convert to plaintext bool (reveals info!)
bool hasShares = TFHE.decrypt(hasSharesEncrypted);
require(hasShares, "No shares");
```

⚠️ **Warning**: Decrypting values on-chain reveals information!

### 3. Optimization: Boolean Flags vs Encrypted Booleans

```solidity
// ❌ Gas-expensive: encrypted boolean
mapping(address => ebool) private _hasVoted;

// ✅ Gas-efficient: plaintext boolean (if privacy not critical)
mapping(address => bool) private _hasVoted;
```

---

## 📊 Operations Summary

| Operation | Function | Example |
|-----------|----------|---------|
| Add | `TFHE.add(a, b)` | `euint256 sum = TFHE.add(x, y)` |
| Subtract | `TFHE.sub(a, b)` | `euint256 diff = TFHE.sub(x, y)` |
| Multiply | `TFHE.mul(a, b)` | `euint256 product = TFHE.mul(x, y)` |
| Divide | `TFHE.div(a, b)` | `euint256 quotient = TFHE.div(x, y)` |
| Greater | `TFHE.gt(a, b)` | `ebool isGreater = TFHE.gt(x, y)` |
| Less | `TFHE.lt(a, b)` | `ebool isLess = TFHE.lt(x, y)` |
| Equal | `TFHE.eq(a, b)` | `ebool isEqual = TFHE.eq(x, y)` |
| Select | `TFHE.select(cond, a, b)` | `euint256 val = TFHE.select(c, x, y)` |
| Convert | `TFHE.asEuint256(n)` | `euint256 enc = TFHE.asEuint256(100)` |
| Allow | `TFHE.allow(enc, addr)` | `TFHE.allow(balance, user)` |

---

## 🔗 Contract Addresses

All 4 contracts deployed on **Base Sepolia testnet** (Chain ID: 84532):

```solidity
// Deployed January 12, 2026
CUSDCMarketplace:           0x637076397294eC96A92415Be58ca3e24fE44d529
ConfidentialVault:          0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82
ConfidentialGovernanceToken: 0xdA9B7d018e06f4CE070e708653da7629781A101b
AzothDAO:                   0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7
```

**Verify on Base Sepolia:**
- [CUSDCMarketplace](https://sepolia.basescan.org/address/0x637076397294eC96A92415Be58ca3e24fE44d529)
- [ConfidentialVault](https://sepolia.basescan.org/address/0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82)
- [ConfidentialGovernanceToken](https://sepolia.basescan.org/address/0xdA9B7d018e06f4CE070e708653da7629781A101b)
- [AzothDAO](https://sepolia.basescan.org/address/0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7)

---

**For frontend Inco SDK integration, see [../nextjs-template/README-INCO.md](../nextjs-template/README-INCO.md)**
    function purchaseCUSDC() external payable {
        require(msg.value > 0, "Must send ETH");

        // Calculate cUSDC amount (plaintext calculation is OK here)
        uint256 cUSDCAmount = (msg.value * EXCHANGE_RATE) / 1e18;

        // Convert to encrypted
        euint256 encryptedAmount = cUSDCAmount.asEuint256();

        // Update user balance (IMPORTANT: Use local variable pattern!)
        euint256 newBalance;
        if (euint256.unwrap(_balances[msg.sender]) == bytes32(0)) {
            // First time user
            newBalance = encryptedAmount;
        } else {
            // Add to existing balance (HOMOMORPHIC ADDITION!)
            newBalance = _balances[msg.sender].add(encryptedAmount);
        }
        _balances[msg.sender] = newBalance;

        // Update total supply (HOMOMORPHIC ADDITION!)
        euint256 newTotalMinted = totalMinted.add(encryptedAmount);
        totalMinted = newTotalMinted;

        // Grant access permissions - MUST use local variables!
        newBalance.allowThis();           // Contract can read
        newBalance.allow(msg.sender);     // User can decrypt
        newTotalMinted.allowThis();       // Contract can read total
    }

    /**
     * @notice View encrypted balance
     * @dev Returns encrypted handle, user must decrypt off-chain
     */
    function balanceOf(address user) external view returns (euint256) {
        return _balances[user];
    }
}
```

**Key Patterns:**
1. ✅ Use local variables for new encrypted values
2. ✅ Grant ACL permissions with `.allow()` and `.allowThis()`
3. ✅ Check for zero handle before operations
4. ✅ Use homomorphic `.add()` instead of plaintext addition

---

### Example 2: ConfidentialVault.sol

**File:** [`contracts/ConfidentialVault.sol`](contracts/ConfidentialVault.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {inco, e, euint256, ebool} from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ConfidentialVault is Ownable {
    using e for euint256;
    using e for ebool;
    using e for uint256;

    // ============ Constants ============
    // Virtual offset for inflation attack protection (δ = 3)
    uint256 private constant OFFSET = 3;
    uint256 private constant DECIMAL_OFFSET = 10 ** OFFSET; // 1000
    uint256 private constant VIRTUAL_SHARES = DECIMAL_OFFSET; // 1000
    uint256 private constant VIRTUAL_ASSETS = 1;

    // ============ State Variables ============
    ICUSDCMarketplace public immutable cUSDC;
    
    // Encrypted total assets in vault
    euint256 private _totalAssets;
    
    // Encrypted total shares issued
    euint256 private _totalShares;
    
    // Encrypted per-user shares
    mapping(address => euint256) public shares;
    
    // Boolean optimization: hasShares (cheaper than checking encrypted balance)
    mapping(address => bool) public hasShares;

    // ============ Constructor ============
    constructor(address _cUSDC) Ownable(msg.sender) {
        require(_cUSDC != address(0), "Invalid cUSDC");
        cUSDC = ICUSDCMarketplace(_cUSDC);

        // Initialize with virtual amounts (inflation protection)
        _totalAssets = uint256(VIRTUAL_ASSETS).asEuint256();
        _totalShares = uint256(VIRTUAL_SHARES).asEuint256();
        
        _totalAssets.allowThis();
        _totalShares.allowThis();
    }

    // ============ Core Functions ============

    /**
     * @notice Deposit cUSDC and receive vault shares
     * @param amount Encrypted cUSDC amount to deposit
     * @return sharesIssued Encrypted shares received
     */
    function deposit(euint256 amount) external returns (euint256 sharesIssued) {
        // Transfer cUSDC from user to vault (through marketplace)
        euint256 received = cUSDC.vaultTransfer(msg.sender, amount);

        // Calculate shares: (amount × totalShares) / totalAssets
        // This uses homomorphic operations!
        euint256 sharesToIssue = received.mul(_totalShares).div(_totalAssets);

        // Update user shares
        euint256 newUserShares;
        if (euint256.unwrap(shares[msg.sender]) == bytes32(0)) {
            newUserShares = sharesToIssue;
        } else {
            newUserShares = shares[msg.sender].add(sharesToIssue);
        }
        shares[msg.sender] = newUserShares;

        // Update totals
        euint256 newTotalAssets = _totalAssets.add(received);
        euint256 newTotalShares = _totalShares.add(sharesToIssue);
        
        _totalAssets = newTotalAssets;
        _totalShares = newTotalShares;

        // Mark that user has shares (boolean for gas efficiency)
        hasShares[msg.sender] = true;

        // Grant ACL permissions
        newUserShares.allowThis();
        newUserShares.allow(msg.sender);
        newTotalAssets.allowThis();
        newTotalShares.allowThis();

        emit Deposit(msg.sender, block.timestamp);
        return sharesToIssue;
    }

    /**
     * @notice Withdraw cUSDC by burning shares
     * @param sharesAmount Encrypted shares to burn
     * @return assetsReturned Encrypted cUSDC returned
     */
    function withdraw(euint256 sharesAmount) external returns (euint256 assetsReturned) {
        // Check user has shares (encrypted comparison)
        ebool hasSufficientShares = shares[msg.sender].ge(sharesAmount);
        require(hasSufficientShares.decrypt(), "Insufficient shares");

        // Calculate assets: (shares × totalAssets) / totalShares
        euint256 assetsToReturn = sharesAmount.mul(_totalAssets).div(_totalShares);

        // Update user shares (encrypted subtraction)
        euint256 newUserShares = shares[msg.sender].sub(sharesAmount);
        shares[msg.sender] = newUserShares;

        // Update totals
        euint256 newTotalAssets = _totalAssets.sub(assetsToReturn);
        euint256 newTotalShares = _totalShares.sub(sharesAmount);
        
        _totalAssets = newTotalAssets;
        _totalShares = newTotalShares;

        // Check if user has any shares left
        ebool hasRemainingShares = newUserShares.gt(uint256(0).asEuint256());
        hasShares[msg.sender] = hasRemainingShares.decrypt();

        // Transfer cUSDC back to user
        cUSDC.vaultWithdraw(msg.sender, assetsToReturn);

        // Grant ACL permissions
        newUserShares.allowThis();
        newUserShares.allow(msg.sender);
        newTotalAssets.allowThis();
        newTotalShares.allowThis();

        emit Withdraw(msg.sender, block.timestamp);
        return assetsToReturn;
    }

    /**
     * @notice View encrypted share balance
     * @dev User must decrypt off-chain using Inco SDK
     */
    function balanceOf(address user) external view returns (euint256) {
        return shares[user];
    }
}
```

**Advanced Patterns:**
1. ✅ Virtual offsets for inflation protection
2. ✅ Homomorphic arithmetic (mul, div, add, sub)
3. ✅ Encrypted comparisons (ge, gt)
4. ✅ Boolean optimization for gas savings (`hasShares`)
5. ✅ Decrypting encrypted booleans for require statements

---

### Example 3: AzothDAO.sol (Encrypted Voting)

**File:** [`contracts/AzothDAO.sol`](contracts/AzothDAO.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AzothDAO is Ownable {
    using e for euint256;
    using e for ebool;
    using e for uint256;

    // ============ Structs ============
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        euint256 requestedAmount;  // ENCRYPTED!
        address recipient;
        uint256 startBlock;
        uint256 endBlock;
        euint256 forVotes;         // ENCRYPTED!
        euint256 againstVotes;     // ENCRYPTED!
        euint256 abstainVotes;     // ENCRYPTED!
        ProposalState state;
        bool executed;
    }

    struct Receipt {
        bool hasVoted;
        euint256 votes;            // ENCRYPTED vote weight!
        VoteType support;
    }

    enum ProposalState { Pending, Active, Defeated, Succeeded, Queued, Executed }
    enum VoteType { Against, For, Abstain }

    // ============ State Variables ============
    IConfidentialGovernanceToken public immutable cGOV;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;

    // ============ Core Functions ============

    /**
     * @notice Create a proposal with encrypted funding amount
     * @param description Proposal description (public)
     * @param requestedAmount ENCRYPTED cUSDC amount
     * @param recipient Address to receive funds (public)
     */
    function propose(
        string calldata description,
        euint256 requestedAmount,
        address recipient,
        VotingMode votingMode
    ) external payable returns (uint256) {
        require(isMember[msg.sender], "Not a member");
        require(recipient != address(0), "Invalid recipient");

        uint256 proposalId = ++proposalCount;
        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        // Initialize encrypted vote tallies to zero
        euint256 zeroVotes = uint256(0).asEuint256();
        zeroVotes.allowThis();

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: description,
            requestedAmount: requestedAmount,  // ENCRYPTED!
            recipient: recipient,
            startBlock: startBlock,
            endBlock: endBlock,
            forVotes: zeroVotes,               // ENCRYPTED!
            againstVotes: zeroVotes,           // ENCRYPTED!
            abstainVotes: zeroVotes,           // ENCRYPTED!
            state: ProposalState.Pending,
            votingMode: votingMode,
            executed: false
        });

        emit ProposalCreated(proposalId, msg.sender, description, recipient, startBlock, endBlock);
        return proposalId;
    }

    /**
     * @notice Cast vote with encrypted weight
     * @dev Vote weight = cGOV balance (encrypted)
     */
    function castVote(
        uint256 proposalId,
        VoteType support
    ) external payable {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Active, "Voting not active");
        require(!receipts[proposalId][msg.sender].hasVoted, "Already voted");

        // Get voter's cGOV balance (ENCRYPTED!)
        euint256 votingPower = cGOV.balanceOf(msg.sender);

        // Record vote
        receipts[proposalId][msg.sender] = Receipt({
            hasVoted: true,
            votes: votingPower,
            support: support
        });

        // Update vote tallies (HOMOMORPHIC ADDITION!)
        if (support == VoteType.For) {
            euint256 newForVotes = proposal.forVotes.add(votingPower);
            proposal.forVotes = newForVotes;
            newForVotes.allowThis();
        } else if (support == VoteType.Against) {
            euint256 newAgainstVotes = proposal.againstVotes.add(votingPower);
            proposal.againstVotes = newAgainstVotes;
            newAgainstVotes.allowThis();
        } else {
            euint256 newAbstainVotes = proposal.abstainVotes.add(votingPower);
            proposal.abstainVotes = newAbstainVotes;
            newAbstainVotes.allowThis();
        }

        emit VoteCast(msg.sender, proposalId, support);
    }

    /**
     * @notice Finalize proposal by submitting decrypted vote attestations
     * @dev This is called after off-chain decryption via Inco SDK
     * @param proposalId Proposal to finalize
     * @param forVotesPlaintext Decrypted for votes
     * @param againstVotesPlaintext Decrypted against votes
     * @param abstainVotesPlaintext Decrypted abstain votes
     * @param covalidatorSignatures TEE attestation signatures
     */
    function finalizeProposal(
        uint256 proposalId,
        uint256 forVotesPlaintext,
        uint256 againstVotesPlaintext,
        uint256 abstainVotesPlaintext,
        bytes[] calldata covalidatorSignatures
    ) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.number > proposal.endBlock, "Voting not ended");
        require(proposal.state == ProposalState.Active, "Already finalized");

        // Verify attestations (Inco TEE verifies decryption is correct)
        // ... (attestation verification logic) ...

        // Calculate quorum and approval
        uint256 totalVotes = forVotesPlaintext + againstVotesPlaintext + abstainVotesPlaintext;
        uint256 totalSupply = 1000e18; // Example: get from cGOV.totalSupply()
        
        bool quorumMet = (totalVotes * 10000) >= (totalSupply * quorumBps);
        bool approved = (forVotesPlaintext * 10000) >= ((forVotesPlaintext + againstVotesPlaintext) * approvalBps);

        if (quorumMet && approved) {
            proposal.state = ProposalState.Succeeded;
            emit ProposalSucceeded(proposalId, forVotesPlaintext, againstVotesPlaintext);
        } else {
            proposal.state = ProposalState.Defeated;
            emit ProposalDefeated(proposalId, forVotesPlaintext, againstVotesPlaintext);
        }
    }
}
```

**Voting Privacy Patterns:**
1. ✅ Encrypted vote weights (`euint256 votingPower`)
2. ✅ Encrypted vote tallies (`forVotes`, `againstVotes`)
3. ✅ Homomorphic vote accumulation (`.add()`)
4. ✅ Off-chain decryption with attestations
5. ✅ Reveal results only after voting ends

---

## 🔒 Access Control (ACL)

### Granting Permissions

```solidity
euint256 balance = uint256(100).asEuint256();

// Grant permission to contract itself
balance.allowThis();

// Grant permission to specific address
balance.allow(userAddress);

// Grant permission to multiple addresses
address[] memory authorized = [user1, user2, user3];
for (uint i = 0; i < authorized.length; i++) {
    balance.allow(authorized[i]);
}
```

### Revoking Permissions

```solidity
// Revoke permission from address
inco.revoke(balance, userAddress);

// Note: Cannot revoke contract's own permission
```

### Best Practices

1. **Always grant to contract first:**
   ```solidity
   euint256 value = amount.asEuint256();
   value.allowThis();  // ← MUST DO THIS!
   ```

2. **Grant to user for decryption:**
   ```solidity
   value.allow(msg.sender);  // User can decrypt off-chain
   ```

3. **Use local variables:**
   ```solidity
   // ❌ BAD: Granting permission to storage variable
   _balance = _balance.add(amount);
   _balance.allowThis();  // May not work!
   
   // ✅ GOOD: Use local variable
   euint256 newBalance = _balance.add(amount);
   _balance = newBalance;
   newBalance.allowThis();  // Works!
   ```

---

## 🧪 Testing with Inco

### Test File Setup

**File:** [`test/AzothDAO.test.ts`](test/AzothDAO.test.ts)

```typescript
import { expect } from "chai";
import hre from "hardhat";
import { encryptValue, decryptValue, getFee } from "../utils/incoHelper";

describe("AzothDAO Tests", function () {
  let cUSDC: any, vault: any, cGOV: any, dao: any;
  let owner: any, alice: any, bob: any;

  before(async function () {
    [owner, alice, bob] = await hre.ethers.getSigners();

    // Deploy contracts
    const CUSDCFactory = await hre.ethers.getContractFactory("CUSDCMarketplace");
    cUSDC = await CUSDCFactory.deploy();
    // ... deploy other contracts
  });

  it("Should purchase cUSDC and get encrypted balance", async function () {
    // Purchase cUSDC with ETH
    await cUSDC.connect(alice).purchaseCUSDC({
      value: hre.ethers.parseEther("0.01"), // 0.01 ETH
    });

    // Read encrypted balance handle
    const encryptedBalance = await cUSDC.balanceOf(alice.address);
    console.log("Encrypted balance handle:", encryptedBalance);

    // Decrypt balance off-chain
    const walletClient = // ... create viem wallet client
    const decryptedBalance = await decryptValue({
      walletClient,
      handle: encryptedBalance,
    });

    console.log("Decrypted balance:", decryptedBalance.toString());
    expect(decryptedBalance).to.equal(20_000_000n); // 20 cUSDC (6 decimals)
  });

  it("Should create proposal with encrypted amount", async function () {
    // Encrypt funding amount client-side
    const fundingAmount = 50_000_000n; // 50 cUSDC
    const encryptedAmount = await encryptValue({
      value: fundingAmount,
      address: alice.address,
      contractAddress: dao.target,
    });

    // Get Inco fee
    const fee = await getFee();

    // Create proposal
    const tx = await dao.connect(alice).propose(
      "Fund development",
      encryptedAmount,
      bob.address,
      0, // Normal voting
      { value: fee }
    );

    await tx.wait();
    console.log("Proposal created with encrypted amount");
  });
});
```

### Deployment Script

**File:** [`ignition/modules/AzothDAO.ts`](ignition/modules/AzothDAO.ts)

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AzothDAO", (m) => {
  // Deploy cUSDC Marketplace
  const cUSDCMarketplace = m.contract("CUSDCMarketplace");

  // Deploy Confidential Vault
  const vault = m.contract("ConfidentialVault", [cUSDCMarketplace]);

  // Deploy Governance Token (cGOV)
  const mintPrice = m.getParameter("cgovMintPrice", 1000000000000000n); // 0.001 ETH
  const cGOV = m.contract("ConfidentialGovernanceToken", [mintPrice]);

  // Deploy DAO
  const votingDelay = m.getParameter("votingDelay", 1n);
  const votingPeriod = m.getParameter("votingPeriod", 50400n);
  const timelockPeriod = m.getParameter("timelockPeriod", 172800n);
  const quorumBps = m.getParameter("quorumBps", 2000n);
  const approvalBps = m.getParameter("approvalBps", 5000n);

  const dao = m.contract("AzothDAO", [
    vault,
    cGOV,
    votingDelay,
    votingPeriod,
    timelockPeriod,
    quorumBps,
    approvalBps,
  ]);

  return { cUSDCMarketplace, vault, cGOV, dao };
});
```

---

## ⚡ Gas Optimization

### 1. Boolean Flags Instead of Encrypted Checks

```solidity
// ❌ EXPENSIVE: Check encrypted balance every time
function hasVotingPower(address user) public view returns (bool) {
    euint256 balance = _balances[user];
    ebool hasBalance = balance.gt(uint256(0).asEuint256());
    return hasBalance.decrypt(); // EXPENSIVE!
}

// ✅ CHEAP: Maintain boolean flag
mapping(address => bool) public hasVotingPower;

function mint() external {
    // ... mint logic ...
    hasVotingPower[msg.sender] = true; // Cheap!
}
```

### 2. Batch ACL Grants

```solidity
// ❌ EXPENSIVE: Multiple storage writes
balance.allowThis();
balance.allow(user1);
balance.allow(user2);

// ✅ BETTER: Single storage write with array
// (Note: Inco doesn't support this yet, but pattern to watch for)
```

### 3. Minimize Encrypted Operations

```solidity
// ❌ EXPENSIVE: Encrypted calculation for public constants
euint256 fee = amount.mul(uint256(5).asEuint256()).div(uint256(100).asEuint256());

// ✅ CHEAP: Calculate percentage off-chain, encrypt result
uint256 feePercentage = 5; // 5%
// User encrypts: (amount * 5 / 100) client-side, sends encrypted result
```

---

## ✅ Best Practices

### 1. Always Use Local Variables for ACL

```solidity
// ❌ BAD
_balance = _balance.add(amount);
_balance.allowThis(); // May not work correctly!

// ✅ GOOD
euint256 newBalance = _balance.add(amount);
_balance = newBalance;
newBalance.allowThis(); // Always works!
```

### 2. Check for Zero Handles

```solidity
if (euint256.unwrap(balance) == bytes32(0)) {
    // First time user, initialize
    balance = amount;
} else {
    // Add to existing balance
    balance = balance.add(amount);
}
```

### 3. Grant ACL Permissions After All Operations

```solidity
// ❌ BAD: Grant before complete
euint256 newBalance = oldBalance.add(amount);
newBalance.allowThis();
_balance = newBalance;

// ✅ GOOD: Grant after assignment
euint256 newBalance = oldBalance.add(amount);
_balance = newBalance;
newBalance.allowThis();
newBalance.allow(msg.sender);
```

### 4. Use Boolean Optimizations

```solidity
// Store boolean flags for cheap checks
mapping(address => bool) public hasBalance;
mapping(address => bool) public isMember;

// Update flags alongside encrypted values
function deposit(euint256 amount) external {
    // ... encrypted logic ...
    hasBalance[msg.sender] = true; // Cheap flag!
}
```

### 5. Minimize Decryption in Contracts

```solidity
// ❌ AVOID: Decrypting in contract (expensive!)
ebool condition = balance.gt(threshold);
bool plainCondition = condition.decrypt(); // EXPENSIVE!

// ✅ PREFER: Keep operations encrypted
ebool condition = balance.gt(threshold);
euint256 result = inco.select(condition, valueA, valueB); // Stays encrypted!
```

---

## 🎯 Common Patterns

### Pattern 1: Encrypted Balance Tracking

```solidity
mapping(address => euint256) private _balances;
euint256 private _totalSupply;

function transfer(address to, euint256 amount) external {
    // Check balance (encrypted comparison)
    ebool hasSufficient = _balances[msg.sender].ge(amount);
    require(hasSufficient.decrypt(), "Insufficient balance");

    // Update sender balance (encrypted subtraction)
    euint256 newSenderBalance = _balances[msg.sender].sub(amount);
    _balances[msg.sender] = newSenderBalance;

    // Update recipient balance (encrypted addition)
    euint256 newRecipientBalance;
    if (euint256.unwrap(_balances[to]) == bytes32(0)) {
        newRecipientBalance = amount;
    } else {
        newRecipientBalance = _balances[to].add(amount);
    }
    _balances[to] = newRecipientBalance;

    // Grant ACL
    newSenderBalance.allowThis();
    newSenderBalance.allow(msg.sender);
    newRecipientBalance.allowThis();
    newRecipientBalance.allow(to);
}
```

### Pattern 2: Encrypted Voting

```solidity
struct Proposal {
    euint256 forVotes;
    euint256 againstVotes;
}

function vote(uint256 proposalId, bool support) external {
    euint256 weight = votingPower[msg.sender];
    
    if (support) {
        euint256 newForVotes = proposal.forVotes.add(weight);
        proposal.forVotes = newForVotes;
        newForVotes.allowThis();
    } else {
        euint256 newAgainstVotes = proposal.againstVotes.add(weight);
        proposal.againstVotes = newAgainstVotes;
        newAgainstVotes.allowThis();
    }
}
```

### Pattern 3: Conditional Logic

```solidity
// Select based on encrypted condition
ebool isEligible = balance.ge(threshold);
euint256 reward = inco.select(
    isEligible,
    uint256(100).asEuint256(),  // Reward if eligible
    uint256(0).asEuint256()     // Zero if not eligible
);
```

---

## 🌍 Deployed Contracts

### Base Sepolia Testnet

| Contract | Address | Note |
|----------|---------|------|
| **CUSDCMarketplace** | `0x...` | Update after deployment |
| **ConfidentialVault** | `0x...` | Update after deployment |
| **ConfidentialGovernanceToken** | `0x...` | Update after deployment |
| **AzothDAO** | `0x...` | Update after deployment |

### Inco Infrastructure

| Component | Address/URL | Purpose |
|-----------|-------------|---------|
| **Executor Contract** | `0x...` | Fee collection for TEE operations |
| **Session Verifier** | `0xc34569efc25901bdd6b652164a2c8a7228b23005` | Session key verification |
| **Covalidator Endpoints** | Retrieved via `Lightning.latest()` | TEE cluster URLs |

---

## 📚 Additional Resources

### Official Documentation
- [Inco Network Documentation](https://docs.inco.org)
- [Inco Solidity Library Reference](https://github.com/Inco-fhevm/inco-contracts)
- [Lightning Protocol Guide](https://docs.inco.org/getting-started/lightning)

### Example Contracts
- [`contracts/AzothDAO.sol`](contracts/AzothDAO.sol) - Full DAO implementation
- [`contracts/ConfidentialVault.sol`](contracts/ConfidentialVault.sol) - ERC-4626 inspired vault
- [`contracts/ConfidentialGovernanceToken.sol`](contracts/ConfidentialGovernanceToken.sol) - Soulbound token

### Related Files
- [`utils/incoHelper.ts`](utils/incoHelper.ts) - TypeScript utilities for testing
- [`test/AzothDAO.test.ts`](test/AzothDAO.test.ts) - Comprehensive test suite
- [`../nextjs-template/README-INCO.md`](../nextjs-template/README-INCO.md) - Frontend integration

---

## 🆘 Support

- **Documentation**: [docs.inco.org](https://docs.inco.org)
- **Discord**: Join Inco Network community
- **GitHub**: [github.com/Inco-fhevm](https://github.com/Inco-fhevm)

---

**Built with Inco Lightning Protocol 🔐**
