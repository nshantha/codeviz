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

  // Ensure data is an array
  const arrayData = Array.isArray(data) ? data : [];

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

  if (arrayData.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        No data to visualize
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Array */}
      <div className="flex items-end justify-center gap-3">
        {arrayData.map((value, index) => (
          <div key={index} className="flex flex-col items-center gap-3">
            {/* Pointers above */}
            <div className="h-8 flex flex-col items-center justify-end">
              {Object.entries(pointers).map(([name, pos]) =>
                pos === index ? (
                  <motion.div
                    key={name}
                    initial={{ y: -15, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`text-sm font-bold px-2 py-1 rounded-full text-white shadow-lg ${getPointerColor(name)}`}
                  >
                    {name}
                  </motion.div>
                ) : null
              )}
            </div>

            {/* Value box */}
            <motion.div
              className={`
                w-20 h-20 flex items-center justify-center
                border-3 rounded-xl font-bold text-2xl
                shadow-lg transition-all duration-300
                ${highlights.includes(index)
                  ? 'bg-gradient-to-br from-yellow-300 to-amber-400 border-amber-500 shadow-amber-300 ring-4 ring-amber-200'
                  : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:shadow-xl'
                }
              `}
              initial={{ scale: 1, y: 0 }}
              animate={{
                scale: highlights.includes(index) ? 1.15 : 1,
                y: highlights.includes(index) ? -5 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <span className={highlights.includes(index) ? 'text-amber-900' : 'text-gray-700'}>
                {value}
              </span>
            </motion.div>

            {/* Index */}
            <div className={`text-sm font-semibold ${highlights.includes(index) ? 'text-amber-600' : 'text-gray-500'}`}>
              [{index}]
            </div>
          </div>
        ))}
      </div>

      {/* Pointer Legend */}
      {Object.keys(pointers).length > 0 && (
        <div className="flex gap-6 justify-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          {Object.keys(pointers).map(name => (
            <div key={name} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full shadow-md ${getPointerColor(name)}`} />
              <span className="text-sm font-semibold text-gray-700 capitalize">{name} pointer</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
