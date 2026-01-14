/**
 * nilDB Service - DAO Chat Storage
 *
 * Handles encrypted storage of DAO proposal chat conversations using
 * Nillion's SecretVaults SDK.
 */

import { SecretVaultBuilderClient } from '@nillion/secretvaults';
import { randomUUID } from 'node:crypto';

/**
 * DAO Chat Collection Schema
 */
export const daoChatSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'array',
  items: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'Unique record identifier',
      },
      session_id: {
        type: 'string',
        description: 'Chat session identifier',
      },
      user_wallet: {
        type: 'string',
        description: 'User wallet address (for history lookup)',
      },
      proposal_context: {
        type: 'object',
        properties: {
          '%share': {
            type: 'string',
          },
        },
        required: ['%share'],
        description: 'Encrypted proposal context',
      },
      user_prompt: {
        type: 'object',
        properties: {
          '%share': {
            type: 'string',
          },
        },
        required: ['%share'],
        description: 'Encrypted user question',
      },
      agent_response: {
        type: 'object',
        properties: {
          '%share': {
            type: 'string',
          },
        },
        required: ['%share'],
        description: 'Encrypted AI response',
      },
      payment_tx_hash: {
        type: 'string',
        description: 'Payment transaction hash',
      },
      timestamp: {
        type: 'string',
        description: 'ISO timestamp',
      },
    },
    required: ['_id', 'session_id', 'user_prompt', 'timestamp'],
  },
};

export class NilDBService {
  private client: SecretVaultBuilderClient;
  private collectionId: string;

  constructor(client: SecretVaultBuilderClient, collectionId: string) {
    this.client = client;
    this.collectionId = collectionId;
  }

  static async initialize(
    client: SecretVaultBuilderClient,
    existingCollectionId?: string
  ): Promise<NilDBService> {
    if (existingCollectionId) {
      console.log('[INFO] Using existing collection:', existingCollectionId);
      return new NilDBService(client, existingCollectionId);
    }

    const collectionId = await NilDBService.createCollection(client);
    return new NilDBService(client, collectionId);
  }

  private static async createCollection(
    client: SecretVaultBuilderClient
  ): Promise<string> {
    const collectionId = randomUUID();

    await client.createCollection({
      _id: collectionId,
      type: 'standard',
      name: 'DAO Proposal Chat History',
      schema: daoChatSchema,
    });

    console.log('[SUCCESS] Created nilDB collection:', collectionId);
    return collectionId;
  }

  /**
   * Store an encrypted chat prompt with proposal context
   */
  async storePrompt(
    sessionId: string,
    prompt: string,
    proposalContext?: string,
    paymentTxHash?: string,
    userWallet?: string
  ): Promise<string> {
    const recordId = randomUUID();

    console.log('[ENCRYPT] Encrypting and storing prompt...');
    console.log('   [INFO] Session:', sessionId);
    console.log('   [INFO] Prompt length:', prompt.length, 'chars');

    const recordData: any[] = [
      {
        _id: recordId,
        session_id: sessionId,
        user_wallet: userWallet || '',
        user_prompt: {
          '%share': prompt,
        },
        payment_tx_hash: paymentTxHash || '',
        timestamp: new Date().toISOString(),
      },
    ];

    if (proposalContext) {
      recordData[0].proposal_context = {
        '%share': proposalContext,
      };
    }

    await this.client.createStandardData({
      body: {
        collection: this.collectionId,
        data: recordData,
      },
    });

    console.log('[SUCCESS] Encrypted prompt stored in nilDB');
    return recordId;
  }

  /**
   * Update a chat record with the AI response
   */
  async storeResponse(recordId: string, response: string): Promise<void> {
    console.log('[ENCRYPT] Encrypting and storing response...');
    
    await this.client.updateData({
      collection: this.collectionId,
      filter: {
        _id: recordId,
      },
      update: {
        $set: {
          agent_response: {
            '%share': response,
          },
        },
      },
    });

    console.log('[SUCCESS] Encrypted response stored in nilDB');
  }

  /**
   * Get chat history for a session
   */
  async getSessionHistory(sessionId: string): Promise<any[]> {
    const result = await this.client.findData({
      collection: this.collectionId,
      filter: {
        session_id: sessionId,
      },
    });

    return result.data || [];
  }

  /**
   * Get all chat history for a user wallet
   */
  async getUserHistory(userWallet: string): Promise<any[]> {
    const result = await this.client.findData({
      collection: this.collectionId,
      filter: {
        user_wallet: userWallet,
      },
    });

    return result.data || [];
  }

  getCollectionId(): string {
    return this.collectionId;
  }

  /**
   * Get all records from the collection (for debugging)
   */
  async getAllRecords(): Promise<any[]> {
    const result = await this.client.findData({
      collection: this.collectionId,
      filter: {},
    });

    return result.data || [];
  }
}
