'use client';

import { useState, useRef, useEffect } from 'react';
import { type AgentMessage } from '@/lib/api/agent';
import { streamAgentMessage } from '@/lib/api/streaming';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './MessageList';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Loader2, Send } from 'lucide-react';

interface AgentChatProps {
  initialMessages?: AgentMessage[];
  context?: {
    problemId?: string;
    patternId?: string;
  };
}

interface MessageWithMetadata extends AgentMessage {
  metadata?: any;
}

export function AgentChat({ initialMessages = [], context }: AgentChatProps) {
  const [messages, setMessages] = useState<MessageWithMetadata[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingContent, messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: AgentMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      // Try streaming first (will fail if OpenAI org not verified)
      try {
        let fullContent = '';
        let metadata: any = null;
        let hasReceivedContent = false;

        const stream = streamAgentMessage({
          messages: [...messages, userMessage],
          context,
        });

        for await (const event of stream) {
          if (event.type === 'connected') {
            setStreamingContent('');
          } else if (event.type === 'status') {
            if (!hasReceivedContent) {
              setStreamingContent('');
            }
          } else if (event.type === 'content') {
            if (!hasReceivedContent) {
              hasReceivedContent = true;
              fullContent = '';
              setStreamingContent('');
            }
            fullContent += event.content || '';
            setStreamingContent(fullContent);
          } else if (event.type === 'metadata') {
            metadata = event.metadata;
          } else if (event.type === 'done') {
            // Finalize the message
            setMessages(prev => [...prev, {
              role: 'assistant' as const,
              content: fullContent || 'Agent completed.',
              metadata,
            }]);
            setStreamingContent('');
            return; // Success - don't fall back
          } else if (event.type === 'error') {
            console.error('Stream error:', event.error);
            // Fall through to non-streaming fallback
            throw new Error(event.error);
          }
        }
      } catch (streamError: any) {
        console.log('Streaming not available, using non-streaming endpoint:', streamError.message);

        // Fallback to non-streaming endpoint - keep spinner but no text
        setStreamingContent('');

        const { sendAgentMessage } = await import('@/lib/api/agent');
        const response = await sendAgentMessage({
          messages: [...messages, userMessage],
          context,
        });

        // Simulate character-by-character display for smooth UX
        if (response.success && response.messages.length > 0) {
          const assistantMessage = response.messages[response.messages.length - 1];
          const content = assistantMessage.content || '';

          // Display content gradually
          for (let i = 0; i <= content.length; i += 3) {
            setStreamingContent(content.slice(0, i));
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Add final message with metadata
          setMessages(prev => [...prev, {
            role: 'assistant' as const,
            content,
            metadata: response.metadata,
          }]);
          setStreamingContent('');
        }
      }
    } catch (error: any) {
      console.error('Failed to get response:', error);
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: `Failed to get response: ${error.message}`,
      }]);
      setStreamingContent('');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg">
      {/* Message List */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <MessageList messages={messages} />

        {/* Show streaming content */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3 mt-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            </div>
            <div className="flex flex-col gap-2 max-w-[85%]">
              <div className="p-4 bg-white rounded-lg border">
                <MarkdownRenderer content={streamingContent} />
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI tutor anything..."
            className="min-h-[80px]"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            size="icon"
            className="h-full"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
