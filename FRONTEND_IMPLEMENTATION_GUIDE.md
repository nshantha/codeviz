# Frontend Implementation Guide

This guide provides complete implementation steps for the AlgoMentor frontend with agent-powered UI.

---

## Quick Start

```bash
# From project root
cd /Users/nitesh/Desktop/projects/codeviz

# Create Next.js 14 app
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --eslint \
  --import-alias "@/*"

cd frontend

# Install dependencies
npm install @tanstack/react-query @supabase/supabase-js
npm install zustand framer-motion
npm install @monaco-editor/react
npm install react-flow-renderer
npm install lucide-react class-variance-authority clsx tailwind-merge

# Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input textarea
npx shadcn-ui@latest add scroll-area separator avatar
```

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Home/dashboard
│   ├── chat/
│   │   └── page.tsx              # Main agent chat interface
│   ├── problem/
│   │   └── [id]/
│   │       └── page.tsx          # Problem solving interface
│   └── progress/
│       └── page.tsx              # Progress dashboard
├── components/
│   ├── agent/
│   │   ├── AgentChat.tsx         # Chat interface
│   │   ├── MessageList.tsx       # Message rendering
│   │   └── ToolResultCard.tsx    # Tool result displays
│   ├── visualizer/
│   │   ├── AlgorithmVisualizer.tsx
│   │   ├── ArrayVisualizer.tsx
│   │   ├── TreeVisualizer.tsx
│   │   └── VisualizerControls.tsx
│   ├── editor/
│   │   ├── CodeEditor.tsx        # Monaco editor
│   │   └── TestRunner.tsx        # Test case display
│   ├── progress/
│   │   ├── ProgressMap.tsx       # Pattern mastery map
│   │   └── StatsCard.tsx         # Progress stats
│   └── ui/                        # shadcn components
├── lib/
│   ├── api/
│   │   ├── agent.ts              # Agent API client
│   │   ├── patterns.ts           # Patterns API
│   │   └── supabase.ts           # Supabase client
│   ├── stores/
│   │   ├── chatStore.ts          # Chat state (Zustand)
│   │   └── editorStore.ts        # Editor state
│   └── utils/
│       ├── cn.ts                  # Class name utilities
│       └── visualizationRenderer.ts
└── types/
    ├── agent.ts                   # Agent types
    ├── visualization.ts           # Visualization spec types
    └── problem.ts                 # Problem types
```

---

## Implementation Steps

### Step 1: Setup API Client

**File:** `lib/api/agent.ts`

```typescript
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
```

---

### Step 2: Create AgentChat Component

**File:** `components/agent/AgentChat.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendAgentMessage, type AgentMessage } from '@/lib/api/agent';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './MessageList';
import { Loader2, Send } from 'lucide-react';

interface AgentChatProps {
  initialMessages?: AgentMessage[];
  context?: {
    problemId?: string;
    patternId?: string;
  };
}

export function AgentChat({ initialMessages = [], context }: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages);
  const [input, setInput] = useState('');

  const mutation = useMutation({
    mutationFn: sendAgentMessage,
    onSuccess: (data) => {
      // Add assistant messages to state
      setMessages(prev => [...prev, ...data.messages]);

      // Handle visualizations if any
      if (data.metadata.visualizations?.length > 0) {
        console.log('Visualizations:', data.metadata.visualizations);
      }
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: AgentMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    mutation.mutate({
      messages: [...messages, userMessage],
      context,
    });
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
      <ScrollArea className="flex-1 p-4">
        <MessageList messages={messages} metadata={mutation.data?.metadata} />
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
            disabled={mutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={mutation.isPending || !input.trim()}
            size="icon"
            className="h-full"
          >
            {mutation.isPending ? (
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
```

---

### Step 3: Create MessageList Component

**File:** `components/agent/MessageList.tsx`

```typescript
'use client';

import { type AgentMessage } from '@/lib/api/agent';
import { Card } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import { ToolResultCard } from './ToolResultCard';

interface MessageListProps {
  messages: AgentMessage[];
  metadata?: any;
}

export function MessageList({ messages, metadata }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
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

          <Card className={`p-4 max-w-[80%] ${
            message.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'
          }`}>
            <div className="prose prose-sm">
              {message.content}
            </div>

            {/* Show tool results if this is an assistant message */}
            {message.role === 'assistant' && metadata && (
              <div className="mt-4 space-y-2">
                {metadata.identifiedPatterns?.map((pattern: any, i: number) => (
                  <ToolResultCard
                    key={i}
                    type="pattern"
                    data={pattern}
                  />
                ))}
                {metadata.visualizations?.map((viz: any, i: number) => (
                  <ToolResultCard
                    key={i}
                    type="visualization"
                    data={viz}
                  />
                ))}
              </div>
            )}
          </Card>

          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### Step 4: Create AlgorithmVisualizer Component

**File:** `components/visualizer/AlgorithmVisualizer.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { ArrayVisualizer } from './ArrayVisualizer';

export interface VisualizationSpec {
  type: 'array' | 'tree' | 'graph';
  pattern: string;
  title: string;
  data: any;
  steps: Array<{
    description: string;
    pointers?: Record<string, number>;
    highlights?: number[];
    annotation?: string;
  }>;
}

interface AlgorithmVisualizerProps {
  spec: VisualizationSpec;
  autoPlay?: boolean;
}

export function AlgorithmVisualizer({
  spec,
  autoPlay = false,
}: AlgorithmVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const handleNext = () => {
    if (currentStep < spec.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Auto-play logic
  React.useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(handleNext, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold">{spec.title}</h3>
          <p className="text-sm text-gray-600">Pattern: {spec.pattern}</p>
        </div>

        {/* Visualization */}
        <div className="border rounded-lg p-6 bg-gray-50">
          {spec.type === 'array' && (
            <ArrayVisualizer
              data={spec.data}
              step={spec.steps[currentStep]}
            />
          )}
        </div>

        {/* Step Description */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium">
            Step {currentStep + 1}/{spec.steps.length}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            {spec.steps[currentStep].description}
          </p>
          {spec.steps[currentStep].annotation && (
            <p className="text-sm text-blue-600 mt-2 font-mono">
              {spec.steps[currentStep].annotation}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            disabled={currentStep === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <SkipForward className="h-4 w-4 rotate-180" />
          </Button>

          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={currentStep === spec.steps.length - 1}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentStep === spec.steps.length - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

---

### Step 5: Create ArrayVisualizer Component

**File:** `components/visualizer/ArrayVisualizer.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';

interface ArrayVisualizerProps {
  data: number[];
  step: {
    pointers?: Record<string, number>;
    highlights?: number[];
    annotation?: string;
  };
}

export function ArrayVisualizer({ data, step }: ArrayVisualizerProps) {
  const pointers = step.pointers || {};
  const highlights = step.highlights || [];

  const getPointerColor = (name: string) => {
    const colors: Record<string, string> = {
      left: 'bg-blue-500',
      right: 'bg-red-500',
      slow: 'bg-green-500',
      fast: 'bg-purple-500',
      i: 'bg-blue-500',
      j: 'bg-red-500',
    };
    return colors[name] || 'bg-gray-500';
  };

  return (
    <div className="space-y-8">
      {/* Array */}
      <div className="flex items-end justify-center gap-2">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            {/* Pointers above */}
            <div className="h-6 flex flex-col items-center">
              {Object.entries(pointers).map(([name, pos]) =>
                pos === index ? (
                  <motion.div
                    key={name}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-xs font-bold"
                  >
                    ↓ {name}
                  </motion.div>
                ) : null
              )}
            </div>

            {/* Value box */}
            <motion.div
              className={`
                w-16 h-16 flex items-center justify-center
                border-2 rounded-lg font-bold text-lg
                ${highlights.includes(index)
                  ? 'bg-yellow-200 border-yellow-500'
                  : 'bg-white border-gray-300'
                }
              `}
              initial={{ scale: 1 }}
              animate={{
                scale: highlights.includes(index) ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {value}
            </motion.div>

            {/* Index */}
            <div className="text-xs text-gray-500">{index}</div>
          </div>
        ))}
      </div>

      {/* Pointer Legend */}
      {Object.keys(pointers).length > 0 && (
        <div className="flex gap-4 justify-center">
          {Object.keys(pointers).map(name => (
            <div key={name} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getPointerColor(name)}`} />
              <span className="text-sm">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Step 6: Create Main Chat Page

**File:** `app/chat/page.tsx`

```typescript
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
```

---

### Step 7: Environment Variables

**File:** `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Testing the Frontend

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Open Browser
```
http://localhost:3001/chat
```

### 4. Test Conversation
```
You: "Help me understand the Two Pointers pattern"

Agent:
- Calls identify_pattern tool
- Calls create_visualization tool
- Returns explanation with interactive visualization

You can:
- Click play to see animation
- Step through the algorithm
- Ask follow-up questions
```

---

## Next Steps

1. **Add Code Editor:**
   - Integrate Monaco Editor
   - Connect to agent for code analysis
   - Show inline hints

2. **Add Problem Solving UI:**
   - Dual-pane layout
   - Live code execution
   - Test case display

3. **Add Progress Dashboard:**
   - Pattern mastery map
   - Progress charts
   - Agent-generated recommendations

4. **Polish:**
   - Loading states
   - Error handling
   - Responsive design
   - Accessibility

---

## Complete Package.json

```json
{
  "name": "algomentor-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next": "^14.2.0",
    "@tanstack/react-query": "^5.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "zustand": "^4.5.0",
    "framer-motion": "^11.0.0",
    "@monaco-editor/react": "^4.6.0",
    "lucide-react": "^0.300.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

---

This guide provides everything needed to build the agent-powered UI. The key innovation is that **visualizations are generated by the agent**, not hardcoded!
