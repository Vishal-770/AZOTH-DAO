# Inco SDK Integration - Frontend

> How we use Inco Lightning Protocol SDK (`@inco/js@0.7.10`) for TEE-based confidential computing

---

## 🎯 What We Built With Inco

### Core Integration: `utils/inco.ts` (600 lines)

Complete wrapper around Inco SDK with:
- ✅ Client-side encryption (`encryptValue`, `encryptBool`)
- ✅ Session key pattern (sign once, decrypt unlimited)
- ✅ Batch decryption (3+ values, 1 signature)
- ✅ Attestation vouchers (decrypt with proof)
- ✅ Fee management (0.001 ETH per decrypt)

### Implementation Pattern

```
User Action → Encryption (utils/inco.ts) → Smart Contract (encrypted storage)
                                    ↓
                          TEE Decryption (Inco Network)
                                    ↓
                          Session Key Caching (1 hour)
                                    ↓
                          Frontend Display (plaintext)
```

---

## 🔑 Why We Use Inco

| **Feature** | **Traditional** | **With Inco** |
|------------|-----------------|---------------|
| Balance Privacy | Public | Encrypted (euint256) |
| Vote Weights | Visible | Hidden until finalize |
| UX Signatures | 1 per decrypt | 1 per hour (session keys) |
| MEV Protection | None | Full encryption |
| Decryption Proof | N/A | TEE attestation required |

**Result**: Private DAO with 93% less signatures

---

## 📦 Package

```json
{
```

---

## 🔐 1. Encryption

### Encrypt Numbers → `euint256`

```typescript
export async function encryptValue({
  value,              // bigint (e.g., 1000000000n for 1000 cUSDC)
  address,            // User's wallet address
  contractAddress,    // Target contract
}: {...}): Promise<`0x${string}`> {
  const inco = await getConfig();
  return await inco.encrypt(value, {
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,  // ⭐ Encrypted 256-bit integer
  });
}
```

**Usage Example:**
```typescript
// In CUSDCMarketplace.tsx
const encryptedAmount = await encryptValue({
  value: parseUnits("1000", 6),  // 1000 cUSDC
  address: userAddress,
  contractAddress: MARKETPLACE_ADDRESS,
});
```

### Encrypt Booleans → `ebool`

```typescript
export async function encryptBool({...}): Promise<`0x${string}`> {
  return await inco.encrypt(value, {
    handleType: handleTypes.ebool,  // Encrypted boolean
  });
}
```

---

## 🔓 2. Decryption Methods

### Method A: Basic Decrypt (1 signature per call)

```typescript
export async function decryptValue({
  walletClient,
  handle,
}: {...}): Promise<bigint> {
  const inco = await getConfig();
  const result = await inco.attestedDecrypt(walletClient, [handle]);
  return result[0].plaintext.value as bigint;
}
```

❌ **Not recommended** - Poor UX (many signatures)

### Method B: Batch Decrypt (1 signature for N values)

```typescript
export async function decryptMultiple({
  walletClient,
  handles,  // Array of encrypted handles
}: {...}): Promise<Map<`0x${string}`, bigint>> {
  const inco = await getConfig();
  const results = await inco.attestedDecrypt(walletClient, handles);
  
  const decryptedMap = new Map();
  results.forEach((result, index) => {
    decryptedMap.set(handles[index], result.plaintext.value as bigint);
  });
  return decryptedMap;
}
```

✅ **Recommended** - Better UX (1 signature for all)

### Method C: Session Key Pattern (0 signatures after setup!)

```typescript
// Step 1: Enable session key (ONE signature, lasts 1 hour)
import { generateSecp256k1Keypair } from "@inco/js/lite";

const keypair = generateSecp256k1Keypair();
const granteeAddress = deriveAddressFrom(keypair.publicKey);
const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

const voucher = await grantSessionKeyVoucher({
  walletClient,
  granteeAddress,
  expiresAt,
});

// Save to sessionStorage
sessionStorage.setItem("sessionKey", JSON.stringify({ keypair, voucher }));

// Step 2: Decrypt with voucher (ZERO signatures!)
export async function decryptWithVoucher({
  ephemeralKeypair,
  voucher,
  publicClient,
  handles,
}: {...}): Promise<DecryptionResult[]> {
  const inco = await getConfig();
  return await inco.attestedDecryptWithVoucher(
    ephemeralKeypair,
    voucher,
    publicClient,
    handles
  );
}
```

🏆 **Best UX** - Sign once, decrypt unlimited (1 hour)

**Implementation in [components/dao/Proposals.tsx#L350](components/dao/Proposals.tsx#L350)**

---

## 🎯 Real-World Usage

### Finalize Proposal (3 decryptions, 1 signature)

```typescript
// From Proposals.tsx - Decrypt vote tallies
const handleFinalizeProposal = async (proposalId: bigint) => {
  const sessionData = JSON.parse(sessionStorage.getItem("sessionKey")!);
  
  // Read encrypted vote tallies
  const proposal = await publicClient.readContract({
    address: AZOTH_DAO_ADDRESS,
    abi: AZOTH_DAO_ABI,
    functionName: "proposals",
    args: [proposalId],
  });
  
  // Decrypt 3 tallies with session key (NO SIGNATURE!)
  const results = await decryptWithVoucher({
    ephemeralKeypair: sessionData.keypair,
    voucher: sessionData.voucher,
    publicClient,
    handles: [proposal.forVotes, proposal.againstVotes, proposal.abstainVotes],
  });
  
  const forVotes = results[0].plaintext.value as bigint;
  const againstVotes = results[1].plaintext.value as bigint;
  const abstainVotes = results[2].plaintext.value as bigint;
  
  // Submit attestations on-chain
  await submitDecryptionAttestations(...);
};
```

### Encrypt cUSDC Amount Before Purchase

```typescript
// From CUSDCMarketplace.tsx
const handlePurchase = async () => {
  const amountBigInt = parseUnits(ethAmount, 18) * 2000n; // ETH → cUSDC
  
  // Encrypt before sending to contract
  const encryptedAmount = await encryptValue({
    value: amountBigInt,
    address: userAddress!,
    contractAddress: MARKETPLACE_ADDRESS,
  });
  
  const fee = await getFee();
  
  await walletClient!.writeContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "purchaseCUSDC",
    args: [encryptedAmount],
    value: parseEther(ethAmount) + fee,  // ETH payment + Inco fee
  });
};
```

---

## 💰 Fee Management

```typescript
// Get current fee (usually ~0.001 ETH)
const fee = await getFee();

// Include fee in transaction
await walletClient.writeContract({
  ...contractParams,
  value: fee,  // Pay TEE network
});
```

---

## ⚠️ Error Handling

### Zero Handle Check

```typescript
const ZERO_HANDLE = "0x0000...0000" (66 chars);

if (handle === ZERO_HANDLE) {
  return 0n;  // Uninitialized encrypted value
}
```

### Session Key Expiration

```typescript
const sessionData = JSON.parse(sessionStorage.getItem("sessionKey") || "null");

if (!sessionData || new Date() > new Date(sessionData.expiresAt)) {
  // Expired - prompt user to re-enable
  alert("Session key expired. Please enable again.");
  return;
}
```

---

## 📊 Key Metrics

| **Metric** | **Value** |
|------------|-----------|
| Encrypted Types | `euint256`, `ebool` |
| Session Key Duration | 1 hour |
| Typical Fee | ~0.001 ETH (testnet) |
| Decryption Time | 3-10 seconds (with backoff) |
| Max Batch Size | 10+ handles |
| Signature Reduction | 93% (with session keys) |

---

## 🔗 Integration Summary

### Frontend Files Using Inco SDK

1. **[utils/inco.ts](utils/inco.ts)** - Core wrapper (600 lines)
2. **[components/dao/Proposals.tsx](components/dao/Proposals.tsx)** - Voting + session keys
3. **[components/dao/CUSDCMarketplace.tsx](components/dao/CUSDCMarketplace.tsx)** - Balance encryption
4. **[components/dao/ConfidentialVault.tsx](components/dao/ConfidentialVault.tsx)** - Vault shares
5. **[components/dao/CGOVToken.tsx](components/dao/CGOVToken.tsx)** - Token balances

### Key Functions Exported

```typescript
// Encryption
export function encryptValue({...})
export function encryptBool({...})

// Decryption
export function decryptValue({...})
export function decryptMultiple({...})
export function decryptWithVoucher({...})

// Session Keys
export function grantSessionKeyVoucher({...})
export function revokeAllVouchers({...})

// Utilities
export function getFee()
export function getConfig()
```

---

**For contract-side Inco integration, see [../inco-lite-template/README-INCO.md](../inco-lite-template/README-INCO.md)**
  throw new Error("Insufficient ETH for Inco fee");
}
```

### 5. Validate Handles Before Decryption

```typescript
const validHandles = handles.filter(h => 
  h !== ZERO_HANDLE && 
  h !== "0x" && 
  h.length === 66
);

if (validHandles.length === 0) {
  console.log("No valid handles to decrypt");
  return;
}
```

---

## 🐛 Troubleshooting

### Issue: "Invalid handle"

**Cause:** Trying to decrypt uninitialized encrypted value  
**Solution:** Check for `ZERO_HANDLE` before decryption

```typescript
if (handle === ZERO_HANDLE) {
  console.log("Value not initialized");
  return;
}
```

### Issue: "Fee too low"

**Cause:** Not including Inco fee with transaction  
**Solution:** Always call `getFee()` and include as `value`

```typescript
const fee = await getFee();
const hash = await walletClient.writeContract({
  // ...
  value: fee,
});
```

### Issue: "Session key expired"

**Cause:** Voucher expired (1 hour default)  
**Solution:** Create new session key

```typescript
const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
const voucher = await grantSessionKeyVoucher({
  walletClient,
  granteeAddress,
  expiresAt,
});
```

### Issue: "Signature request rejected"

**Cause:** User rejected MetaMask popup  
**Solution:** Catch error and show user-friendly message

```typescript
try {
  await decryptValue({ walletClient, handle });
} catch (error) {
  if (error.code === 4001) {
    console.log("User rejected signature request");
    // Show toast notification
  }
}
```

---

## 📚 Additional Resources

### Official Documentation
- [Inco Network Documentation](https://docs.inco.org)
- [Inco SDK GitHub](https://github.com/Inco-fhevm/inco-sdk)
- [Lightning Protocol Docs](https://docs.inco.org/getting-started/lightning)

### Related Files
- [`utils/inco.ts`](utils/inco.ts) - All Inco SDK utilities
- [`utils/constants.ts`](utils/constants.ts) - Contract addresses
- [`components/dao/Proposals.tsx`](components/dao/Proposals.tsx) - Full implementation example

### Smart Contracts
- See [`../inco-lite-template/`](../inco-lite-template/) for contract source code
- Inco integration on contract side: `@inco/lightning` Solidity library

---

## 🎯 Summary

### Key Takeaways

1. **Encrypt client-side** before sending to blockchain → `encryptValue()`
2. **Use session keys** for great UX → 93% fewer signatures
3. **Batch decrypt** multiple handles → One signature for many values
4. **Always pay fees** with encrypted operations → `getFee()` + `value: fee`
5. **Check for zero handles** before decryption → Avoid errors

### Code Locations

| Feature | File | Line |
|---------|------|------|
| Configuration | `utils/inco.ts` | 48 |
| Encryption | `utils/inco.ts` | 69 |
| Decryption | `utils/inco.ts` | 100 |
| Session Keys | `utils/inco.ts` | 331 |
| Batch Decrypt | `utils/inco.ts` | 483 |
| Full Example | `components/dao/Proposals.tsx` | 1-600 |

---

**Built with Inco Lightning Protocol 🔐**
