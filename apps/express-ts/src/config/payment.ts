/**
 * Payment Configuration for x402
 *
 * Configures pay-per-query payments using USDC on Base Sepolia testnet.
 */

export const PAYMENT_CONFIG = {
  // Network: Base Sepolia testnet (CAIP-2 format)
  network: 'eip155:84532' as const,

  // x402 facilitator for testnet
  facilitatorUrl: 'https://x402.org/facilitator',

  // USDC token address on Base Sepolia
  usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',

  // Default price per query
  defaultPrice: '$0.01',
};

/**
 * Get the payment wallet address from environment
 */
export function getPaymentWallet(): string {
  const wallet = process.env.PAYMENT_WALLET_ADDRESS;
  if (!wallet) {
    throw new Error('PAYMENT_WALLET_ADDRESS environment variable is required');
  }
  return wallet;
}

/**
 * Get the price per query from environment or use default
 */
export function getQueryPrice(): string {
  return process.env.X402_PRICE || PAYMENT_CONFIG.defaultPrice;
}
