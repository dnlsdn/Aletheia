'use client';

import { useState } from 'react';

const VERDICT_CONFIG = {
  VERIFIED:       { bg: '#1D9E75', label: 'Verified' },
  PARTIALLY_TRUE: { bg: '#BA7517', label: 'Partially True' },
  INCONCLUSIVE:   { bg: '#888780', label: 'Inconclusive' },
  MISLEADING:     { bg: '#D85A30', label: 'Misleading' },
  FALSE:          { bg: '#E24B4A', label: 'False' },
};

function confidenceColor(confidence) {
  if (confidence > 70) return '#1D9E75';
  if (confidence >= 40) return '#BA7517';
  return '#E24B4A';
}

export default function VerdictCard({
  verdict,
  confidence,
  summary,
  prosecutorPoints,
  defenderPoints,
  prosecutorSources,
  defenderSources,
  prosecutorArgument,
  defenderArgument,
}) {
  const [showDebate, setShowDebate] = useState(false);

  const config = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.INCONCLUSIVE;
  const barColor = confidenceColor(confidence);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">

      {/* 1. Verdict badge */}
      <div className="flex items-center gap-4 flex-wrap">
        <span
          className="inline-block px-6 py-2 rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: config.bg }}
        >
          {config.label}
        </span>
      </div>

      {/* 2. Confidence bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-600">Confidence</span>
          <span className="text-sm font-semibold text-gray-800">{confidence}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${confidence}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* 3. Summary */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Verdict explanation
        </p>
        <div className="bg-gray-50 rounded-xl px-5 py-4 text-gray-700 text-base leading-relaxed">
          {summary}
        </div>
      </div>

      {/* 4. Key arguments — two columns */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Key arguments
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Against */}
          <div className="bg-red-50 rounded-xl p-4">
            <p className="font-semibold text-red-700 text-sm mb-2">Against</p>
            <ul className="space-y-1.5">
              {prosecutorPoints?.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* In favor */}
          <div className="bg-green-50 rounded-xl p-4">
            <p className="font-semibold text-green-700 text-sm mb-2">In favor</p>
            <ul className="space-y-1.5">
              {defenderPoints?.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 5. Collapsible full debate */}
      <div>
        <button
          onClick={() => setShowDebate((v) => !v)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {showDebate ? 'Hide full debate ▲' : 'Show full debate ▼'}
        </button>

        {showDebate && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prosecution */}
            <div className="border-l-4 border-red-400 pl-4 space-y-3">
              <p className="font-semibold text-red-700 text-sm">Prosecution</p>
              <div
                className="text-sm text-gray-700 leading-relaxed overflow-y-auto bg-red-50 rounded-lg p-3"
                style={{ maxHeight: 200 }}
              >
                {prosecutorArgument}
              </div>
              {prosecutorSources?.length > 0 && (
                <ul className="space-y-2">
                  {prosecutorSources.map((src, i) => (
                    <li key={i}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        {src.title}
                      </a>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{src.snippet}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Defense */}
            <div className="border-l-4 border-green-400 pl-4 space-y-3">
              <p className="font-semibold text-green-700 text-sm">Defense</p>
              <div
                className="text-sm text-gray-700 leading-relaxed overflow-y-auto bg-green-50 rounded-lg p-3"
                style={{ maxHeight: 200 }}
              >
                {defenderArgument}
              </div>
              {defenderSources?.length > 0 && (
                <ul className="space-y-2">
                  {defenderSources.map((src, i) => (
                    <li key={i}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        {src.title}
                      </a>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{src.snippet}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
