import { type AgentMessage, type AgentChatRequest } from './agent';

export interface StreamEvent {
  type: 'connected' | 'status' | 'content' | 'metadata' | 'done' | 'error';
  status?: string;
  content?: string;
  metadata?: any;
  error?: string;
}

export async function* streamAgentMessage(
  request: AgentChatRequest
): AsyncGenerator<StreamEvent> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const response = await fetch(`${API_URL}/api/agent/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Stream API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete messages (ended with \n\n)
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // Keep incomplete message in buffer

      for (const message of messages) {
        if (message.startsWith('data: ')) {
          const data = message.slice(6); // Remove 'data: ' prefix
          try {
            const event: StreamEvent = JSON.parse(data);
            yield event;
          } catch (e) {
            console.error('Failed to parse SSE message:', data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
