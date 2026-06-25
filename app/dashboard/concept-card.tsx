'use client';

import { useState } from 'react';

interface Concept {
  id?: string;
  subject: string;
  concept: string;
  mastery_level: 'Introduced' | 'Developing' | 'Proficient' | 'Strong';
  strong_areas?: string[];
  weak_areas?: string[];
  next_steps?: string[];
  last_updated?: string;
}

interface ConceptCardProps {
  concept: Concept;
}

const subjectColors: Record<string, { bg: string; text: string }> = {
  Physics: { bg: 'bg-blue-900', text: 'text-blue-200' },
  Biology: { bg: 'bg-green-900', text: 'text-green-200' },
  Mathematics: { bg: 'bg-purple-900', text: 'text-purple-200' },
  'Computer Science': { bg: 'bg-orange-900', text: 'text-orange-200' },
  Chemistry: { bg: 'bg-red-900', text: 'text-red-200' },
};

const masteryColors: Record<string, string> = {
  Strong: 'bg-green-600',
  Proficient: 'bg-blue-600',
  Developing: 'bg-amber-600',
  Introduced: 'bg-gray-600',
};

const masteryPercentage: Record<string, number> = {
  Strong: 100,
  Proficient: 75,
  Developing: 50,
  Introduced: 25,
};

function formatDate(dateString?: string): string {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ConceptCard({ concept }: ConceptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const subjectColor = subjectColors[concept.subject] || {
    bg: 'bg-gray-600',
    text: 'text-gray-200',
  };
  const masteryColor = masteryColors[concept.mastery_level];
  const masteryPct = masteryPercentage[concept.mastery_level];

  return (
    <div
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 cursor-pointer hover:border-gray-500 transition"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span
            className={`inline-block ${subjectColor.bg} ${subjectColor.text} text-xs font-semibold px-3 py-1 rounded-full mb-2`}
          >
            {concept.subject}
          </span>
          <h3 className="text-lg font-semibold text-white">
            {concept.concept}
          </h3>
        </div>
        <span
          className={`${masteryColor} text-white text-xs font-bold px-3 py-1 rounded`}
        >
          {concept.mastery_level}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Mastery</span>
          <span className="text-xs text-gray-400">{masteryPct}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`${masteryColor} h-2 rounded-full transition-all`}
            style={{ width: `${masteryPct}%` }}
          ></div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-400 mb-4">
        Updated: {formatDate(concept.last_updated)}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
          {/* Strong Areas */}
          {concept.strong_areas && concept.strong_areas.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                💪 Strong Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {concept.strong_areas.map((area, idx) => (
                  <span
                    key={idx}
                    className="bg-green-900 text-green-200 text-xs px-2 py-1 rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weak Areas */}
          {concept.weak_areas && concept.weak_areas.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                ⚠️ Weak Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {concept.weak_areas.map((area, idx) => (
                  <span
                    key={idx}
                    className="bg-red-900 text-red-200 text-xs px-2 py-1 rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {concept.next_steps && concept.next_steps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                📋 Next Steps
              </h4>
              <div className="flex flex-wrap gap-2">
                {concept.next_steps.map((step, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expand indicator */}
      <div className="text-right text-xs text-gray-400 mt-4">
        {isExpanded ? '▼' : '▶'} Click to {isExpanded ? 'collapse' : 'expand'}
      </div>
    </div>
  );
}
