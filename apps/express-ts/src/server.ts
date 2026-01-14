/**
 * Azoth DAO AI Agent Server
 *
 * Main Express server combining:
 * - nilDB: Encrypted storage for DAO conversations
 * - nilAI: Private LLM inference in TEE
 * - x402: Pay-per-query payment system
 * - A2A: Agent-to-Agent protocol support
 * - ERC-8004: Agent registration
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { x402ResourceServer, paymentMiddleware } from '@x402/express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';

import { initNilDBClient } from './config/nillion.js';
import { PAYMENT_CONFIG, getPaymentWallet, getQueryPrice } from './config/payment.js';
import { NilDBService } from './services/nildb.service.js';
import { NilaiService } from './services/nilai.service.js';
import { createChatRoutes } from './routes/chat.routes.js';
import { createA2ARoutes } from './routes/a2a.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS with exposed headers for x402
app.use(cors({
  origin: '*',
  exposedHeaders: ['payment-required', 'PAYMENT-REQUIRED', 'X-PAYMENT', 'x-payment', 'payment-signature', 'PAYMENT-SIGNATURE', 'X-PAYMENT-RESPONSE']
}));
app.use(express.json());

/**
 * Initialize all services
 */
async function initializeServices() {
  console.log('[INFO] Initializing services...');

  // Initialize nilDB client
  console.log('[INFO] Connecting to nilDB nodes...');
  const nildbClient = await initNilDBClient();

  // Initialize nilDB service with existing or new collection
  const collectionId = process.env.NILDB_COLLECTION_ID;
  const nildbService = await NilDBService.initialize(nildbClient, collectionId);

  // Initialize nilAI service
  console.log('[INFO] Initializing nilAI...');
  const nilaiService = new NilaiService();

  console.log('[SUCCESS] All services initialized');
  return { nildbService, nilaiService };
}

/**
 * Configure x402 payment middleware
 */
function configurePaymentMiddleware() {
  const payeeAddress = getPaymentWallet();
  const price = getQueryPrice();

  console.log(`[INFO] Payment wallet: ${payeeAddress}`);
  console.log(`[INFO] Price per query: ${price}`);

  // Create facilitator client (testnet)
  const facilitatorClient = new HTTPFacilitatorClient({
    url: PAYMENT_CONFIG.facilitatorUrl,
  });

  // Register EVM exact scheme
  const x402Server = new x402ResourceServer(facilitatorClient)
    .register(PAYMENT_CONFIG.network, new ExactEvmScheme());

  return paymentMiddleware(
    {
      'POST /api/chat': {
        accepts: [
          {
            scheme: 'exact',
            price: price,
            network: PAYMENT_CONFIG.network,
            payTo: payeeAddress,
          },
        ],
        description: 'Azoth DAO AI Query',
        mimeType: 'application/json',
      },
      'POST /api/chat/stream': {
        accepts: [
          {
            scheme: 'exact',
            price: price,
            network: PAYMENT_CONFIG.network,
            payTo: payeeAddress,
          },
        ],
        description: 'Azoth DAO AI Streaming Query',
        mimeType: 'text/event-stream',
      },
      'POST /a2a': {
        accepts: [
          {
            scheme: 'exact',
            price: price,
            network: PAYMENT_CONFIG.network,
            payTo: payeeAddress,
          },
        ],
        description: 'Azoth DAO AI A2A Query',
        mimeType: 'application/json',
      },
    },
    x402Server
  );
}

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize services
    const { nildbService, nilaiService } = await initializeServices();

    // Configure payment middleware (optional - don't crash if facilitator is down)
    let x402Enabled = false;
    console.log('[INFO] Configuring x402 payments...');
    
    // Debug middleware to log payment headers
    app.use((req, _res, next) => {
      const paymentHeader = req.headers['payment-signature'] || req.headers['x-payment'];
      if (paymentHeader) {
        console.log('[DEBUG] Payment header received');
        try {
          const decoded = JSON.parse(Buffer.from(paymentHeader as string, 'base64').toString());
          console.log('[DEBUG] Decoded payment:', JSON.stringify(decoded, null, 2));
        } catch (e) {
          console.log('[DEBUG] Could not decode payment header');
        }
      }
      next();
    });
    
    try {
      app.use(configurePaymentMiddleware());
      x402Enabled = true;
      console.log('[SUCCESS] x402 payment middleware configured');
    } catch (x402Error) {
      console.warn('[WARN] x402 payment middleware failed to initialize:', x402Error instanceof Error ? x402Error.message : x402Error);
      console.warn('[WARN] Server will continue without x402 payments - use /api/chat/free endpoint');
    }

    // Health check endpoint (no payment required)
    app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        service: 'Azoth DAO AI Agent',
        timestamp: new Date().toISOString(),
        x402Enabled,
      });
    });

    // Agent info endpoint
    app.get('/agent', (_req, res) => {
      res.json({
        name: 'Azoth DAO AI Advisor',
        description: 'Privacy-preserving AI assistant for DAO proposal analysis and governance advice',
        capabilities: ['proposal-analysis', 'governance-advice', 'risk-assessment'],
        pricing: {
          model: 'pay-per-query',
          price: getQueryPrice(),
          paymentMethod: 'x402-usdc',
        },
        privacy: {
          inference: 'TEE (Trusted Execution Environment)',
          storage: 'nilDB (encrypted distributed storage)',
        },
        agentId: process.env.AGENT_ID || 'pending-registration',
        collectionId: nildbService.getCollectionId(),
      });
    });

    // FREE test endpoint (no payment required) - for development only
    app.post('/api/chat/free', async (req, res) => {
      try {
        console.log('[INFO] Processing FREE chat request (no payment)');
        // Accept both 'message' and 'prompt' for compatibility
        const { message, prompt, sessionId, proposalContext } = req.body;
        const userMessage = message || prompt;
        
        if (!userMessage) {
          res.status(400).json({ error: 'Message or prompt is required' });
          return;
        }

        const currentSessionId = sessionId || 'free-test-' + Date.now();
        console.log(`[DEBUG] Message: ${userMessage.substring(0, 50)}...`);
        console.log(`[DEBUG] Session: ${currentSessionId}`);
        console.log(`[DEBUG] Has proposal context: ${!!proposalContext}`);
        
        // Store encrypted prompt in nilDB and get the recordId
        let recordId: string | undefined;
        console.log('[INFO] Storing encrypted prompt in nilDB...');
        try {
          recordId = await nildbService.storePrompt(currentSessionId, userMessage, proposalContext);
          console.log('[SUCCESS] Prompt stored in nilDB, recordId:', recordId);
        } catch (dbError) {
          console.error('[ERROR] Failed to store prompt in nilDB:', dbError);
          // Continue anyway - don't block the response
        }
        
        // Process with nilAI (with web search enabled)
        console.log('[INFO] Processing query in TEE with web search...');
        const response = await nilaiService.processQuery(userMessage, proposalContext, [], true);
        
        console.log(`[SUCCESS] Response received from nilAI (${response.length} chars)`);
        
        // Store encrypted response in nilDB using the recordId
        if (recordId) {
          console.log('[INFO] Storing encrypted response in nilDB...');
          try {
            await nildbService.storeResponse(recordId, response);
            console.log('[SUCCESS] Response stored in nilDB');
          } catch (dbError) {
            console.error('[ERROR] Failed to store response in nilDB:', dbError);
            // Continue anyway - don't block the response
          }
        }
        
        res.json({
          response,
          sessionId: currentSessionId,
          recordId,
          webSearchEnabled: true,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[ERROR] Free chat error:', error);
        res.status(500).json({ 
          error: 'Failed to process query',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Debug endpoint to view stored records (for development)
    app.get('/api/debug/records', async (_req, res) => {
      try {
        console.log('[INFO] Fetching all records from nilDB...');
        const records = await nildbService.getAllRecords();
        console.log(`[INFO] Found ${records.length} records`);
        res.json({
          count: records.length,
          collectionId: nildbService.getCollectionId(),
          records: records,
          note: 'Fields with %share are encrypted - you will see encrypted blobs, not plaintext'
        });
      } catch (error) {
        console.error('[ERROR] Debug endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch records' });
      }
    });

    // Chat routes (payment protected)
    app.use('/api', createChatRoutes(nildbService, nilaiService));

    // A2A routes (payment protected)
    const a2aRoutes = createA2ARoutes(nilaiService);
    app.use('/', a2aRoutes);

    // 404 handler
    app.use((_req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    // Error handler
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('[ERROR] Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start listening
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('Azoth DAO AI Agent Server');
      console.log('========================================');
      console.log(`Server:     http://localhost:${PORT}`);
      console.log(`Chat API:   http://localhost:${PORT}/api/chat`);
      console.log(`Free API:   http://localhost:${PORT}/api/chat/free`);
      console.log(`Stream API: http://localhost:${PORT}/api/chat/stream`);
      console.log(`A2A:        http://localhost:${PORT}/a2a`);
      console.log(`Agent Card: http://localhost:${PORT}/.well-known/agent-card.json`);
      console.log(`Health:     http://localhost:${PORT}/health`);
      console.log(`Agent Info: http://localhost:${PORT}/agent`);
      console.log('========================================');
      console.log(`nilDB encryption: ACTIVE`);
      console.log(`nilAI model: ${nilaiService.getModel()}`);
      console.log(`Collection: ${nildbService.getCollectionId()}`);
      console.log(`x402 payments: ${x402Enabled ? 'ENABLED' : 'DISABLED (facilitator unavailable)'}`);
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('[FATAL] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
