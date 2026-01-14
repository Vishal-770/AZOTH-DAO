/**
 * TypeScript Type Definitions for Azoth DAO Agent
 */

// Chat message types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Chat request/response types
export interface ChatRequest {
  message: string;
  sessionId?: string;
  userWallet?: string;
  paymentTxHash?: string;
  proposalContext?: string;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  recordId: string;
  timestamp: string;
}

// A2A protocol types
export interface A2AMessage {
  role: 'user' | 'agent';
  parts: Array<{ type: 'text'; text: string }>;
}

export interface A2ATask {
  id: string;
  contextId: string;
  status: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';
  messages: A2AMessage[];
  artifacts: Array<{ name: string; parts: Array<{ type: 'text'; text: string }> }>;
}

// nilDB record types
export interface DAOChatRecord {
  _id: string;
  session_id: string;
  user_wallet?: string;
  proposal_context?: {
    '%allot': string;
  };
  user_prompt: {
    '%allot': string;
  };
  agent_response?: {
    '%allot': string;
  };
  payment_tx_hash?: string;
  timestamp: string;
}

// ERC-8004 Agent Metadata
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

// Agent Card for A2A discovery
export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };
  authentication: {
    schemes: string[];
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples: string[];
  }>;
  privacy: {
    dataStorage: string;
    inference: string;
    payment: string;
  };
}
