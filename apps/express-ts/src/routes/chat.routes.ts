/**
 * Chat Routes
 *
 * API endpoints for DAO proposal AI chat functionality.
 * Protected by x402 payment middleware.
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { NilDBService } from '../services/nildb.service.js';
import { NilaiService } from '../services/nilai.service.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  sessionId?: string;
  userWallet?: string;
  paymentTxHash?: string;
  proposalContext?: string;
}

interface ChatResponse {
  response: string;
  sessionId: string;
  recordId: string;
  timestamp: string;
}

// In-memory session storage
const sessionHistory = new Map<string, ChatMessage[]>();
const sessionProposalContext = new Map<string, string>();

export function createChatRoutes(
  nildbService: NilDBService,
  nilaiService: NilaiService
): express.Router {
  const router = express.Router();

  /**
   * POST /api/chat
   * Main chat endpoint - processes DAO proposal queries
   */
  router.post('/chat', async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, sessionId, userWallet, paymentTxHash, proposalContext }: ChatRequest = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const currentSessionId = sessionId || uuidv4();
      const history = sessionHistory.get(currentSessionId) || [];
      
      // Store or retrieve proposal context for this session
      if (proposalContext) {
        sessionProposalContext.set(currentSessionId, proposalContext);
      }
      const currentProposalContext = sessionProposalContext.get(currentSessionId);

      // Store encrypted prompt in nilDB
      const recordId = await nildbService.storePrompt(
        currentSessionId,
        message,
        currentProposalContext,
        paymentTxHash,
        userWallet
      );

      // Process with nilAI (in TEE)
      console.log('[TEE] Processing query in TEE...');
      const response = await nilaiService.processQuery(message, currentProposalContext, history);

      // Store encrypted response in nilDB
      await nildbService.storeResponse(recordId, response);

      // Update session history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: response });
      sessionHistory.set(currentSessionId, history);

      const chatResponse: ChatResponse = {
        response,
        sessionId: currentSessionId,
        recordId,
        timestamp: new Date().toISOString(),
      };

      console.log('[SUCCESS] Query processed successfully');
      res.json(chatResponse);
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        error: 'Failed to process proposal query',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/chat/free
   * Free endpoint for testing (no x402 payment required)
   */
  router.post('/chat/free', async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, sessionId, proposalContext }: ChatRequest = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const currentSessionId = sessionId || uuidv4();
      const history = sessionHistory.get(currentSessionId) || [];
      
      if (proposalContext) {
        sessionProposalContext.set(currentSessionId, proposalContext);
      }
      const currentProposalContext = sessionProposalContext.get(currentSessionId);

      // Process with nilAI (skip nilDB storage for free tier)
      console.log('[TEE] Processing FREE query in TEE...');
      const response = await nilaiService.processQuery(message, currentProposalContext, history, false);

      // Update session history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: response });
      sessionHistory.set(currentSessionId, history);

      res.json({
        response,
        sessionId: currentSessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Free chat error:', error);
      res.status(500).json({
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/chat/stream
   * Streaming chat endpoint
   */
  router.post('/chat/stream', async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, sessionId, userWallet, paymentTxHash, proposalContext }: ChatRequest = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const currentSessionId = sessionId || uuidv4();
      const history = sessionHistory.get(currentSessionId) || [];

      if (proposalContext) {
        sessionProposalContext.set(currentSessionId, proposalContext);
      }
      const currentProposalContext = sessionProposalContext.get(currentSessionId);

      const recordId = await nildbService.storePrompt(
        currentSessionId,
        message,
        currentProposalContext,
        paymentTxHash,
        userWallet
      );

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let fullResponse = '';
      for await (const chunk of nilaiService.streamQuery(message, currentProposalContext, history)) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk, sessionId: currentSessionId })}\n\n`);
      }

      await nildbService.storeResponse(recordId, fullResponse);

      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: fullResponse });
      sessionHistory.set(currentSessionId, history);

      res.write(`data: ${JSON.stringify({ done: true, recordId, sessionId: currentSessionId })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.end();
    }
  });

  /**
   * GET /api/history/:sessionId
   * Get chat history for a session
   */
  router.get('/history/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const history = await nildbService.getSessionHistory(sessionId);
      res.json({ history });
    } catch (error) {
      console.error('History error:', error);
      res.status(500).json({ error: 'Failed to get history' });
    }
  });

  return router;
}
