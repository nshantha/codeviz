'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lightbulb, TrendingUp, Eye } from 'lucide-react';

interface ToolResultCardProps {
  type: 'pattern' | 'hint' | 'knowledge' | 'visualization';
  data: any;
}

export function ToolResultCard({ type, data }: ToolResultCardProps) {
  const renderPattern = () => (
    <div className="flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
      <div>
        <p className="font-semibold">Pattern Identified</p>
        <p className="text-sm text-gray-600">{data.name || data.primaryPattern}</p>
        {data.confidence && (
          <Badge variant="outline" className="mt-1">
            {Math.round(data.confidence * 100)}% confidence
          </Badge>
        )}
      </div>
    </div>
  );

  const renderHint = () => (
    <div className="flex items-start gap-3">
      <Lightbulb className="h-5 w-5 text-yellow-500 mt-1" />
      <div>
        <p className="font-semibold">Hint (Level {data.level || 1})</p>
        <p className="text-sm text-gray-600">{data.question || data.hint}</p>
      </div>
    </div>
  );

  const renderKnowledge = () => (
    <div className="flex items-start gap-3">
      <TrendingUp className="h-5 w-5 text-blue-500 mt-1" />
      <div>
        <p className="font-semibold">Progress Update</p>
        <p className="text-sm text-gray-600">
          {data.pattern}: Mastery {Math.round((data.mastery || 0) * 100)}%
        </p>
      </div>
    </div>
  );

  const renderVisualization = () => (
    <div className="flex items-start gap-3">
      <Eye className="h-5 w-5 text-purple-500 mt-1" />
      <div>
        <p className="font-semibold">Visualization Available</p>
        <p className="text-sm text-gray-600">{data.title || 'Algorithm visualization'}</p>
      </div>
    </div>
  );

  return (
    <Card className="p-3 bg-white border-l-4 border-l-blue-500">
      {type === 'pattern' && renderPattern()}
      {type === 'hint' && renderHint()}
      {type === 'knowledge' && renderKnowledge()}
      {type === 'visualization' && renderVisualization()}
    </Card>
  );
}
