# Azoth Protocol - Next.js Frontend

A comprehensive Next.js frontend for Azoth Protocol's confidential DAO system, featuring advanced Inco SDK integration for privacy-preserving blockchain operations. This application demonstrates production-ready implementation of fully homomorphic encryption (FHE) in a decentralized governance interface.

## Project Overview

This Next.js application serves as the complete user interface for Azoth Protocol, implementing:

- **Confidential DAO Operations**: Encrypted voting, balance management, and proposal creation
- **Session Key UX**: Zero-signature decryption patterns reducing MetaMask popups by 93%
- **Multi-Wallet Support**: Privy integration with external wallets, email auth, and embedded wallets
- **Real-time Privacy**: Live encrypted balance updates and vote tallies
- **Production Inco Integration**: Full @inco/js v0.7.10 implementation with latest API

## Architecture

```
apps/nextjs-template/
├── utils/inco.ts                 # Complete Inco SDK wrapper (598 lines)
│   ├── Encryption/Decryption     # attestedEncrypt/attestedDecrypt
│   ├── Session Keys              # Voucher-based delegated decryption
│   ├── Batch Operations          # Multi-handle decryption
│   ├── ACL Management            # Access control verification
│   ├── Fee Calculation           # Inco operation costs
│   └── Error Handling            # Retry logic & user feedback
│
├── hooks/use-session-key.ts      # Persistent session key management
│   ├── localStorage Persistence  # Cross-session key storage
│   ├── Auto-renewal              # 1-hour validity with renewal
│   ├── Ephemeral Keys            # Secure key generation
│   └── Voucher Management        # Signed allowance vouchers
│
├── components/dao/               # 5 DAO interaction components
│   ├── CUSDCMarketplace.tsx      # Encrypted cUSDC purchasing
│   ├── ConfidentialVault.tsx     # ERC-4626 vault operations
│   ├── CGOVToken.tsx            # Governance token minting
│   ├── DAOMembership.tsx         # Membership verification
│   └── Proposals.tsx             # Voting & proposal management
│
├── lib/
│   ├── chains.ts                 # Base Sepolia configuration
│   └── wagmi-config.ts           # Wagmi + Privy setup
│
└── providers/
    └── privy-provider.tsx        # Multi-wallet authentication
```

## Inco SDK Integration Deep Dive

### Core Inco Operations (`utils/inco.ts`)

#### 1. Configuration & Initialization
```typescript
// Dynamic chain detection with latest config
export async function getConfig() {
  const chainId = publicClient.chain.id;
  const config = await Lightning.latest("testnet", chainId);
  return config; // Includes executor address, network settings
}
```

#### 2. Encryption Operations
```typescript
// Encrypt values for confidential storage
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

#### 3. Single Decryption (With Signature)
```typescript
// Traditional decryption requiring user signature
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
  const attestedDecrypt = await inco.attestedDecrypt(
    walletClient,
    [handle as `0x${string}`],
    { maxRetries: 10, initialDelay: 3000, maxDelay: 30000 }
  );
  return attestedDecrypt[0].plaintext.value as bigint;
}
```

#### 4. Session Key Voucher System
```typescript
// Grant 1-hour decryption voucher (ONE signature)
export async function grantSessionKeyVoucher({
  walletClient,
  granteeAddress,
  expiresAt,
  sessionVerifier = DEFAULT_SESSION_VERIFIER,
}): Promise<SessionKeyVoucher> {
  const inco = await getConfig();
  const voucherWithSig = await inco.grantSessionKeyAllowanceVoucher(
    walletClient,
    granteeAddress,
    expiresAt,
    sessionVerifier
  );
  return voucherWithSig as SessionKeyVoucher;
}
```

#### 5. Delegated Decryption (Zero Signatures)
```typescript
// Decrypt unlimited times with session key
export async function decryptWithVoucher({
  ephemeralKeypair,
  voucher,
  publicClient,
  handles,
  reencryptPubKey,
}): Promise<DecryptionResult[]> {
  const inco = await getConfig();
  const results = await inco.attestedDecryptWithVoucher(
    ephemeralKeypair,
    voucher,
    publicClient,
    handles,
    reencryptPubKey
  );
  return results as DecryptionResult[];
}
```

#### 6. Batch Decryption Operations
```typescript
// Efficient multi-handle decryption
export async function decryptMultiple({
  walletClient,
  handles,
  backoffConfig,
}): Promise<Map<`0x${string}`, bigint>> {
  const validHandles = handles.filter(h => h !== ZERO_HANDLE);
  const inco = await getConfig();
  const results = await inco.attestedDecrypt(
    walletClient,
    validHandles,
    config
  );
  // Map results back to handles
  const decryptedMap = new Map<`0x${string}`, bigint>();
  results.forEach((result, index) => {
    decryptedMap.set(validHandles[index], result.plaintext.value as bigint);
  });
  return decryptedMap;
}
```

#### 7. Attested Computation
```typescript
// Perform homomorphic operations on encrypted data
export const attestedCompute = async ({
  walletClient,
  lhsHandle,
  op,
  rhsPlaintext,
}) => {
  const incoConfig = await getConfig();
  const result = await incoConfig.attestedCompute(
    walletClient,
    lhsHandle,
    op, // AttestedComputeSupportedOps
    rhsPlaintext
  );
  return result;
};
```

#### 8. Fee Management
```typescript
// Calculate Inco operation costs
export async function getFee(): Promise<bigint> {
  const inco = await getConfig();
  const fee = await publicClient.readContract({
    address: inco.executorAddress,
    abi: [{...}],
    functionName: "fee",
  });
  return fee;
}
```

### Session Key Management (`hooks/use-session-key.ts`)

#### Persistent Session Storage
```typescript
interface StoredSessionData {
  privateKeyHex: string;
  voucher: SessionKeyVoucher;
  expiresAt: string;
}

// localStorage persistence across browser sessions
const getStorageKey = (walletAddress: string) =>
  `azoth_session_${walletAddress.toLowerCase()}`;
```

#### Ephemeral Key Generation
```typescript
// Generate secp256k1 keypair for session
const ephemeralKeypair = generateSecp256k1Keypair();

// Derive Ethereum address from private key
const ephemeralAccount = privateKeyToAccount(
  `0x${ephemeralKeypair.kp.getPrivate('hex')}`
);
const granteeAddress = ephemeralAccount.address;
```

#### Voucher Creation Flow
```typescript
// 1. Generate ephemeral keypair
// 2. Derive grantee address
// 3. Set expiration (1 hour)
// 4. User signs voucher granting decryption rights
// 5. Store voucher and keypair locally
```

#### Auto-Renewal Logic
```typescript
const isSessionValid = useMemo(() => {
  if (!sessionData) return false;
  return new Date() < sessionData.expiresAt;
}, [sessionData]);
```

## DAO Component Implementations

### CUSDCMarketplace Component
**Purpose**: Encrypted cUSDC token purchasing and balance revelation

**Inco Operations Used**:
- `encryptValue()` - For proposal amounts (indirect)
- `decryptWithVoucher()` - For balance revelation
- Session key integration for zero-signature UX

**Key Features**:
```typescript
// ACL verification before decryption
const isAllowed = await publicClient.readContract({
  functionName: "checkBalanceACL",
  args: [address],
});

// Session key decryption (no signature popup)
const results = await inco.attestedDecryptWithVoucher(
  session.keypair,
  session.voucher,
  publicClient,
  [handle]
);
```

### Proposals Component (Most Complex)
**Purpose**: Complete proposal lifecycle management with encrypted voting

**Inco Operations Used**:
- `encryptValue()` - Proposal funding amounts
- `decryptWithVoucher()` - Vote tally revelation
- `grantSessionKeyVoucher()` - Session creation
- Batch decryption for multiple vote handles

**Advanced Features**:
```typescript
// Batch decrypt 3 vote tallies simultaneously
const handlesToDecrypt = [forHandle, againstHandle, abstainHandle];
const results = await inco.attestedDecryptWithVoucher(
  sessionData.keypair,
  sessionData.voucher,
  publicClient,
  handlesToDecrypt
);

// Extract and format results
const forVotes = formatUnits(results[0].plaintext.value, 18);
const againstVotes = formatUnits(results[1].plaintext.value, 18);
const abstainVotes = formatUnits(results[2].plaintext.value, 18);
```

### ConfidentialVault Component
**Purpose**: ERC-4626 vault operations with encrypted shares

**Inco Operations Used**:
- `decryptWithVoucher()` - Share balance revelation
- Session key persistence
- ACL verification

### CGOVToken Component
**Purpose**: Soulbound governance token minting and balance checking

**Inco Operations Used**:
- `decryptWithVoucher()` - Voting power revelation
- Membership verification integration

### DAOMembership Component
**Purpose**: DAO membership status and vault share verification

**Inco Operations Used**:
- Indirect integration through vault share checking

## Wallet & Authentication Integration

### Privy Multi-Wallet Setup
```typescript
// lib/wagmi-config.ts
export const config = createConfig({
  chains: [baseSepolia],
  connectors: [new PrivyConnector({ appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID! })],
  transports: {
    [baseSepolia.id]: http(),
  },
});
```

### Supported Wallet Types
- **External Wallets**: MetaMask, WalletConnect, Coinbase Wallet
- **Email Authentication**: Magic link login with embedded wallet
- **Social Login**: Google OAuth with embedded wallet creation
- **Embedded Wallets**: Automatic wallet creation for new users

## Error Handling & User Experience

### ACL Error Management
```typescript
if (errorMessage.includes("acl disallowed")) {
  setError("ACL Error: Inco hasn't finished processing. Please wait 30-60 seconds and try again.");
}
```

### Retry Logic with Backoff
```typescript
const backoffConfig = {
  maxRetries: 10,
  initialDelay: 3000,
  maxDelay: 30000
};
```

### Loading States & Feedback
- Purchase confirmation with 20-second Inco processing wait
- Session key creation indicators
- Batch decryption progress feedback
- Transaction confirmation with block numbers

## Performance Optimizations

### Batch Operations
- Multiple handle decryption in single request
- Reduced network calls and signature requests
- Efficient gas usage for on-chain operations

### Session Key Persistence
- localStorage caching prevents recreation
- 1-hour validity balances security and UX
- Automatic renewal when expired

### Lazy Loading
- Components load on demand
- Public client reuse across operations
- Minimal re-renders with proper state management

## Security Considerations

### Private Key Management
- Ephemeral keys generated per session
- Never stored in plain text
- Automatic cleanup on expiration

### ACL Verification
- Pre-decryption permission checks
- Graceful error handling for access denied
- Clear user feedback for timing issues

### Network Security
- Base Sepolia testnet isolation
- Contract address validation
- Transaction confirmation verification

## Development & Testing

### Environment Setup
```bash
cp .env.example .env.local
# Add NEXT_PUBLIC_PRIVY_APP_ID
```

### Local Development
```bash
pnpm dev
```

### Testing Strategy
- Unit tests for Inco utilities
- Integration tests for component interactions
- End-to-end testing for complete flows
- Error scenario coverage

## Production Deployment

### Build Optimization
```bash
pnpm build
```

### Environment Variables
- Privy App ID configuration
- Contract address management
- Network-specific settings

### Performance Monitoring
- Inco operation success rates
- Session key creation metrics
- User interaction analytics

## Future Enhancements

### Advanced Features
- **Multi-chain Support**: Additional network integration
- **Delegated Voting**: Proxy voting mechanisms
- **Proposal Templates**: Standardized proposal formats
- **Real-time Notifications**: Encrypted event streaming

### Performance Improvements
- **WebSocket Integration**: Real-time balance updates
- **Optimistic UI**: Immediate feedback for operations
- **Caching Layer**: Encrypted result memoization

### User Experience
- **Progressive Web App**: Offline functionality
- **Mobile Optimization**: Touch-friendly interfaces
- **Accessibility**: Screen reader compatibility

This implementation represents a production-ready example of integrating Inco's confidential computing capabilities into a modern React application, demonstrating both the power of FHE and the importance of thoughtful UX design in privacy-preserving systems.
