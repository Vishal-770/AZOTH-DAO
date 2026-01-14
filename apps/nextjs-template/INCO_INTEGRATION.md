# Inco SDK Integration Guide - Frontend

> Complete documentation of Inco Lightning Protocol integration in the Azoth Protocol frontend

---

## 📋 Table of Contents

- [Overview](#overview)
- [SDK Installation](#sdk-installation)
- [Core Configuration](#core-configuration)
- [Encryption](#encryption)
- [Decryption Methods](#decryption-methods)
- [Session Key Pattern](#session-key-pattern)
- [Advanced Features](#advanced-features)
- [Component Integration](#component-integration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## 🌐 Overview

The Azoth Protocol frontend integrates **Inco's Lightning Protocol** (`@inco/js@0.7.10`) for TEE-based (Trusted Execution Environment) confidential computing. All encryption/decryption operations happen through Inco's covalidator network, ensuring data privacy and cryptographic attestations.

### Why Inco SDK?

- **Client-side Encryption**: Encrypt data before sending to blockchain
- **Attested Decryption**: Prove ownership via EIP-712 signatures
- **Session Keys**: Eliminate repeated MetaMask popups (93% UX improvement)
- **Batch Operations**: Decrypt multiple values with one signature
- **TEE Security**: Hardware-backed confidentiality guarantees

---

## 📦 SDK Installation

### Package Version

```json
{
  "dependencies": {
    "@inco/js": "^0.7.10"
  }
}
```

### Installation Command

```bash
pnpm add @inco/js
# or
npm install @inco/js
```

### Import Structure

```typescript
// Main SDK imports
import { Lightning, generateSecp256k1Keypair } from "@inco/js/lite";
import { handleTypes, type HexString } from "@inco/js";

// Type definitions
import type { WalletClient, PublicClient } from "viem";
```

**File Location:** `apps/nextjs-template/utils/inco.ts`

---

## ⚙️ Core Configuration

### Lightning Protocol Setup

**Function:** `getConfig()`  
**Location:** `utils/inco.ts` (Line 48)

```typescript
export async function getConfig() {
  const chainId = publicClient.chain.id; // Base Sepolia: 84532
  console.log("[Config] Chain ID:", chainId);
  
  try {
    const config = await Lightning.latest("testnet", chainId);
    console.log("[Config] Inco Executor Address:", config.executorAddress);
    return config;
  } catch (error) {
    console.error("[Config] Failed to get Inco config:", error);
    throw error;
  }
}
```

**What This Returns:**
```typescript
{
  executorAddress: "0x...",     // Inco executor contract for fees
  covalidatorEndpoints: [...],   // TEE cluster URLs
  sessionVerifier: "0x...",      // Session key verifier contract
  chainId: 84532                 // Base Sepolia
}
```

**Usage in Components:**
```typescript
const inco = await getConfig();
const encryptedData = await inco.encrypt(value, options);
```

### Public Client Setup

```typescript
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
```

### Fee Estimation

**Function:** `getFee()`  
**Location:** `utils/inco.ts` (Line 217)

```typescript
export async function getFee(): Promise<bigint> {
  console.log("[Fee] Fetching Inco fee...");
  
  const inco = await getConfig();

  try {
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

    console.log("[Fee] Got fee:", fee.toString(), "wei");
    return fee; // Typically ~0.001 ETH
  } catch (error) {
    console.error("[Fee] Failed to get fee:", error);
    throw error;
  }
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

## 🔐 Encryption

### Client-Side Encryption

**Function:** `encryptValue()`  
**Location:** `utils/inco.ts` (Line 69)

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
  console.log("[Encrypt] Starting encryption...");
  console.log("[Encrypt] Value:", value.toString());
  console.log("[Encrypt] Account:", address);
  console.log("[Encrypt] Contract:", contractAddress);
  
  const inco = await getConfig();

  try {
    const encryptedData = await inco.encrypt(value, {
      accountAddress: address,
      dappAddress: contractAddress,
      handleType: handleTypes.euint256,
    });

    console.log("[Encrypt] Success!");
    return encryptedData as `0x${string}`;
  } catch (error) {
    console.error("[Encrypt] Failed:", error);
    throw error;
  }
}
```

### How It Works

```
User Input (1000)
     ↓
SDK encrypts value
     ↓
Encrypted Handle: 0x1a2b3c4d... (32 bytes)
     ↓
Store on-chain (contract storage)
     ↓
Only TEE can decrypt
```

### Usage in Proposals Component

**File:** `components/dao/Proposals.tsx` (Line 180)

```typescript
const handleCreateProposal = async () => {
  // Convert to wei (cUSDC has 6 decimals)
  const amountBigInt = parseUnits(amount, 6); // "1000" → 1000000000n
  
  console.log("[Proposals] Encrypting amount:", amountBigInt.toString());
  
  // Encrypt client-side
  const encryptedAmount = await encryptValue({
    value: amountBigInt,
    address,
    contractAddress: AZOTH_DAO_ADDRESS,
  });
  
  console.log("[Proposals] Encrypted handle:", encryptedAmount);
  
  // Get Inco fee
  const fee = await getFee();
  
  // Submit to contract
  const hash = await walletClient.writeContract({
    address: AZOTH_DAO_ADDRESS,
    abi: AZOTH_DAO_ABI,
    functionName: "propose",
    args: [description, encryptedAmount, recipient, votingMode],
    value: fee, // Pay Inco fee
  });
  
  console.log("[Proposals] Transaction submitted:", hash);
};
```

### Supported Handle Types

```typescript
import { handleTypes } from "@inco/js";

// Available types:
handleTypes.euint8    // 8-bit encrypted integer
handleTypes.euint16   // 16-bit encrypted integer
handleTypes.euint32   // 32-bit encrypted integer
handleTypes.euint64   // 64-bit encrypted integer
handleTypes.euint128  // 128-bit encrypted integer
handleTypes.euint256  // 256-bit encrypted integer (most common)
handleTypes.ebool     // Encrypted boolean
handleTypes.eaddress  // Encrypted Ethereum address
```

**In This Project:** We use `euint256` for all numeric values (balances, vote counts, etc.)

---

## 🔓 Decryption Methods

### Method 1: Basic Decryption (Single Handle)

**Function:** `decryptValue()`  
**Location:** `utils/inco.ts` (Line 100)

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
  console.log("[Decrypt] Starting decryption...");
  console.log("[Decrypt] Handle:", handle);
  console.log("[Decrypt] User address:", walletClient.account?.address);
  
  if (handle === ZERO_HANDLE) {
    console.log("[Decrypt] Handle is zero, returning 0");
    return 0n;
  }
  
  const inco = await getConfig();

  const backoffConfig = {
    maxRetries: 10,
    initialDelay: 3000,
    maxDelay: 30000
  };

  try {
    console.log("[Decrypt] Calling attestedDecrypt...");
    const attestedDecrypt = await inco.attestedDecrypt(
      walletClient, 
      [handle as `0x${string}`],
      backoffConfig
    );

    const value = attestedDecrypt[0].plaintext.value as bigint;
    console.log("[Decrypt] Success! Value:", value.toString());
    return value;
  } catch (error: unknown) {
    console.error("[Decrypt] Failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("acl disallowed")) {
      console.error("[Decrypt] ACL Error: User is not allowed to decrypt this handle");
      console.error("[Decrypt] Possible causes:");
      console.error("   1. You haven't purchased any cUSDC yet");
      console.error("   2. The contract didn't call .allow(yourAddress) on this handle");
      console.error("   3. The handle belongs to a different user");
    }
    
    throw error;
  }
}
```

**What Happens:**
1. User signs EIP-712 message via MetaMask
2. SDK sends signature + handle to Inco covalidator
3. Covalidator verifies:
   - User has ACL permission
   - Signature is valid
   - Handle exists in TEE
4. TEE decrypts inside secure enclave
5. Returns plaintext + cryptographic attestation

**Usage in CUSDCMarketplace:**

**File:** `components/dao/CUSDCMarketplace.tsx` (Line 110)

```typescript
const handleRevealBalance = async () => {
  if (!walletClient || !address) return;
  
  setIsDecrypting(true);
  
  try {
    // Get encrypted handle from contract
    const handle = await publicClient.readContract({
      address: CUSDC_MARKETPLACE_ADDRESS,
      abi: CUSDC_MARKETPLACE_ABI,
      functionName: "balanceOf",
      args: [address],
    });
    
    console.log("[Marketplace] Encrypted handle:", handle);
    
    // Decrypt with signature (MetaMask popup)
    const decrypted = await decryptValue({
      walletClient,
      handle: handle as string,
      contractAddress: CUSDC_MARKETPLACE_ADDRESS,
    });
    
    // Format result (cUSDC has 6 decimals)
    const balance = formatUnits(decrypted, 6);
    console.log("[Marketplace] Decrypted balance:", balance);
    
    setBalance(balance);
  } catch (err) {
    console.error("[Marketplace] Decrypt failed:", err);
    setError(err instanceof Error ? err.message : "Failed to decrypt balance");
  } finally {
    setIsDecrypting(false);
  }
};
```

### Method 2: Batch Decryption (Multiple Handles, One Signature)

**Function:** `decryptMultiple()`  
**Location:** `utils/inco.ts` (Line 490)

```typescript
export async function decryptMultiple({
  walletClient,
  handles,
  backoffConfig,
}: {
  walletClient: IncoWalletClient;
  handles: `0x${string}`[];
  backoffConfig?: BackoffConfig;
}): Promise<Map<`0x${string}`, bigint>> {
  console.log("[DecryptMultiple] Decrypting", handles.length, "handles...");
  
  // Filter out zero handles
  const validHandles = handles.filter(h => h !== ZERO_HANDLE);
  
  if (validHandles.length === 0) {
    console.log("[DecryptMultiple] No valid handles to decrypt");
    return new Map();
  }
  
  const inco = await getConfig();

  const config = backoffConfig || {
    maxRetries: 10,
    initialDelay: 3000,
    maxDelay: 30000
  };

  try {
    const results = await inco.attestedDecrypt(
      walletClient, 
      validHandles,
      config
    );

    const decryptedMap = new Map<`0x${string}`, bigint>();
    results.forEach((result, index) => {
      decryptedMap.set(validHandles[index], result.plaintext.value as bigint);
    });

    console.log("[DecryptMultiple] Success! Decrypted", results.length, "values");
    return decryptedMap;
  } catch (error) {
    console.error("[DecryptMultiple] Failed:", error);
    throw error;
  }
}
```

**Impact:**
- **Before:** 2 handles = 2 signatures = 2 MetaMask popups
- **After:** 2 handles = 1 signature = 1 MetaMask popup
- **50% reduction** in UX friction

**Usage (Without Session Key):**

```typescript
// Get 2 encrypted handles
const sharesHandle = await publicClient.readContract({
  functionName: "shares",
  args: [address],
});

const balanceHandle = await publicClient.readContract({
  functionName: "balanceOf",
  args: [address],
});

// Decrypt BOTH with ONE signature
const results = await inco.attestedDecrypt(
  walletClient,
  [sharesHandle as `0x${string}`, balanceHandle as `0x${string}`]
);

// Extract values
const shares = formatUnits(results[0].plaintext.value as bigint, 18);
const balance = formatUnits(results[1].plaintext.value as bigint, 6);
```

---

## ⚡ Session Key Pattern

### Overview

The **Session Key Pattern** is the most advanced Inco feature implemented in this project. It allows users to **sign once** and then decrypt unlimited values for 1 hour **without additional MetaMask popups**.

**Impact:**
- **Before:** 15 signatures to reveal 5 proposals (3 tallies each)
- **After:** 1 signature + 0 additional popups
- **93% reduction** in MetaMask interactions

### Step 1: Generate Ephemeral Keypair

**Function:** `generateSecp256k1Keypair()`  
**Imported from:** `@inco/js/lite`

```typescript
import { generateSecp256k1Keypair } from "@inco/js/lite";

const ephemeralKeypair = generateSecp256k1Keypair();

// Returns:
{
  kp: EC.KeyPair,           // Elliptic curve keypair object
  publicKey: string,        // Hex-encoded public key
  privateKey: string,       // Hex-encoded private key
}
```

**CRITICAL:** Must use `.kp.getPrivate('hex')` to access the private key:

```typescript
// ❌ WRONG - causes TypeError
const privateKey = ephemeralKeypair.privateKey; 

// ✅ CORRECT - accesses underlying elliptic curve private key
const privateKey = ephemeralKeypair.kp.getPrivate('hex');
```

### Step 2: Derive Ethereum Address

```typescript
import { privateKeyToAccount } from "viem/accounts";

const ephemeralAccount = privateKeyToAccount(
  `0x${ephemeralKeypair.kp.getPrivate('hex')}`
);

const granteeAddress = ephemeralAccount.address;
console.log("Ephemeral address:", granteeAddress);
// Output: 0x1a2b3c4d...
```

### Step 3: Grant Session Key Allowance Voucher

**Function:** `grantSessionKeyVoucher()`  
**Location:** `utils/inco.ts` (Line 330)

```typescript
export async function grantSessionKeyVoucher({
  walletClient,
  granteeAddress,
  expiresAt,
  sessionVerifier = DEFAULT_SESSION_VERIFIER,
}: {
  walletClient: IncoWalletClient;
  granteeAddress: `0x${string}`;
  expiresAt: Date;
  sessionVerifier?: `0x${string}`;
}): Promise<SessionKeyVoucher> {
  console.log("[SessionKey] Granting session key voucher...");
  console.log("[SessionKey] Grantee:", granteeAddress);
  console.log("[SessionKey] Expires:", expiresAt.toISOString());
  
  const inco = await getConfig();

  try {
    const voucherWithSig = await inco.grantSessionKeyAllowanceVoucher(
      walletClient,
      granteeAddress,
      expiresAt,
      sessionVerifier
    );

    console.log("[SessionKey] Voucher granted successfully!");
    return voucherWithSig as SessionKeyVoucher;
  } catch (error) {
    console.error("[SessionKey] Failed to grant voucher:", error);
    throw error;
  }
}
```

**Session Verifier Contract:** `0xc34569efc25901bdd6b652164a2c8a7228b23005` (Base Sepolia)

**What User Signs (EIP-712):**
```typescript
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
    granter: "0xUser...",       // User's wallet address
    grantee: "0xEphemeral...",  // Ephemeral keypair address
    expiresAt: 1736796000,      // Unix timestamp (1 hour from now)
  },
}
```

### Step 4: Decrypt with Voucher (Zero Signatures)

**Function:** `decryptWithVoucher()`  
**Location:** `utils/inco.ts` (Line 370)

```typescript
export async function decryptWithVoucher({
  ephemeralKeypair,
  voucher,
  publicClient: client,
  handles,
  reencryptPubKey,
}: {
  ephemeralKeypair: ReturnType<typeof generateSecp256k1Keypair>;
  voucher: SessionKeyVoucher;
  publicClient: PublicClient;
  handles: `0x${string}`[];
  reencryptPubKey?: string;
}): Promise<DecryptionResult[]> {
  console.log("[DecryptWithVoucher] Starting delegated decryption...");
  console.log("[DecryptWithVoucher] Handles:", handles.length);
  
  const inco = await getConfig();

  try {
    const results = await inco.attestedDecryptWithVoucher(
      ephemeralKeypair,   // Ephemeral keypair (no wallet needed!)
      voucher,            // Signed voucher from user
      client,             // Read-only RPC client
      handles,            // Multiple handles
      reencryptPubKey     // Optional: reencrypt for delegate
    );

    console.log("[DecryptWithVoucher] Success! Got", results.length, "results");
    return results as DecryptionResult[];
  } catch (error) {
    console.error("[DecryptWithVoucher] Failed:", error);
    throw error;
  }
}
```

**Magic:** No `walletClient` needed - uses ephemeral keypair stored in memory!

### Complete Implementation in ConfidentialVault

**File:** `components/dao/ConfidentialVault.tsx`

**State Management:**
```typescript
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

**Create Session (User Signs Once):**
```typescript
const handleCreateSession = async () => {
  if (!walletClient) return;
  
  setIsCreatingSession(true);
  setError(null);

  try {
    console.log("[Vault] Creating session key...");
    
    // Step 1: Generate ephemeral keypair
    const ephemeralKeypair = generateSecp256k1Keypair();
    
    // Step 2: Derive Ethereum address
    const ephemeralAccount = privateKeyToAccount(
      `0x${ephemeralKeypair.kp.getPrivate('hex')}`
    );
    const granteeAddress = ephemeralAccount.address;
    
    console.log("[Vault] Ephemeral address:", granteeAddress);
    
    // Step 3: Set expiration (1 hour)
    const expiresAt = new Date(Date.now() + 3600000);
    
    // Step 4: Get Inco config
    const inco = await getConfig();
    
    // Step 5: User signs ONCE to grant session key
    const voucher = await inco.grantSessionKeyAllowanceVoucher(
      walletClient,
      granteeAddress,
      expiresAt,
      DEFAULT_SESSION_VERIFIER
    );

    // Step 6: Store in state
    setSessionData({
      keypair: ephemeralKeypair,
      voucher: voucher as SessionKeyVoucher,
      expiresAt,
    });

    console.log("[Vault] Session created! Valid until:", expiresAt.toISOString());
  } catch (err: unknown) {
    console.error("[Vault] Failed to create session:", err);
    setError(err instanceof Error ? err.message : "Failed to create session");
  } finally {
    setIsCreatingSession(false);
  }
};
```

**Reveal Balances with Session (Zero Signatures):**
```typescript
const handleGetBalances = async () => {
  if (!publicClient || !address) return;

  // Check if session is valid
  if (!isSessionValid) {
    console.log("[Vault] No valid session, creating one...");
    await handleCreateSession();
    return;
  }

  setIsDecrypting(true);
  setError(null);

  try {
    console.log("[Vault] Revealing balances with session key...");
    
    // Step 1: Get encrypted handles from contract
    const sharesHandle = await publicClient.readContract({
      address: CONFIDENTIAL_VAULT_ADDRESS,
      abi: CONFIDENTIAL_VAULT_ABI,
      functionName: "shares",
      args: [address],
    });

    const balanceHandle = await publicClient.readContract({
      address: CUSDC_MARKETPLACE_ADDRESS,
      abi: CUSDC_MARKETPLACE_ABI,
      functionName: "balanceOf",
      args: [address],
    });

    console.log("[Vault] Shares handle:", sharesHandle);
    console.log("[Vault] Balance handle:", balanceHandle);

    // Step 2: Prepare handles for batch decrypt
    const handlesToDecrypt: `0x${string}`[] = [];
    const handleMap = { shares: -1, balance: -1 };

    if (sharesHandle !== ZERO_HANDLE) {
      handleMap.shares = handlesToDecrypt.length;
      handlesToDecrypt.push(sharesHandle as `0x${string}`);
    }

    if (balanceHandle !== ZERO_HANDLE) {
      handleMap.balance = handlesToDecrypt.length;
      handlesToDecrypt.push(balanceHandle as `0x${string}`);
    }

    // Step 3: Batch decrypt with session key - NO SIGNATURE!
    if (handlesToDecrypt.length > 0 && sessionData) {
      console.log("[Vault] Batch decrypting", handlesToDecrypt.length, "handles with session key (no signature)...");
      
      const inco = await getConfig();

      // Use session key voucher - NO wallet signature popup!
      const results = await inco.attestedDecryptWithVoucher(
        sessionData.keypair,   // Ephemeral keypair
        sessionData.voucher,   // Signed voucher
        publicClient,          // Read-only client
        handlesToDecrypt       // Handles to decrypt
      );

      console.log("[Vault] Decrypted", results.length, "values");

      // Extract decrypted values
      if (handleMap.shares !== -1) {
        const decrypted = results[handleMap.shares].plaintext.value as bigint;
        const formatted = formatUnits(decrypted, 18);
        setShares(formatted);
        console.log("[Vault] Shares:", formatted);
      }

      if (handleMap.balance !== -1) {
        const decrypted = results[handleMap.balance].plaintext.value as bigint;
        const formatted = formatUnits(decrypted, 6);
        setCUSDCBalance(formatted);
        console.log("[Vault] cUSDC Balance:", formatted);
      }
    }
  } catch (err: unknown) {
    console.error("[Vault] Failed to reveal balances:", err);
    setError(err instanceof Error ? err.message : "Failed to reveal balances");
  } finally {
    setIsDecrypting(false);
  }
};
```

**UI Integration:**
```typescript
return (
  <div className="space-y-6">
    {/* Session Status Indicator */}
    <div className="bg-black/40 p-4 border border-[#e0f2fe]/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] text-[#e0f2fe]/50 tracking-widest uppercase">
            Decryption Session Status
          </p>
          <p className="font-mono text-sm text-white mt-1">
            {isSessionValid ? (
              <span className="text-[#00f5ff]">
                ✓ Active (expires {sessionData?.expiresAt.toLocaleTimeString()})
              </span>
            ) : (
              <span className="text-yellow-400">No Active Session</span>
            )}
          </p>
        </div>
        {isSessionValid && (
          <button
            onClick={() => setSessionData(null)}
            className="px-3 py-1 text-xs font-mono text-red-400 border border-red-400/30 hover:bg-red-500/10"
          >
            Revoke
          </button>
        )}
      </div>
      {!isSessionValid && (
        <p className="font-mono text-xs text-[#e0f2fe]/50 mt-2">
          Sign once to create a session, then decrypt balances without repeated signatures.
        </p>
      )}
    </div>

    {/* Reveal Button */}
    <button
      onClick={handleGetBalances}
      disabled={isDecrypting || isCreatingSession}
      className="w-full py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff]"
    >
      {isCreatingSession 
        ? "Creating Session (Sign Once)..." 
        : isDecrypting 
          ? "Decrypting..." 
          : isSessionValid
            ? "Reveal Balances (No Signature)" 
            : "Reveal Balances (Create Session)"}
    </button>
  </div>
);
```

### Security Model

**Storage:**
- Ephemeral keypair stored in **React state** (memory only)
- **Not persisted** to localStorage/sessionStorage
- Lost on page refresh (intentional security feature)

**Expiration:**
- Automatically expires after 1 hour
- User can manually revoke at any time
- Covalidator enforces expiration timestamp

**Verification Flow:**
```
User Decrypt Request
     ↓
Frontend sends: ephemeralKeypair + voucher + handles
     ↓
Covalidator calls session verifier contract
     ↓
Verifier checks:
  - Signature valid? ✅
  - Grantee matches? ✅
  - Not expired? ✅
     ↓
TEE decrypts handles
     ↓
Returns plaintext + attestation
```

---

## 🚀 Advanced Features

### Attested Compute (Prepared, Not Active)

**Function:** `attestedCompute()`  
**Location:** `utils/inco.ts` (Line 165)

```typescript
export const attestedCompute = async ({
  walletClient,
  lhsHandle,
  op,
  rhsPlaintext,
}: {
  walletClient: IncoWalletClient;
  lhsHandle: `0x${string}`;
  op: (typeof AttestedComputeSupportedOps)[keyof typeof AttestedComputeSupportedOps];
  rhsPlaintext: bigint | boolean;
}) => {
  const incoConfig = await getConfig();

  const result = await incoConfig.attestedCompute(
    walletClient,
    lhsHandle as `0x${string}`,
    op,
    rhsPlaintext
  );

  const signatures = result.covalidatorSignatures.map((sig: Uint8Array) =>
    bytesToHex(sig)
  );

  const encodedValue = pad(toHex(result.plaintext.value ? 1 : 0), { size: 32 });

  return {
    plaintext: result.plaintext.value,
    attestation: {
      handle: result.handle,
      value: encodedValue,
    },
    signature: signatures,
  };
};
```

**Supported Operations:**
```typescript
import { AttestedComputeSupportedOps } from "@inco/js/lite";

AttestedComputeSupportedOps.LT   // Less than
AttestedComputeSupportedOps.GT   // Greater than
AttestedComputeSupportedOps.GTE  // Greater than or equal
AttestedComputeSupportedOps.EQ   // Equals
```

**Future Use Case (Quadratic Voting):**
```typescript
// Check if user has minimum cGOV balance for quadratic vote
const hasMinimum = await attestedCompute({
  walletClient,
  lhsHandle: userCGOVHandle,
  op: AttestedComputeSupportedOps.GTE,
  rhsPlaintext: MIN_QUADRATIC_THRESHOLD,
});

if (hasMinimum.plaintext) {
  // Allow quadratic voting
  const sqrtWeight = Math.sqrt(Number(balance));
  await castQuadraticVote(proposalId, sqrtWeight);
}
```

### Attested Reveal (Prepared, Not Active)

**Function:** `attestedReveal()`  
**Location:** `utils/inco.ts` (Line 229)

```typescript
export async function attestedReveal({
  handles,
  backoffConfig,
}: {
  handles: `0x${string}`[];
  backoffConfig?: BackoffConfig;
}): Promise<DecryptionResult[]> {
  console.log("[AttestedReveal] Starting reveal for handles:", handles);
  
  const inco = await getConfig();

  const config = backoffConfig || {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 15000
  };

  try {
    const results = await inco.attestedReveal(handles, config);
    console.log("[AttestedReveal] Success! Got", results.length, "results");
    return results as DecryptionResult[];
  } catch (error) {
    console.error("[AttestedReveal] Failed:", error);
    throw error;
  }
}
```

**Use Case:** For handles marked as "revealed" on-chain via `e.reveal()`
- **No signature required** - anyone can decrypt
- Used for public vote results after voting ends

**Not Yet Implemented** (using ACL-based reveal instead)

---

## 🎯 Component Integration

### ConfidentialVault.tsx

**Inco Features Used:**
- ✅ Batch decryption (2 handles → 1 signature)
- ✅ Session key pattern (0 signatures after session)
- ✅ ACL-aware error handling

**Key Integrations:**
```typescript
// Import Inco utilities
import { 
  getConfig, 
  generateSecp256k1Keypair, 
  type SessionKeyVoucher, 
  DEFAULT_SESSION_VERIFIER 
} from "@/utils/inco";

// Session state
const [sessionData, setSessionData] = useState<{
  keypair: ReturnType<typeof generateSecp256k1Keypair>;
  voucher: SessionKeyVoucher;
  expiresAt: Date;
} | null>(null);

// Create session
const handleCreateSession = async () => {
  const ephemeralKeypair = generateSecp256k1Keypair();
  const voucher = await inco.grantSessionKeyAllowanceVoucher(...);
  setSessionData({ keypair: ephemeralKeypair, voucher, expiresAt });
};

// Decrypt with session
const results = await inco.attestedDecryptWithVoucher(
  sessionData.keypair,
  sessionData.voucher,
  publicClient,
  [sharesHandle, balanceHandle]
);
```

### Proposals.tsx

**Inco Features Used:**
- ✅ Encryption (proposal amounts)
- ✅ Batch decryption (3 vote tallies → 1 signature)
- ✅ Session key pattern (reveal multiple proposals)
- ✅ Fee estimation

**Key Integrations:**
```typescript
// Import Inco utilities
import { 
  encryptValue, 
  getFee, 
  getConfig, 
  generateSecp256k1Keypair, 
  type SessionKeyVoucher, 
  DEFAULT_SESSION_VERIFIER 
} from "@/utils/inco";

// Encrypt proposal amount
const encryptedAmount = await encryptValue({
  value: parseUnits(amount, 6),
  address,
  contractAddress: AZOTH_DAO_ADDRESS,
});

// Reveal 3 vote tallies with session key
const [forHandle, againstHandle, abstainHandle] = votes;
const results = await inco.attestedDecryptWithVoucher(
  sessionData.keypair,
  sessionData.voucher,
  publicClient,
  [forHandle, againstHandle, abstainHandle]
);

const forVotes = formatUnits(results[0].plaintext.value as bigint, 18);
const againstVotes = formatUnits(results[1].plaintext.value as bigint, 18);
const abstainVotes = formatUnits(results[2].plaintext.value as bigint, 18);
```

---

## 🚨 Error Handling

### ACL Disallowed Error

**Cause:** User doesn't have permission to decrypt handle

**Detection:**
```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes("acl disallowed")) {
    console.error("ACL Error: User is not allowed to decrypt this handle");
    // Handle gracefully
  }
}
```

**Solutions:**
1. Ensure user has interacted with contract (purchased cUSDC, deposited, etc.)
2. Verify contract called `.allow(userAddress)` on the handle
3. Check user is using correct wallet address

### Covalidator Timeout

**Retry Configuration:**
```typescript
const backoffConfig = {
  maxRetries: 10,           // Try 10 times
  initialDelay: 3000,       // Wait 3s first time
  maxDelay: 30000,          // Cap at 30s
};

// Exponential backoff: 3s → 6s → 12s → 24s → 30s (capped)
const results = await inco.attestedDecrypt(walletClient, handles, backoffConfig);
```

### Session Expired

**Detection:**
```typescript
const isSessionValid = useMemo(() => {
  if (!sessionData) return false;
  return new Date() < sessionData.expiresAt;
}, [sessionData]);
```

**Handling:**
```typescript
if (!isSessionValid) {
  console.log("Session expired, creating new session...");
  await handleCreateSession();
  return;
}
```

---

## 📋 Best Practices

### 1. Always Use Session Keys for Multiple Decrypts

```typescript
// ❌ BAD: Multiple separate decrypt calls
for (const handle of handles) {
  await decryptValue({ walletClient, handle }); // N MetaMask popups
}

// ✅ GOOD: Create session once, decrypt unlimited
await handleCreateSession(); // 1 MetaMask popup
for (const handle of handles) {
  await decryptWithVoucher({ ephemeralKeypair, voucher, handle }); // 0 popups
}
```

### 2. Use Batch Decryption for Multiple Handles

```typescript
// ❌ BAD: Separate decrypts
const shares = await decryptValue({ walletClient, handle: sharesHandle });
const balance = await decryptValue({ walletClient, handle: balanceHandle });

// ✅ GOOD: Batch decrypt
const results = await inco.attestedDecrypt(walletClient, [sharesHandle, balanceHandle]);
```

### 3. Filter Zero Handles Before Decrypting

```typescript
const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

const validHandles = handles.filter(h => h !== ZERO_HANDLE);
if (validHandles.length === 0) {
  console.log("No valid handles to decrypt");
  return;
}
```

### 4. Always Send Inco Fee with Encrypted Operations

```typescript
const fee = await getFee();
await walletClient.writeContract({
  functionName: "propose",
  args: [description, encryptedAmount, recipient],
  value: fee, // CRITICAL: Must send fee
});
```

### 5. Validate Session Before Using

```typescript
const isSessionValid = useMemo(() => {
  if (!sessionData) return false;
  return new Date() < sessionData.expiresAt;
}, [sessionData]);

if (!isSessionValid) {
  await handleCreateSession();
  return;
}
```

### 6. Use Console Logs for Debugging

All Inco functions include detailed console logs:
```typescript
console.log("[Encrypt] Starting encryption...");
console.log("[Encrypt] Value:", value.toString());
console.log("[Encrypt] Success!");
```

**Enable in DevTools:** Console → Filter: `[Encrypt]`, `[Decrypt]`, `[SessionKey]`

---

## 📊 Performance Metrics

### Session Key Impact

| **Scenario** | **Without Session** | **With Session** | **Improvement** |
|--------------|---------------------|------------------|-----------------|
| Reveal 2 balances | 2 signatures | 1 signature | 50% |
| Reveal 5 proposals (3 tallies each) | 15 signatures | 1 signature | 93% |
| User wait time | ~5 minutes | ~10 seconds | 98% |

### Batch Decryption Impact

| **Operation** | **Individual** | **Batch** | **Improvement** |
|---------------|----------------|-----------|-----------------|
| 2 handles | 2 signatures | 1 signature | 50% |
| 3 handles | 3 signatures | 1 signature | 66% |
| 5 handles | 5 signatures | 1 signature | 80% |

---

## 🔗 Resources

- **Inco Documentation:** https://docs.inco.org/
- **Inco SDK GitHub:** https://github.com/Inco-fhevm/inco-sdk
- **Session Key Guide:** docs/inco-llms.txt (Lines 2512-2596)
- **Contract Integration:** apps/inco-lite-template/INCO_INTEGRATION.md

---

**Built with ❤️ using Inco Lightning Protocol SDK v0.7.10**
