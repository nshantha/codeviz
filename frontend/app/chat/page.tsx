'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api/agent';
import { AgentChat } from '@/components/agent/AgentChat';

export default function ChatPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container max-w-4xl mx-auto py-8 h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">AlgoMentor AI Tutor</h1>
          <p className="text-gray-600">
            Ask questions, get hints, and visualize algorithms
          </p>
        </div>

        <div className="h-[calc(100vh-200px)]">
          <AgentChat />
        </div>
      </div>
    </QueryClientProvider>
  );
}
