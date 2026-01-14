/**
 * nilAI Service - DAO Proposal AI Inference
 *
 * Handles private LLM inference using Nillion's nilAI nodes.
 * All prompts are processed inside a Trusted Execution Environment (TEE).
 */

import { NilaiOpenAIClient, NilAuthInstance } from '@nillion/nilai-ts';
import { NILAI_CONFIG } from '../config/nillion.js';

/**
 * System prompt for DAO proposal AI assistant
 */
const DAO_SYSTEM_PROMPT = `You are an expert DAO proposal advisor for Azoth DAO, powered by Nillion's secure computation network.

ABOUT AZOTH DAO:
- Azoth DAO is a privacy-preserving DAO using Trusted Execution Environment (TEE) via Inco Network
- Members deposit cUSDC (encrypted USDC) into a vault to join
- Members mint cGOV (confidential governance tokens) to vote on proposals
- Voting is completely private - no one can see individual votes or weights
- Proposals can request cUSDC from the treasury for funding
- Supports both normal voting and quadratic voting modes
- Members can "ragequit" to withdraw their share of the treasury at any time

YOUR ROLE:
1. Help members evaluate proposals objectively
2. Analyze proposal descriptions for potential issues or risks
3. Suggest improvements to proposal wording or structure
4. Explain the implications of funding requests
5. Provide context on best practices for DAO governance
6. Never tell users how to vote - present balanced analysis

RESPONSE GUIDELINES:
- Be concise and actionable
- Highlight both pros and cons of proposals
- Consider treasury impact of funding requests
- Flag any governance risks or conflicts of interest
- Suggest questions the community should discuss
- Always maintain neutrality - don't advocate for or against

Your responses are processed inside a Trusted Execution Environment (TEE) for privacy.
All conversation data is encrypted using Nillion's secure storage.`;

export class NilaiService {
  private client: NilaiOpenAIClient;

  constructor() {
    const apiKey = process.env.NILLION_API_KEY;

    if (!apiKey) {
      throw new Error('NILLION_API_KEY environment variable is required');
    }

    this.client = new NilaiOpenAIClient({
      baseURL: NILAI_CONFIG.baseURL,
      apiKey: apiKey,
      nilauthInstance: NilAuthInstance.SANDBOX,
    });
  }

  /**
   * Process a DAO proposal query and return the AI response
   */
  async processQuery(
    userPrompt: string,
    proposalContext?: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    enableWebSearch: boolean = true
  ): Promise<string> {
    // Build context-aware prompt
    let systemPrompt = DAO_SYSTEM_PROMPT;
    if (proposalContext) {
      systemPrompt += `\n\nCURRENT PROPOSAL CONTEXT:\n${proposalContext}`;
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userPrompt },
    ];

    try {
      console.log('[TEE] Processing in TEE with web search:', enableWebSearch);
      
      const response = await this.client.chat.completions.create(
        {
          model: NILAI_CONFIG.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
        },
        {
          extra_body: { web_search: enableWebSearch },
        } as any
      );

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response received from nilAI');
      }

      console.log('[SUCCESS] nilAI response received (length:', content.length, 'chars)');
      return content;
    } catch (error) {
      console.error('nilAI processing error:', error);
      throw new Error('Failed to process proposal query securely');
    }
  }

  /**
   * Stream query response
   */
  async *streamQuery(
    userPrompt: string,
    proposalContext?: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): AsyncGenerator<string> {
    let systemPrompt = DAO_SYSTEM_PROMPT;
    if (proposalContext) {
      systemPrompt += `\n\nCURRENT PROPOSAL CONTEXT:\n${proposalContext}`;
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userPrompt },
    ];

    try {
      const stream = await this.client.chat.completions.create({
        model: NILAI_CONFIG.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });

      for await (const chunk of stream as AsyncIterable<any>) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('nilAI streaming error:', error);
      throw new Error('Failed to stream proposal response');
    }
  }

  getModel(): string {
    return NILAI_CONFIG.model;
  }
}
