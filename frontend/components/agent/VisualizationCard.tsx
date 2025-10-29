'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Maximize2 } from 'lucide-react';
import { AlgorithmVisualizer, type VisualizationSpec } from '@/components/visualizer/AlgorithmVisualizer';

interface VisualizationCardProps {
  spec: VisualizationSpec;
}

export function VisualizationCard({ spec }: VisualizationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-l-purple-500">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-purple-500 mt-1" />
            <div>
              <p className="font-semibold text-purple-900">
                Interactive Visualization
              </p>
              <p className="text-sm text-purple-700">
                {spec.title}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Pattern: {spec.pattern}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                Show
              </>
            )}
          </Button>
        </div>

        {/* Visualization */}
        {isExpanded && (
          <div className="mt-4 animate-in fade-in duration-300">
            <AlgorithmVisualizer spec={spec} autoPlay={false} />
          </div>
        )}

        {/* Quick Info */}
        {!isExpanded && (
          <div className="text-xs text-purple-600">
            {spec.steps.length} steps • Click "Show" to view animation
          </div>
        )}
      </div>
    </Card>
  );
}
