/**
 * ERC-8004 Agent Service
 *
 * Handles agent registration and interaction with the ERC-8004 Identity Registry.
 */

import { createWalletClient, createPublicClient, http, parseAbi, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const IDENTITY_REGISTRY_ABI = parseAbi([
  'function register(string tokenURI) external returns (uint256 agentId)',
  'event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
]);

const CHAIN_CONFIG = {
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { 
    default: { 
      http: [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://rpc2.sepolia.org',
        'https://sepolia.gateway.tenderly.co',
        'https://rpc.sepolia.org'
      ] 
    } 
  },
  blockExplorers: { default: { name: 'Explorer', url: 'https://sepolia.etherscan.io' } },
};

const IDENTITY_REGISTRY = '0x8004a6090Cd10A7288092483047B097295Fb8847';

export interface AgentMetadata {
  type: string;
  name: string;
  description: string;
  image: string;
  endpoints: Array<{
    name: string;
    endpoint: string;
    version?: string;
    capabilities?: Record<string, unknown>;
  }>;
  registrations: Array<{
    agentId: number | string;
    agentRegistry: string;
  }>;
  supportedTrust: string[];
}

export class ERC8004Service {
  private publicClient: ReturnType<typeof createPublicClient>;

  constructor() {
    this.publicClient = createPublicClient({
      chain: CHAIN_CONFIG,
      transport: http(undefined, {
        timeout: 60_000,
        retryCount: 3,
        retryDelay: 1000,
      }),
    });
  }

  async uploadToIPFS(metadata: AgentMetadata, pinataJwt: string): Promise<string> {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name: 'azoth-dao-agent.json' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata upload failed: ${response.statusText} - ${error}`);
    }

    const result = await response.json() as { IpfsHash: string };
    return `ipfs://${result.IpfsHash}`;
  }

  async registerAgent(privateKey: string, tokenURI: string): Promise<{
    transactionHash: string;
    agentId: string | null;
  }> {
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(formattedKey as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      chain: CHAIN_CONFIG,
      transport: http(undefined, {
        timeout: 60_000,
        retryCount: 3,
        retryDelay: 1000,
      }),
    });

    const hash = await walletClient.writeContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'register',
      args: [tokenURI],
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    const REGISTERED_EVENT_SIG = '0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a';
    
    const registeredLog = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === IDENTITY_REGISTRY.toLowerCase() &&
        log.topics[0] === REGISTERED_EVENT_SIG
    );

    let agentId: string | null = null;
    if (registeredLog) {
      try {
        const decoded = decodeEventLog({
          abi: IDENTITY_REGISTRY_ABI,
          data: registeredLog.data,
          topics: registeredLog.topics,
        });
        if (decoded.eventName === 'Registered' && decoded.args) {
          agentId = (decoded.args as { agentId: bigint }).agentId.toString();
        }
      } catch (e) {
        console.warn('Could not decode event log');
      }
    }

    return {
      transactionHash: hash,
      agentId,
    };
  }

  async getAgentMetadata(agentId: number): Promise<{
    tokenURI: string;
    owner: string;
  }> {
    const tokenURI = await this.publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'tokenURI',
      args: [BigInt(agentId)],
    }) as string;

    const owner = await this.publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'ownerOf',
      args: [BigInt(agentId)],
    }) as string;

    return { tokenURI, owner };
  }

  getRegistryAddress(): string {
    return IDENTITY_REGISTRY;
  }
}
