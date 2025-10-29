'use client';

import { useState, useEffect } from 'react';
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

  const handlePlayPause = () => {
    if (currentStep === spec.steps.length - 1) {
      // If at the end, restart from beginning
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(handleNext, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep]);

  return (
    <Card className="overflow-hidden border-2 border-indigo-200 shadow-lg">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">{spec.title}</h3>
            <p className="text-indigo-100 text-sm flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                {spec.pattern}
              </span>
              <span className="text-xs">
                Step {currentStep + 1} of {spec.steps.length}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Controls - moved to top for better UX */}
        <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            disabled={currentStep === 0}
            className="h-12 w-12"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="h-12 w-12"
          >
            <SkipForward className="h-5 w-5 rotate-180" />
          </Button>

          <Button
            onClick={handlePlayPause}
            className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isPlaying ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                {currentStep === spec.steps.length - 1 ? 'Replay' : 'Play'}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentStep === spec.steps.length - 1}
            className="h-12 w-12"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Visualization */}
        <div className="border-2 border-indigo-100 rounded-xl p-8 bg-gradient-to-br from-white to-indigo-50 shadow-inner">
          {spec.type === 'array' && (
            <ArrayVisualizer
              data={spec.data}
              step={spec.steps[currentStep]}
            />
          )}
        </div>

        {/* Step Description - larger and more prominent */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {currentStep + 1}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {spec.steps[currentStep].description}
              </h4>
            </div>
          </div>
        </div>

        {/* Detailed Explanation - enhanced styling */}
        {spec.steps[currentStep].annotation && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border-l-4 border-emerald-500 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg">
                💡
              </div>
              <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
                Detailed Explanation
              </h4>
            </div>
            <p className="text-base text-gray-800 leading-relaxed">
              {spec.steps[currentStep].annotation}
            </p>
          </div>
        )}

        {/* Complexity - more prominent on final step */}
        {spec.steps[currentStep].complexity && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-300 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                ⚡
              </div>
              <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wider">
                Time & Space Complexity
              </h4>
            </div>
            <p className="text-base text-purple-900 font-mono font-semibold">
              {spec.steps[currentStep].complexity}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
