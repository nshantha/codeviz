import { QueryClient } from '@tanstack/react-query';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentChatRequest {
  messages: AgentMessage[];
  context?: {
    problemId?: string;
    patternId?: string;
  };
}

export interface AgentChatResponse {
  success: boolean;
  messages: AgentMessage[];
  metadata: {
    toolsUsed: number;
    identifiedPatterns?: any[];
    hintsGiven?: any[];
    knowledgeUpdates?: any[];
    visualizations?: any[];
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function sendAgentMessage(
  request: AgentChatRequest
): Promise<AgentChatResponse> {
  const response = await fetch(`${API_URL}/api/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Agent API error: ${response.statusText}`);
  }

  return response.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
