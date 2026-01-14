/**
 * ERC-8004 Agent Registration Script
 *
 * Registers the Azoth DAO AI Agent on the ERC-8004 Identity Registry.
 *
 * Steps:
 * 1. Create agent metadata
 * 2. Upload to IPFS via Pinata
 * 3. Register on-chain
 *
 * Run with: npm run register
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { ERC8004Service, AgentMetadata } from './services/erc8004.service.js';
import { getBuilderDID } from './config/nillion.js';

async function registerAgent() {
  console.log('[REGISTER] ERC-8004 Agent Registration');
  console.log('═'.repeat(50));

  // Check required environment variables
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('[ERROR] PRIVATE_KEY environment variable is required');
    console.log('   Set your wallet private key (with Sepolia ETH for gas)');
    process.exit(1);
  }

  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    console.error('[ERROR] PINATA_JWT environment variable is required');
    console.log('   Get your JWT from https://app.pinata.cloud');
    process.exit(1);
  }

  // Get configuration
  const agentUrl = process.env.AGENT_URL || 'http://localhost:3001';
  const builderDID = getBuilderDID();

  console.log(`[INFO] Agent URL: ${agentUrl}`);
  console.log(`[INFO] Builder DID: ${builderDID}`);

  // Create agent metadata following ERC-8004 spec
  const metadata: AgentMetadata = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'Azoth DAO AI Advisor',
    description:
      'A privacy-preserving DAO proposal AI advisor powered by Nillion. ' +
      'Uses nilAI for secure LLM inference in TEE, nilDB for encrypted data storage, ' +
      'and x402 for pay-per-query payments. All governance conversations are encrypted ' +
      'and processed securely.',
    image: 'https://nillion.com/logo.png',
    endpoints: [
      {
        name: 'A2A',
        endpoint: `${agentUrl}/.well-known/agent-card.json`,
        version: '0.3.0',
      },
      {
        name: 'REST',
        endpoint: `${agentUrl}/api/chat`,
        version: '1.0.0',
      },
      {
        name: 'DID',
        endpoint: builderDID,
        version: 'v1',
      },
    ],
    registrations: [],
    supportedTrust: ['reputation', 'tee-attestation'],
  };

  const erc8004Service = new ERC8004Service();

  try {
    // Step 1: Upload to IPFS
    console.log('\n[UPLOAD] Uploading metadata to IPFS...');
    const tokenURI = await erc8004Service.uploadToIPFS(metadata, pinataJwt);
    console.log(`[SUCCESS] Uploaded: ${tokenURI}`);

    // Step 2: Register on-chain
    console.log('\n[INFO] Registering on Ethereum Sepolia...');
    const result = await erc8004Service.registerAgent(privateKey, tokenURI);

    console.log('\n[SUCCESS] Agent registered successfully!');
    console.log('═'.repeat(50));
    console.log(`[INFO] Transaction: https://sepolia.etherscan.io/tx/${result.transactionHash}`);
    console.log(`[INFO] Registry: ${erc8004Service.getRegistryAddress()}`);
    console.log(`[INFO] Token URI: ${tokenURI}`);

    if (result.agentId) {
      console.log(`[INFO] Agent ID: ${result.agentId}`);
      console.log(`\n[INFO] View on 8004scan:`);
      console.log(`   https://www.8004scan.io/agents/sepolia/${result.agentId}`);

      // Update metadata with registration info
      metadata.registrations = [
        {
          agentId: parseInt(result.agentId),
          agentRegistry: `eip155:11155111:${erc8004Service.getRegistryAddress()}`,
        },
      ];

      // Save registration info
      const registrationInfo = {
        ...metadata,
        transactionHash: result.transactionHash,
        registeredAt: new Date().toISOString(),
      };

      const registrationPath = path.join(process.cwd(), 'registration.json');
      await fs.writeFile(registrationPath, JSON.stringify(registrationInfo, null, 2));
      console.log(`\n[INFO] Registration info saved to ${registrationPath}`);

      console.log('\n═'.repeat(50));
      console.log('  Add this to your .env file:');
      console.log(`  AGENT_ID=${result.agentId}`);
      console.log('═'.repeat(50));
    }
  } catch (error) {
    console.error('\n[ERROR] Registration failed:', error);
    process.exit(1);
  }
}

registerAgent();
