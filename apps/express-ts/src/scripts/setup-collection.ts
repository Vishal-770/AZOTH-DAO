/**
 * nilDB Collection Setup Script
 *
 * Creates the encrypted collection for storing DAO chat history.
 * Run this once before starting the server.
 *
 * Run with: npm run setup-collection
 */

import 'dotenv/config';
import { initNilDBClient } from '../config/nillion.js';
import { NilDBService, daoChatSchema } from '../services/nildb.service.js';

async function setupCollection() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  nilDB Collection Setup - Azoth DAO Chat History');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Check if collection already exists
    const existingId = process.env.NILDB_COLLECTION_ID;
    if (existingId) {
      console.log(`[INFO] Collection already configured: ${existingId}`);
      console.log('   To create a new collection, remove NILDB_COLLECTION_ID from .env');
      console.log('\n[INFO] View your collection at:');
      console.log(`   https://collection-explorer.nillion.com/collections`);
      return;
    }

    // Initialize nilDB client
    console.log('[INFO] Connecting to nilDB nodes...');
    const nildbClient = await initNilDBClient();

    // Initialize service (will create collection if not exists)
    console.log('[INFO] Creating DAO chat collection...');
    const nildbService = await NilDBService.initialize(nildbClient);

    const collectionId = nildbService.getCollectionId();

    console.log('\n[SUCCESS] Collection created successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`[INFO] Collection ID: ${collectionId}`);
    console.log('\n[INFO] View your collection at:');
    console.log(`   https://collection-explorer.nillion.com/collections`);
    console.log('\n[NOTE] Add this to your .env file:');
    console.log(`   NILDB_COLLECTION_ID=${collectionId}`);
    console.log('═══════════════════════════════════════════════════════');

    console.log('\n[INFO] Collection Schema:');
    console.log(JSON.stringify(daoChatSchema, null, 2));

  } catch (error) {
    console.error('\n[ERROR] Collection setup failed:', error);
    process.exit(1);
  }
}

setupCollection();
