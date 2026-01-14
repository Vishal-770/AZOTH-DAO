/**
 * A2A Routes - Agent-to-Agent Protocol
 *
 * Agent-to-Agent (A2A) protocol endpoints for agent communication.
 * Implements JSON-RPC 2.0 for message/send, tasks/get, and tasks/cancel.
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { NilaiService } from '../services/nilai.service.js';

// Types for A2A protocol
interface A2AMessage {
  role: 'user' | 'agent';
  parts: Array<{ type: 'text'; text: string }>;
}

interface A2ATask {
  id: string;
  contextId: string;
  status: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';
  messages: A2AMessage[];
  artifacts: Array<{ name: string; parts: Array<{ type: 'text'; text: string }> }>;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// In-memory storage
const tasks = new Map<string, A2ATask>();
const conversationHistory = new Map<string, ConversationMessage[]>();

export function createA2ARoutes(nilaiService: NilaiService): express.Router {
  const router = express.Router();

  /**
   * GET /.well-known/agent-card.json
   * Agent discovery card for A2A protocol
   */
  router.get('/.well-known/agent-card.json', (_req: Request, res: Response): void => {
    const agentCard = {
      name: 'Azoth DAO AI Advisor',
      description: 'Privacy-preserving AI assistant for DAO proposal analysis and governance advice, powered by Nillion',
      url: process.env.AGENT_URL || 'http://localhost:3001',
      version: '1.0.0',
      capabilities: {
        streaming: true,
        pushNotifications: false,
        stateTransitionHistory: true,
      },
      authentication: {
        schemes: ['x402'],
      },
      defaultInputModes: ['text'],
      defaultOutputModes: ['text'],
      skills: [
        {
          id: 'proposal-analysis',
          name: 'Proposal Analysis',
          description: 'Analyze DAO proposals for risks, benefits, and governance implications',
          tags: ['dao', 'governance', 'proposals', 'privacy', 'ai', 'nillion'],
          examples: [
            'Analyze this proposal for potential risks',
            'What are the governance implications of this funding request?',
            'Should I vote for or against this proposal?',
          ],
        },
        {
          id: 'governance-advice',
          name: 'Governance Advice',
          description: 'Get advice on DAO governance best practices',
          tags: ['dao', 'governance', 'voting'],
          examples: [
            'How does quadratic voting work in Azoth DAO?',
            'What is ragequit and when should I use it?',
          ],
        },
      ],
      privacy: {
        dataStorage: 'Encrypted with nilDB',
        inference: 'Processed in TEE with nilAI',
        payment: 'Pay-per-query with x402',
      },
    };

    res.json(agentCard);
  });

  /**
   * POST /a2a
   * JSON-RPC 2.0 endpoint for A2A protocol
   */
  router.post('/a2a', async (req: Request, res: Response): Promise<void> => {
    const { jsonrpc, method, params, id } = req.body;

    // Validate JSON-RPC version
    if (jsonrpc !== '2.0') {
      res.json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id,
      });
      return;
    }

    try {
      let result;
      switch (method) {
        case 'message/send':
          result = await handleMessageSend(params, nilaiService, res);
          break;
        case 'tasks/get':
          result = handleTasksGet(params);
          break;
        case 'tasks/cancel':
          result = handleTasksCancel(params);
          break;
        default:
          res.json({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${method}` },
            id,
          });
          return;
      }

      // If result is null, response was already sent (streaming)
      if (result !== null) {
        res.json({ jsonrpc: '2.0', result, id });
      }
    } catch (error: any) {
      res.json({
        jsonrpc: '2.0',
        error: { code: -32603, message: error.message || 'Internal error' },
        id,
      });
    }
  });

  return router;
}

/**
 * Handle message/send method
 */
async function handleMessageSend(
  params: {
    message: { role: string; parts: Array<{ type: string; text?: string }> };
    configuration?: { contextId?: string; streaming?: boolean };
  },
  nilaiService: NilaiService,
  res: express.Response
): Promise<A2ATask | null> {
  const { message, configuration } = params;
  const streaming = configuration?.streaming ?? false;
  const contextId = configuration?.contextId || uuidv4();
  const taskId = uuidv4();

  // Extract text content
  const userText = message.parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('\n');

  if (!userText) {
    throw new Error('No text content in message');
  }

  // Get conversation history for context
  const history = conversationHistory.get(contextId) || [];

  // Create initial task
  const task: A2ATask = {
    id: taskId,
    contextId,
    status: 'working',
    messages: [
      {
        role: 'user',
        parts: [{ type: 'text', text: userText }],
      },
    ],
    artifacts: [],
  };
  tasks.set(taskId, task);

  if (streaming) {
    // Set up SSE for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      let fullResponse = '';
      for await (const chunk of nilaiService.streamQuery(userText, undefined, history)) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }

      // Update task with response
      task.status = 'completed';
      task.messages.push({
        role: 'agent',
        parts: [{ type: 'text', text: fullResponse }],
      });

      // Update conversation history
      history.push({ role: 'user', content: userText });
      history.push({ role: 'assistant', content: fullResponse });
      conversationHistory.set(contextId, history);

      res.write(`data: ${JSON.stringify({ type: 'done', task })}\n\n`);
      res.end();
      return null; // Response already sent
    } catch (error) {
      task.status = 'failed';
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`);
      res.end();
      return null;
    }
  } else {
    // Non-streaming response
    const response = await nilaiService.processQuery(userText, undefined, history, true);

    task.status = 'completed';
    task.messages.push({
      role: 'agent',
      parts: [{ type: 'text', text: response }],
    });

    // Update conversation history
    history.push({ role: 'user', content: userText });
    history.push({ role: 'assistant', content: response });
    conversationHistory.set(contextId, history);

    return task;
  }
}

/**
 * Handle tasks/get method
 */
function handleTasksGet(params: { id: string }): A2ATask {
  const task = tasks.get(params.id);
  if (!task) {
    throw new Error(`Task not found: ${params.id}`);
  }
  return task;
}

/**
 * Handle tasks/cancel method
 */
function handleTasksCancel(params: { id: string }): A2ATask {
  const task = tasks.get(params.id);
  if (!task) {
    throw new Error(`Task not found: ${params.id}`);
  }
  if (task.status !== 'working') {
    throw new Error(`Cannot cancel task in status: ${task.status}`);
  }
  task.status = 'canceled';
  return task;
}
