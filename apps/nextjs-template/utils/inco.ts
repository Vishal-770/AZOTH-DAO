import { AttestedComputeSupportedOps, Lightning, generateSecp256k1Keypair } from "@inco/js/lite";
import { handleTypes, type HexString } from "@inco/js";
import type { WalletClient, Transport, Account, Chain, PublicClient } from "viem";
import { bytesToHex, createPublicClient, http, pad, toHex } from "viem";
import { baseSepolia } from "viem/chains";

export type IncoWalletClient = WalletClient<Transport, Chain, Account>;

// Re-export for convenience
export { AttestedComputeSupportedOps, generateSecp256k1Keypair };

const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Default session verifier address for Base Sepolia
export const DEFAULT_SESSION_VERIFIER = "0xc34569efc25901bdd6b652164a2c8a7228b23005";

// Type for session key voucher - use unknown and cast at runtime to avoid import issues
export type SessionKeyVoucher = unknown;

// Type for decryption result
export interface DecryptionResult {
  handle: HexString;
  plaintext: {
    value: bigint | boolean;
    type: number;
  };
  covalidatorSignatures: Uint8Array[];
  encryptedPlaintext?: {
    ciphertext: { value: HexString };
  };
}

// Type for attestation result to submit on-chain
export interface DecryptionAttestation {
  handle: `0x${string}`;
  value: `0x${string}`;
}

// Backoff configuration for retry logic
export interface BackoffConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function getConfig() {
  const chainId = publicClient.chain.id;
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

export function isValidHandle(handle: string): boolean {
  return handle !== ZERO_HANDLE && handle !== "0x" && handle.length === 66;
}

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
  if (contractAddress) {
    console.log("[Decrypt] Contract:", contractAddress);
  }
  
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
    return fee;
  } catch (error) {
    console.error("[Fee] Failed to get fee:", error);
    throw error;
  }
}

// ============ NEW INCO FEATURES ============

/**
 * Attested Reveal - For publicly revealed handles
 * Use this when the contract has called e.reveal() on a handle
 * Anyone can request decryption attestation for revealed handles
 */
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

/**
 * Decrypt with full attestation - Returns both plaintext and attestation for on-chain verification
 * Use this when you need to submit the decryption result back on-chain
 */
export async function decryptWithAttestation({
  walletClient,
  handle,
  backoffConfig,
}: {
  walletClient: IncoWalletClient;
  handle: `0x${string}`;
  backoffConfig?: BackoffConfig;
}): Promise<{
  plaintext: bigint;
  attestation: DecryptionAttestation;
  signatures: `0x${string}`[];
}> {
  console.log("[DecryptWithAttestation] Starting...");
  console.log("[DecryptWithAttestation] Handle:", handle);
  
  if (handle === ZERO_HANDLE) {
    console.log("[DecryptWithAttestation] Handle is zero, returning 0");
    return {
      plaintext: 0n,
      attestation: { handle, value: pad("0x0", { size: 32 }) as `0x${string}` },
      signatures: [],
    };
  }
  
  const inco = await getConfig();

  const config = backoffConfig || {
    maxRetries: 10,
    initialDelay: 3000,
    maxDelay: 30000
  };

  try {
    const attestedDecrypt = await inco.attestedDecrypt(
      walletClient, 
      [handle],
      config
    );

    const result = attestedDecrypt[0];
    const plaintext = result.plaintext.value as bigint;
    const signatures = result.covalidatorSignatures.map((sig: Uint8Array) =>
      bytesToHex(sig) as `0x${string}`
    );

    // Encode the plaintext value as bytes32 for on-chain verification
    const encodedValue = pad(toHex(plaintext), { size: 32 }) as `0x${string}`;

    console.log("[DecryptWithAttestation] Success! Value:", plaintext.toString());

    return {
      plaintext,
      attestation: {
        handle: result.handle as `0x${string}`,
        value: encodedValue,
      },
      signatures,
    };
  } catch (error) {
    console.error("[DecryptWithAttestation] Failed:", error);
    throw error;
  }
}

/**
 * Grant a session key allowance voucher
 * This allows delegated decryption without requiring the user to sign each request
 */
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

/**
 * Decrypt using a session key voucher (delegated decryption)
 * No wallet signature required for each decryption
 */
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
      ephemeralKeypair,
      voucher,
      client,
      handles,
      reencryptPubKey
    );

    console.log("[DecryptWithVoucher] Success! Got", results.length, "results");
    return results as DecryptionResult[];
  } catch (error) {
    console.error("[DecryptWithVoucher] Failed:", error);
    throw error;
  }
}

/**
 * Compute with session key voucher (delegated computation)
 */
export async function computeWithVoucher({
  ephemeralKeypair,
  voucher,
  publicClient: client,
  handle,
  op,
  rhsPlaintext,
}: {
  ephemeralKeypair: ReturnType<typeof generateSecp256k1Keypair>;
  voucher: SessionKeyVoucher;
  publicClient: PublicClient;
  handle: `0x${string}`;
  op: (typeof AttestedComputeSupportedOps)[keyof typeof AttestedComputeSupportedOps];
  rhsPlaintext: bigint;
}): Promise<{
  plaintext: boolean;
  attestation: DecryptionAttestation;
  signatures: `0x${string}`[];
}> {
  console.log("[ComputeWithVoucher] Starting delegated computation...");
  console.log("[ComputeWithVoucher] Handle:", handle);
  
  const inco = await getConfig();

  try {
    const result = await inco.attestedComputeWithVoucher(
      ephemeralKeypair,
      voucher,
      client,
      handle,
      op,
      rhsPlaintext
    );

    const signatures = result.covalidatorSignatures.map((sig: Uint8Array) =>
      bytesToHex(sig) as `0x${string}`
    );

    const encodedValue = pad(toHex(result.plaintext.value ? 1 : 0), { size: 32 }) as `0x${string}`;

    console.log("[ComputeWithVoucher] Success! Result:", result.plaintext.value);

    return {
      plaintext: result.plaintext.value as boolean,
      attestation: {
        handle: result.handle as `0x${string}`,
        value: encodedValue,
      },
      signatures,
    };
  } catch (error) {
    console.error("[ComputeWithVoucher] Failed:", error);
    throw error;
  }
}

/**
 * Decrypt multiple handles in a single request
 * More efficient than multiple single decryption calls
 */
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

    console.log("[DecryptMultiple] Success! Decrypted", decryptedMap.size, "values");
    return decryptedMap;
  } catch (error) {
    console.error("[DecryptMultiple] Failed:", error);
    throw error;
  }
}

/**
 * Encrypt a boolean value
 */
export async function encryptBool({
  value,
  address,
  contractAddress,
}: {
  value: boolean;
  address: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<`0x${string}`> {
  console.log("[EncryptBool] Starting encryption...");
  console.log("[EncryptBool] Value:", value);
  
  const inco = await getConfig();

  try {
    const encryptedData = await inco.encrypt(value, {
      accountAddress: address,
      dappAddress: contractAddress,
      handleType: handleTypes.ebool,
    });

    console.log("[EncryptBool] Success!");
    return encryptedData as `0x${string}`;
  } catch (error) {
    console.error("[EncryptBool] Failed:", error);
    throw error;
  }
}

/**
 * Encrypt an address value (as euint160)
 */
export async function encryptAddress({
  addressToEncrypt,
  accountAddress,
  contractAddress,
}: {
  addressToEncrypt: `0x${string}`;
  accountAddress: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<`0x${string}`> {
  console.log("[EncryptAddress] Starting encryption...");
  console.log("[EncryptAddress] Address to encrypt:", addressToEncrypt);
  
  const inco = await getConfig();

  try {
    // Convert address to BigInt for encryption
    const addressAsBigInt = BigInt(addressToEncrypt);
    
    const encryptedData = await inco.encrypt(addressAsBigInt, {
      accountAddress: accountAddress,
      dappAddress: contractAddress,
      handleType: handleTypes.euint160,
    });

    console.log("[EncryptAddress] Success!");
    return encryptedData as `0x${string}`;
  } catch (error) {
    console.error("[EncryptAddress] Failed:", error);
    throw error;
  }
}

/**
 * Revoke all active session key vouchers
 * This will invalidate all existing vouchers
 */
export async function revokeAllVouchers({
  walletClient,
}: {
  walletClient: IncoWalletClient;
}): Promise<`0x${string}`> {
  console.log("[RevokeVouchers] Revoking all session key vouchers...");
  
  const inco = await getConfig();

  try {
    const txHash = await inco.updateActiveVouchersSessionNonce(walletClient);
    console.log("[RevokeVouchers] Success! Transaction:", txHash);
    return txHash as `0x${string}`;
  } catch (error) {
    console.error("[RevokeVouchers] Failed:", error);
    throw error;
  }
}
