# Azoth DAO - Smart Contracts

> 4 Solidity contracts (~2000 lines) implementing confidential governance with Inco's encrypted types

---

## 🎯 What We Built

### Dual-Token Architecture

**Economic Layer** (cUSDC + Vault):
- Purchase encrypted cUSDC with ETH (2000:1 ratio)
- Deposit into ERC-4626 vault → receive encrypted shares
- Ragequit anytime (withdraw + auto-leave DAO)

**Governance Layer** (cGOV):
- Mint by paying ETH (0.001 ETH per cGOV)
- Non-transferable (soulbound)
- Voting power = encrypted cGOV balance

**Why Separate?** Prevents governance farming, enables economic exit, sybil resistance

---

## 🏗️ Contract Architecture

```
contracts/
├── CUSDCMarketplace.sol         # ETH → encrypted cUSDC (2000:1)
├── ConfidentialVault.sol         # ERC-4626 vault, encrypted shares
├── ConfidentialGovernanceToken.sol # Non-transferable cGOV
└── AzothDAO.sol                  # Proposals, voting, execution
```

**Total**: ~2000 lines of Solidity, Inco-encrypted storage

---

## 📦 Contract Details

### 1. **CUSDCMarketplace.sol** (180 lines)

```solidity
// Purchase encrypted cUSDC
function purchaseCUSDC() external payable {
    euint256 amount = TFHE.asEuint256(msg.value * 2000 * 1e6 / 1e18);
    _balances[msg.sender] = TFHE.add(_balances[msg.sender], amount);
    TFHE.allow(_balances[msg.sender], msg.sender);
}

// Encrypted balances
mapping(address => euint256) internal _balances;
```

**Key**: All balances stored as `euint256` (encrypted integers)

---

### 2. **ConfidentialVault.sol** (220 lines)

```solidity
// Deposit encrypted cUSDC → encrypted shares
function deposit(euint256 amount) external returns (euint256 sharesIssued) {
    // Virtual offset protection (δ=3) for inflation attacks
    sharesIssued = TFHE.div(
        TFHE.mul(amount, totalShares + VIRTUAL_SHARES),
        totalAssets + VIRTUAL_ASSETS
    );
    _shares[msg.sender] = TFHE.add(_shares[msg.sender], sharesIssued);
}

// Ragequit: withdraw all + leave DAO
function ragequit() external {
    euint256 userShares = _shares[msg.sender];
    uint256 assetsReturned = withdraw(userShares);
    dao.leaveDAO(msg.sender);  // Auto-leave DAO
    govToken.burnAllFor(msg.sender);  // Burn cGOV
}
```

**Key**: ERC-4626 inspired with encrypted shares, δ=3 offset protection

---

### 3. **ConfidentialGovernanceToken.sol** (150 lines)

```solidity
// Mint cGOV (non-transferable)
function mint() external payable {
    require(msg.value >= mintPrice, "Insufficient ETH");
    require(vault.hasShares(msg.sender), "No vault shares");
    
    euint256 amount = TFHE.asEuint256(msg.value / mintPrice);
    _balances[msg.sender] = TFHE.add(_balances[msg.sender], amount);
    TFHE.allow(_balances[msg.sender], address(dao));  // DAO needs access for voting
}

// ❌ NO transfer() - soulbound!
```

**Key**: Non-transferable, encrypted balance, requires vault shares

---

### 4. **AzothDAO.sol** (470 lines)

```solidity
// Create proposal with encrypted amount
function propose(
    string calldata description,
    euint256 requestedAmount,
    address recipient,
    VotingMode votingMode
) external payable returns (uint256) {
    require(isMember[msg.sender], "Not a member");
    
    Proposal storage prop = proposals[++proposalCount];
    prop.proposer = msg.sender;
    prop.description = description;
    prop.requestedAmount = requestedAmount;
    prop.recipient = recipient;
    prop.votingMode = votingMode;
    prop.startBlock = block.number + votingDelay;
    prop.endBlock = prop.startBlock + votingPeriod;
    
    return proposalCount;
}

// Cast encrypted vote
function castVote(uint256 proposalId, VoteType support) external payable {
    euint256 votingPower = govToken.balanceOf(msg.sender);  // Encrypted cGOV balance
    
    Proposal storage prop = proposals[proposalId];
    if (support == VoteType.For) {
        prop.forVotes = TFHE.add(prop.forVotes, votingPower);
    } else if (support == VoteType.Against) {
        prop.againstVotes = TFHE.add(prop.againstVotes, votingPower);
    } else {
        prop.abstainVotes = TFHE.add(prop.abstainVotes, votingPower);
    }
}

// Finalize: decrypt votes with TEE attestations
function finalizeProposal(
    uint256 proposalId,
    uint256 forVotesPlaintext,
    uint256 againstVotesPlaintext,
    uint256 abstainVotesPlaintext,
    bytes[] calldata covalidatorSignatures
) external {
    // Verify TEE signatures...
    // Calculate quorum and approval...
    // Set state: Succeeded or Defeated
}
```

**Proposal States**: Pending → Active → Succeeded/Defeated → Queued → Executed

**Governance Params**:
- Voting delay: 50 blocks (~10 min)
- Voting period: 50400 blocks (~1 week)
- Timelock: 2 days
- Quorum: 15% (1500 basis points)
- Approval: 51% (5100 basis points)

---

## 🔐 Deployed Contracts (Base Sepolia)

All contracts deployed on **Base Sepolia testnet** (Chain ID: 84532):

```typescript
// Deployed January 12, 2026
export const CUSDC_MARKETPLACE_ADDRESS = "0x637076397294eC96A92415Be58ca3e24fE44d529" as const;
export const CONFIDENTIAL_VAULT_ADDRESS = "0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82" as const;
export const CGOV_TOKEN_ADDRESS = "0xdA9B7d018e06f4CE070e708653da7629781A101b" as const;
export const AZOTH_DAO_ADDRESS = "0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7" as const;
```

**View on Block Explorer:**
- CUSDCMarketplace: [0x637076397294eC96A92415Be58ca3e24fE44d529](https://sepolia.basescan.org/address/0x637076397294eC96A92415Be58ca3e24fE44d529)
- ConfidentialVault: [0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82](https://sepolia.basescan.org/address/0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82)
- ConfidentialGovernanceToken: [0xdA9B7d018e06f4CE070e708653da7629781A101b](https://sepolia.basescan.org/address/0xdA9B7d018e06f4CE070e708653da7629781A101b)
- AzothDAO: [0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7](https://sepolia.basescan.org/address/0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7)

---

## 🛠️ Tech Stack

- **Solidity**: 0.8.30
- **Inco Lightning**: `@inco/lightning` (encrypted types)
- **Hardhat**: Compilation & deployment
- **Network**: Base Sepolia (84532)

---

**See [README-INCO.md](./README-INCO.md) for Inco smart contract integration details**

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Private key WITHOUT 0x prefix!
PRIVATE_KEY=your_private_key_here

# Base Sepolia RPC
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Basescan API key (for verification)
BASESCAN_API_KEY=your_api_key_here
```

### 3. Compile Contracts

```bash
pnpm hardhat compile
```

### 4. Run Tests

```bash
# Local anvil node
pnpm hardhat test --network anvil

# Base Sepolia testnet
pnpm hardhat test --network baseSepolia
```

### 5. Deploy to Base Sepolia

```bash
pnpm hardhat ignition deploy ./ignition/modules/AzothDAO.ts --network baseSepolia
```

### Deployment Output

```
✅ CUSDCMarketplace deployed to: 0x...
✅ ConfidentialVault deployed to: 0x...
✅ ConfidentialGovernanceToken deployed to: 0x...
✅ AzothDAO deployed to: 0x...
```

### Verify Contracts on Basescan

```bash
pnpm hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 📋 User Workflow

### Step 1: Acquire cUSDC (Economic Stake)

```
User Action: Send 0.1 ETH to CUSDCMarketplace.purchaseCUSDC()
Result:      Receive 200 cUSDC (encrypted)
Storage:     _balances[user] = euint256(200000000) [6 decimals]
```

### Step 2: Deposit into Vault

```
User Action: Call ConfidentialVault.deposit(euint256(100000000))
Result:      Receive vault shares (encrypted, ~100 shares with 1000x precision)
Storage:     shares[user] = euint256(shares)
Effect:      User now has economic stake
```

### Step 3: Join DAO

```
User Action: Call AzothDAO.joinDAO()
Requirement: Must have vault shares (hasShares[user] = true)
Result:      isMember[user] = true, memberCount++
Effect:      User can now participate in governance
```

### Step 4: Mint cGOV (Governance Power)

```
User Action: Send 0.01 ETH to ConfidentialGovernanceToken.mint()
Calculation: 0.01 ETH ÷ 0.001 ETH = 10 cGOV tokens
Result:      Receive 10 cGOV (encrypted)
Storage:     _balances[user] = euint256(10 * 1e18)
Effect:      User has voting power (10 votes)
```

### Step 5: Create Proposal

```
User Action: Call AzothDAO.propose(
               "Fund development",
               euint256(50000000),  // 50 cUSDC encrypted
               developerAddress,
               VotingMode.Normal
             )
Fee:         Pay Inco fee (~0.001 ETH)
Result:      proposalId = 1, state = Pending
Effect:      Voting starts after votingDelay blocks
```

### Step 6: Vote on Proposal

```
User Action: Call AzothDAO.castVote(1, VoteType.For)
Weight:      Vote weight = cGOV balance (10 tokens)
Storage:     forVotes += euint256(10 * 1e18) [ENCRYPTED]
Effect:      Vote recorded, but tally hidden
```

### Step 7: Finalize Proposal

```
User Action: Decrypt votes off-chain using Inco SDK
Process:     1. Read encrypted handles from contract
             2. Decrypt using session key (Inco TEE)
             3. Submit attestations on-chain
Result:      Proposal state = Succeeded or Defeated
Effect:      Vote results publicly revealed
```

### Step 8: Queue Proposal

```
User Action: Call AzothDAO.queue(1)
Requirement: Proposal.state == Succeeded
Result:      Proposal.state = Queued, queuedTime = block.timestamp
Effect:      Timelock period starts (2 days default)
```

### Step 9: Execute Proposal

```
User Action: Call AzothDAO.execute(1)
Requirement: block.timestamp >= queuedTime + timelockPeriod
Process:     vault.executeTransfer(recipient, encryptedAmount)
Result:      Proposal.state = Executed, executed = true
Effect:      50 cUSDC transferred to recipient (encrypted)
```

### Step 10: Ragequit (Optional)

```
User Action: Call ConfidentialVault.ragequit()
Process:     1. Calculate user's share of vault
             2. Withdraw all cUSDC
             3. Burn all vault shares
             4. Call AzothDAO.leaveDAO()
             5. Call cGOV.burnAllFor(user)
Result:      User exits DAO completely, cUSDC returned
Effect:      Clean economic + governance exit
```

---

## 🛡️ Security Features

### 1. ERC-4626 Inflation Attack Protection

Based on [OpenZeppelin's guidance](https://docs.openzeppelin.com/contracts/4.x/erc4626):

```solidity
// Virtual offset: δ = 3
uint256 private constant OFFSET = 3;
uint256 private constant DECIMAL_OFFSET = 10 ** OFFSET; // 1000

// Virtual shares and assets (permanent vault backing)
uint256 private constant VIRTUAL_SHARES = DECIMAL_OFFSET; // 1000
uint256 private constant VIRTUAL_ASSETS = 1;
```

**Attack Cost Calculation:**
```
Attack cost = VIRTUAL_SHARES × token_price
            = 1000 × $0.001 (cUSDC)
            = $1 (example)

vs. Potential gain from inflating share price
```

Attacker needs to donate **1000× the amount** they want to steal. Makes attack economically infeasible.

### 2. Sybil Resistance

**Multi-Layer Protection:**

1. **Economic Layer**
   - Must pay ETH to acquire cUSDC
   - Rate: 2000 cUSDC per ETH = $0.0005 per cUSDC (if ETH = $2000)

2. **Governance Layer**
   - Must pay ETH to mint cGOV
   - Rate: 0.001 ETH per cGOV = $2 per vote (if ETH = $2000)

3. **Dual Requirement**
   - Need both vault shares AND cGOV to vote
   - Total cost = cUSDC purchase + cGOV minting

**Example:**
```
To cast 100 votes:
- Need 100 cGOV tokens
- Cost: 100 × 0.001 ETH = 0.1 ETH = $200
- Plus: Must have vault shares (cUSDC deposit)
- Total: $200+ commitment per 100 votes
```

### 3. Non-Transferable Governance

```solidity
// ConfidentialGovernanceToken.sol has NO transfer functions
// This prevents:
// ❌ Vote buying
// ❌ Flash loan attacks
// ❌ Temporary voting power acquisition
// ❌ Governance token markets
```

### 4. Encrypted Vote Tallies

```solidity
// During voting, tallies are encrypted
euint256 forVotes;     // Encrypted
euint256 againstVotes; // Encrypted
euint256 abstainVotes; // Encrypted

// No one can see running vote counts!
// Prevents:
// ❌ Bandwagon effects
// ❌ Strategic voting based on current results
// ❌ Whale influence visibility
// ❌ MEV attacks on proposal outcomes
```

### 5. Timelock Protection

```solidity
uint256 public timelockPeriod = 172800; // 2 days

// After proposal passes:
// 1. Must be queued (starts timelock)
// 2. Wait 2 days
// 3. Then execute

// This allows:
// ✅ Ragequit if you disagree
// ✅ Review proposal details
// ✅ Challenge malicious proposals
```

### 6. Reentrancy Guards

```solidity
// All state-changing functions use ReentrancyGuard
function deposit(euint256 amount) external nonReentrant { ... }
function withdraw(euint256 sharesAmount) external nonReentrant { ... }
function castVote(uint256 proposalId, VoteType support) external payable nonReentrant { ... }
```

---

## ⚙️ Governance Parameters

### Default Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Voting Delay** | 1 block | Time before voting starts (~2 seconds) |
| **Voting Period** | 50,400 blocks | ~1 week (assuming 12s blocks) |
| **Timelock Period** | 172,800 seconds | 2 days before execution |
| **Quorum** | 20% (2000 bps) | Minimum participation required |
| **Approval Threshold** | 50% (5000 bps) | Minimum approval ratio |
| **cGOV Mint Price** | 0.001 ETH | Cost per governance token |
| **cUSDC Exchange Rate** | 2000 per ETH | Economic stake acquisition rate |

### Quorum Calculation

```solidity
// Example: 100 total cGOV supply, 20% quorum
uint256 totalSupply = 100 * 1e18;
uint256 quorumBps = 2000; // 20%
uint256 requiredVotes = (totalSupply × quorumBps) / 10000;
                      = (100 * 1e18 × 2000) / 10000
                      = 20 * 1e18 votes required
```

### Approval Threshold Calculation

```solidity
// Example: 30 For votes, 10 Against votes, 50% threshold
uint256 forVotes = 30 * 1e18;
uint256 totalVotesCast = 40 * 1e18; // For + Against (Abstain doesn't count)
uint256 approvalBps = 5000; // 50%

bool passed = (forVotes × 10000) >= (totalVotesCast × approvalBps);
            = (30 × 10000) >= (40 × 5000)
            = 300000 >= 200000
            = true ✅
```

### Update Parameters (Owner Only)

```solidity
function updateQuorum(uint256 newQuorumBps) external onlyOwner
function updateApprovalThreshold(uint256 newApprovalBps) external onlyOwner
function updateVotingDelay(uint256 newDelay) external onlyOwner
function updateVotingPeriod(uint256 newPeriod) external onlyOwner
function updateTimelockPeriod(uint256 newPeriod) external onlyOwner
```

---

## 🧪 Testing

### Run All Tests

```bash
# Local network (anvil)
pnpm hardhat test --network anvil

# Base Sepolia testnet
pnpm hardhat test --network baseSepolia
```

### Test File

**Location:** [`test/AzothDAO.test.ts`](test/AzothDAO.test.ts)

### Test Coverage

| Test Suite | Tests |
|------------|-------|
| **Deployment** | ✅ All contracts deploy correctly |
| **cUSDC Marketplace** | ✅ Purchase cUSDC, ✅ Check balance, ✅ Transfer to vault |
| **Vault** | ✅ Deposit, ✅ Withdraw, ✅ Ragequit, ✅ Share calculation |
| **DAO Membership** | ✅ Join DAO, ✅ Leave DAO, ✅ Member count |
| **cGOV Token** | ✅ Mint tokens, ✅ Check balance, ✅ Burn on ragequit |
| **Proposals** | ✅ Create, ✅ Vote, ✅ Finalize, ✅ Queue, ✅ Execute |
| **Governance** | ✅ Quorum check, ✅ Approval threshold, ✅ Timelock |

### Example Test Output

```
✓ Should deploy all contracts
✓ Should purchase cUSDC successfully
✓ Should deposit into vault and receive shares
✓ Should join DAO with vault shares
✓ Should mint cGOV tokens
✓ Should create proposal
✓ Should cast vote
✓ Should finalize proposal
✓ Should queue proposal
✓ Should execute proposal after timelock
```

---

## 🌍 Deployed Contracts

### Base Sepolia Testnet

> **Note:** Update these addresses after deployment

| Contract | Address | Basescan |
|----------|---------|----------|
| **CUSDCMarketplace** | `0x...` | [View on Basescan](https://sepolia.basescan.org/address/0x...) |
| **ConfidentialVault** | `0x...` | [View on Basescan](https://sepolia.basescan.org/address/0x...) |
| **ConfidentialGovernanceToken** | `0x...` | [View on Basescan](https://sepolia.basescan.org/address/0x...) |
| **AzothDAO** | `0x...` | [View on Basescan](https://sepolia.basescan.org/address/0x...) |

### Inco Executor Contract

| Network | Executor Address | Purpose |
|---------|------------------|---------|
| **Base Sepolia** | `0x...` | Fee collection for TEE operations |

---

## 🔧 Development

### Project Structure

```
contracts/
├── CUSDCMarketplace.sol       # Economic stake acquisition
├── ConfidentialVault.sol      # ERC-4626 vault with TEE
├── ConfidentialGovernanceToken.sol  # Soulbound governance token
└── AzothDAO.sol               # Main DAO governance

ignition/modules/
└── AzothDAO.ts                # Hardhat Ignition deployment script

test/
└── AzothDAO.test.ts           # Comprehensive integration tests

utils/
├── incoHelper.ts              # Inco SDK utilities for testing
└── wallet.ts                  # Wallet configuration

hardhat.config.ts              # Hardhat configuration
package.json                   # Dependencies
```

### Dependencies

```json
{
  "dependencies": {
    "@inco/lightning": "latest",
    "@openzeppelin/contracts": "^5.1.0"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "hardhat": "^2.22.16",
    "@inco/js": "^0.7.10"
  }
}
```

### Hardhat Configuration

**File:** [`hardhat.config.ts`](hardhat.config.ts)

```typescript
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 84532,
    },
  },
};
```

### Available Scripts

```bash
# Compile contracts
pnpm hardhat compile

# Run tests
pnpm hardhat test

# Deploy to Base Sepolia
pnpm hardhat ignition deploy ./ignition/modules/AzothDAO.ts --network baseSepolia

# Verify contract
pnpm hardhat verify --network baseSepolia <ADDRESS> <CONSTRUCTOR_ARGS>

# Clean build artifacts
pnpm hardhat clean
```

---

## 📚 Additional Resources

### Documentation
- [Inco Network Documentation](https://docs.inco.org)
- [Inco Solidity Library](https://github.com/Inco-fhevm/inco-contracts)
- [OpenZeppelin ERC-4626](https://docs.openzeppelin.com/contracts/4.x/erc4626)
- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/4.x/governance)

### Frontend Integration
- See [`../nextjs-template/`](../nextjs-template/) for frontend code
- Contract ABIs exported in [`utils/constants.ts`](../nextjs-template/utils/constants.ts)

### Inco Smart Contract Integration
- See [`README-INCO.md`](README-INCO.md) for detailed Inco integration guide with code examples

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details

---

## 🆘 Support

- **Documentation**: See [`README-INCO.md`](README-INCO.md) for Inco integration details
- **Issues**: Open a GitHub issue
- **Discord**: Join Azoth Protocol community

---

**Built with Inco Lightning Protocol 🔐 + Solidity + Hardhat**
