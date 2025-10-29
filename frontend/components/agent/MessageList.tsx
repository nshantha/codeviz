'use client';

import { type AgentMessage } from '@/lib/api/agent';
import { Card } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import { ToolResultCard } from './ToolResultCard';
import { VisualizationCard } from './VisualizationCard';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface MessageWithMetadata extends AgentMessage {
  metadata?: any;
}

interface MessageListProps {
  messages: MessageWithMetadata[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const msgMetadata = message.metadata;

        return (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            <div className={`flex flex-col gap-2 ${
              message.role === 'user' ? 'max-w-[80%]' : 'max-w-[85%]'
            }`}>
              <Card className={`p-4 ${
                message.role === 'user' ? 'bg-blue-50' : 'bg-white'
              }`}>
                <MarkdownRenderer content={message.content || ''} />
              </Card>

              {/* Show tool results if this message has metadata */}
              {message.role === 'assistant' && msgMetadata && (
                <div className="space-y-2">
                  {msgMetadata.identifiedPatterns?.map((pattern: any, i: number) => (
                    <ToolResultCard
                      key={`pattern-${i}`}
                      type="pattern"
                      data={pattern}
                    />
                  ))}

                  {msgMetadata.visualizations?.map((viz: any, i: number) => (
                    <VisualizationCard
                      key={`viz-${i}`}
                      spec={viz.spec}
                    />
                  ))}

                  {msgMetadata.hintsGiven?.map((hint: any, i: number) => (
                    <ToolResultCard
                      key={`hint-${i}`}
                      type="hint"
                      data={hint}
                    />
                  ))}

                  {msgMetadata.knowledgeUpdates?.map((update: any, i: number) => (
                    <ToolResultCard
                      key={`knowledge-${i}`}
                      type="knowledge"
                      data={update}
                    />
                  ))}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
