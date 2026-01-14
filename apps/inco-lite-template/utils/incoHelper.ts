import { AttestedComputeSupportedOps, Lightning, generateSecp256k1Keypair } from '@inco/js/lite';
import { handleTypes, type HexString } from '@inco/js';
import { publicClient } from './wallet';
import type { WalletClient, Hex, PublicClient } from 'viem';
import { bytesToHex, pad, toHex } from 'viem';

// Re-export for convenience
export { AttestedComputeSupportedOps, generateSecp256k1Keypair };

let zap: any = null;

// Default session verifier address for Base Sepolia
export const DEFAULT_SESSION_VERIFIER = "0xc34569efc25901bdd6b652164a2c8a7228b23005";

const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Type for session key voucher
export interface SessionKeyVoucher {
  voucher: unknown;
  signature: `0x${string}`;
}

// Type for decryption result
export interface DecryptionResult {
  handle: HexString;
  plaintext: {
    value: bigint | boolean;
    type: string;
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

// Get or initialize the Inco configuration based on the current chain
export async function getConfig() {
  if (zap) return zap;

  const chainId = publicClient.chain.id;
  console.log(`Initializing Inco config for chain: ${chainId}`);

  if (chainId === 31337) {
    zap = await Lightning.localNode(); // Local Anvil node
  } else if (chainId === 84532) {
    zap = await Lightning.latest('testnet', 84532); // Base Sepolia
  } 
  else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return zap;

}

// Encrypt a value for a specific contract and account
export async function encryptValue({
  value,
  address,
  contractAddress,
}: {
  value: bigint;
  address: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<Hex> {
  const zap = await getConfig();

  const encryptedData = await zap.encrypt(value, {
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,
  });

  // Ensure it's treated as dynamic bytes, not bytes32
  return encryptedData as Hex;
}

// Re-encrypt and decrypt a handle for a specific wallet
export async function decryptValue({
  walletClient,
  handle,
}: {
  walletClient: WalletClient;
  handle: string;
}): Promise<bigint> {
  const zap = await getConfig();

  // Get attested decrypt for the wallet
  const attestedDecrypt = await zap.attestedDecrypt(
    walletClient,
    [handle],
  );

  // Return the decrypted value
  return attestedDecrypt[0].plaintext.value;
}

export const attestedCompute = async ({
  walletClient,
  lhsHandle,
  op,
  rhsPlaintext,
}: {
  walletClient: WalletClient;
  lhsHandle: `0x${string}`;
  op: (typeof AttestedComputeSupportedOps)[keyof typeof AttestedComputeSupportedOps];
  rhsPlaintext: any;
}) => {
  const zap = await getConfig();

  const result = await zap.attestedCompute(
    walletClient as WalletClient,
    lhsHandle as `0x${string}`,
    op,
    rhsPlaintext
  );

  // Convert Uint8Array signatures to hex strings
  const signatures = result.covalidatorSignatures.map((sig: Uint8Array) => bytesToHex(sig));

  // Encode the plaintext value as bytes32
  const encodedValue = pad(toHex(result.plaintext.value ? 1 : 0), { size: 32 });

  // Return in format expected by contract
  return {
    plaintext: result.plaintext.value,
    attestation: {
      handle: result.handle,
      value: encodedValue,
    },
    signature: signatures,
  };
};

// Get the fee required for Inco operations
export async function getFee(): Promise<bigint> {
  const zap = await getConfig();
  
  const fee = await publicClient.readContract({
    address: zap.executorAddress,
    abi: [
      {
        type: 'function',
        inputs: [],
        name: 'getFee',
        outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
        stateMutability: 'pure',
      },
    ],
    functionName: 'getFee',
  });

  return fee;
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
  console.log('[AttestedReveal] Starting reveal for handles:', handles);
  
  const zap = await getConfig();

  const config = backoffConfig || {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 15000
  };

  try {
    const results = await zap.attestedReveal(handles, config);
    console.log('[AttestedReveal] Success! Got', results.length, 'results');
    return results as DecryptionResult[];
  } catch (error) {
    console.error('[AttestedReveal] Failed:', error);
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
  walletClient: WalletClient;
  handle: `0x${string}`;
  backoffConfig?: BackoffConfig;
}): Promise<{
  plaintext: bigint;
  attestation: DecryptionAttestation;
  signatures: `0x${string}`[];
}> {
  console.log('[DecryptWithAttestation] Starting...');
  console.log('[DecryptWithAttestation] Handle:', handle);
  
  if (handle === ZERO_HANDLE) {
    console.log('[DecryptWithAttestation] Handle is zero, returning 0');
    return {
      plaintext: 0n,
      attestation: { handle, value: pad('0x0', { size: 32 }) as `0x${string}` },
      signatures: [],
    };
  }
  
  const zap = await getConfig();

  const config = backoffConfig || {
    maxRetries: 10,
    initialDelay: 3000,
    maxDelay: 30000
  };

  try {
    const attestedDecrypt = await zap.attestedDecrypt(
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

    console.log('[DecryptWithAttestation] Success! Value:', plaintext.toString());

    return {
      plaintext,
      attestation: {
        handle: result.handle as `0x${string}`,
        value: encodedValue,
      },
      signatures,
    };
  } catch (error) {
    console.error('[DecryptWithAttestation] Failed:', error);
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
  walletClient: WalletClient;
  granteeAddress: `0x${string}`;
  expiresAt: Date;
  sessionVerifier?: `0x${string}`;
}): Promise<SessionKeyVoucher> {
  console.log('[SessionKey] Granting session key voucher...');
  console.log('[SessionKey] Grantee:', granteeAddress);
  console.log('[SessionKey] Expires:', expiresAt.toISOString());
  
  const zap = await getConfig();

  try {
    const voucherWithSig = await zap.grantSessionKeyAllowanceVoucher(
      walletClient,
      granteeAddress,
      expiresAt,
      sessionVerifier
    );

    console.log('[SessionKey] Voucher granted successfully!');
    return voucherWithSig as SessionKeyVoucher;
  } catch (error) {
    console.error('[SessionKey] Failed to grant voucher:', error);
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
  console.log('[DecryptWithVoucher] Starting delegated decryption...');
  console.log('[DecryptWithVoucher] Handles:', handles.length);
  
  const zap = await getConfig();

  try {
    const results = await zap.attestedDecryptWithVoucher(
      ephemeralKeypair,
      voucher,
      client,
      handles,
      reencryptPubKey
    );

    console.log('[DecryptWithVoucher] Success! Got', results.length, 'results');
    return results as DecryptionResult[];
  } catch (error) {
    console.error('[DecryptWithVoucher] Failed:', error);
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
  console.log('[ComputeWithVoucher] Starting delegated computation...');
  console.log('[ComputeWithVoucher] Handle:', handle);
  
  const zap = await getConfig();

  try {
    const result = await zap.attestedComputeWithVoucher(
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

    console.log('[ComputeWithVoucher] Success! Result:', result.plaintext.value);

    return {
      plaintext: result.plaintext.value as boolean,
      attestation: {
        handle: result.handle as `0x${string}`,
        value: encodedValue,
      },
      signatures,
    };
  } catch (error) {
    console.error('[ComputeWithVoucher] Failed:', error);
    throw error;
  }
}

/**
 * Decrypt multiple handles in a single request
 */
export async function decryptMultiple({
  walletClient,
  handles,
  backoffConfig,
}: {
  walletClient: WalletClient;
  handles: `0x${string}`[];
  backoffConfig?: BackoffConfig;
}): Promise<Map<`0x${string}`, bigint>> {
  console.log('[DecryptMultiple] Decrypting', handles.length, 'handles...');
  
  // Filter out zero handles
  const validHandles = handles.filter(h => h !== ZERO_HANDLE);
  
  if (validHandles.length === 0) {
    console.log('[DecryptMultiple] No valid handles to decrypt');
    return new Map();
  }
  
  const zap = await getConfig();

  const config = backoffConfig || {
    maxRetries: 10,
    initialDelay: 3000,
    maxDelay: 30000
  };

  try {
    const results = await zap.attestedDecrypt(
      walletClient, 
      validHandles,
      config
    );

    const decryptedMap = new Map<`0x${string}`, bigint>();
    results.forEach((result: DecryptionResult, index: number) => {
      decryptedMap.set(validHandles[index], result.plaintext.value as bigint);
    });

    console.log('[DecryptMultiple] Success! Decrypted', decryptedMap.size, 'values');
    return decryptedMap;
  } catch (error) {
    console.error('[DecryptMultiple] Failed:', error);
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
}): Promise<Hex> {
  console.log('[EncryptBool] Starting encryption...');
  
  const zap = await getConfig();

  try {
    const encryptedData = await zap.encrypt(value, {
      accountAddress: address,
      dappAddress: contractAddress,
      handleType: handleTypes.ebool,
    });

    console.log('[EncryptBool] Success!');
    return encryptedData as Hex;
  } catch (error) {
    console.error('[EncryptBool] Failed:', error);
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
}): Promise<Hex> {
  console.log('[EncryptAddress] Starting encryption...');
  
  const zap = await getConfig();

  try {
    const addressAsBigInt = BigInt(addressToEncrypt);
    
    const encryptedData = await zap.encrypt(addressAsBigInt, {
      accountAddress: accountAddress,
      dappAddress: contractAddress,
      handleType: handleTypes.euint160,
    });

    console.log('[EncryptAddress] Success!');
    return encryptedData as Hex;
  } catch (error) {
    console.error('[EncryptAddress] Failed:', error);
    throw error;
  }
}

/**
 * Revoke all active session key vouchers
 */
export async function revokeAllVouchers({
  walletClient,
}: {
  walletClient: WalletClient;
}): Promise<`0x${string}`> {
  console.log('[RevokeVouchers] Revoking all session key vouchers...');
  
  const zap = await getConfig();

  try {
    const txHash = await zap.updateActiveVouchersSessionNonce(walletClient);
    console.log('[RevokeVouchers] Success! Transaction:', txHash);
    return txHash as `0x${string}`;
  } catch (error) {
    console.error('[RevokeVouchers] Failed:', error);
    throw error;
  }
}