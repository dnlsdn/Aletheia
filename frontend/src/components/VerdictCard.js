'use client';

import { useState } from 'react';

const VERDICT_CONFIG = {
  VERIFIED:       { pillBg: '#68dbae', pillText: '#003822', accentColor: '#68dbae', label: 'Verified' },
  PARTIALLY_TRUE: { pillBg: '#ffd8a8', pillText: '#5c3800', accentColor: '#ba7517', label: 'Partially True' },
  INCONCLUSIVE:   { pillBg: '#c2c6d6', pillText: '#2f3445', accentColor: '#8c909f', label: 'Inconclusive' },
  MISLEADING:     { pillBg: '#ffb4ab', pillText: '#690005', accentColor: '#ffb4ab', label: 'Misleading' },
  FALSE:          { pillBg: '#ffb4ab', pillText: '#690005', accentColor: '#ff4444', label: 'False' },
};

function confidenceBarColor(confidence) {
  if (confidence > 70) return '#68dbae';
  if (confidence >= 40) return '#ba7517';
  return '#ffb4ab';
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
  const barColor = confidenceBarColor(confidence);

  return (
    <div
      className="bg-[#161b2b] rounded-[8px] overflow-hidden w-full"
      style={{ borderLeft: `4px solid ${config.accentColor}` }}
    >
      <div className="flex flex-col gap-[24px] p-[24px]">

        {/* 1. Verdict badge + Confidence bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span
            className="inline-block px-[24px] py-[8px] rounded-full text-[18px] font-bold uppercase tracking-[-0.45px]"
            style={{ backgroundColor: config.pillBg, color: config.pillText }}
          >
            {config.label}
          </span>
          <div className="flex flex-col gap-[8px] w-[240px]">
            <div className="flex justify-between items-center">
              <span className="text-[11px] tracking-[0.55px] uppercase text-[#8c909f]">Confidence Score</span>
              <span className="text-[11px] tracking-[0.55px] uppercase text-[#8c909f]">{confidence}%</span>
            </div>
            <div className="w-full h-[8px] bg-[#2f3445] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${confidence}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        </div>

        {/* 2. Summary with left accent border */}
        <div
          className="bg-[#1a1f2f] rounded-[8px] pl-[22px] pr-[20px] py-[18px] border-l-2"
          style={{ borderColor: config.accentColor }}
        >
          <p className="text-[#c2c6d6] text-[15px] leading-[23px]">{summary}</p>
        </div>

        {/* 3. Key arguments — two columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          <div className="bg-[#25293a] rounded-[8px] p-[16px] flex flex-col gap-[8px]">
            <span className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#ffb4ab]">Against</span>
            <ul className="flex flex-col gap-[8px]">
              {prosecutorPoints?.map((point, i) => (
                <li key={i} className="flex gap-[12px] items-start">
                  <span className="mt-[6px] w-[8px] h-[8px] rounded-full bg-[#ffb4ab] flex-shrink-0" />
                  <span className="text-[#dee1f7] text-[15px] leading-[22px]">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#25293a] rounded-[8px] p-[16px] flex flex-col gap-[8px]">
            <span className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#68dbae]">In Favor</span>
            <ul className="flex flex-col gap-[8px]">
              {defenderPoints?.map((point, i) => (
                <li key={i} className="flex gap-[12px] items-start">
                  <span className="mt-[6px] w-[8px] h-[8px] rounded-full bg-[#68dbae] flex-shrink-0" />
                  <span className="text-[#dee1f7] text-[15px] leading-[22px]">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Collapsible full debate */}
        <div className="border-t border-[rgba(66,71,84,0.2)] pt-[24px]">
          <button
            onClick={() => setShowDebate(v => !v)}
            className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#adc6ff] hover:text-[#c2d8ff] transition-colors mb-[16px]"
          >
            {showDebate ? 'Hide full debate ▲' : 'Show full debate ▼'}
          </button>

          {showDebate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[rgba(66,71,84,0.1)]">
              {/* Prosecution */}
              <div className="bg-[#161b2b] pb-[16px] pr-[16px]">
                <div className="border-l-2 border-[#ffb4ab] pl-[18px] py-[8px] flex flex-col gap-[8px]">
                  <span className="text-[12px] font-bold uppercase text-[#ffb4ab]">Prosecution Case</span>
                  <div
                    className="text-[15px] text-[#c2c6d6] leading-[22px] overflow-y-auto"
                    style={{ maxHeight: 200 }}
                  >
                    {prosecutorArgument}
                  </div>
                  {prosecutorSources?.length > 0 && (
                    <ul className="flex flex-col gap-[12px] mt-[4px]">
                      {prosecutorSources.map((src, i) => (
                        <li key={i}>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#adc6ff] text-[13px] hover:underline"
                          >
                            {src.title}
                          </a>
                          <p className="text-[11px] uppercase text-[#8c909f] opacity-60 mt-[2px] leading-[16.8px]">
                            {src.snippet}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {/* Defense */}
              <div className="bg-[#161b2b] pb-[16px] pl-[16px]">
                <div className="border-l-2 border-[#68dbae] pl-[18px] py-[8px] flex flex-col gap-[8px]">
                  <span className="text-[12px] font-bold uppercase text-[#68dbae]">Defense Case</span>
                  <div
                    className="text-[15px] text-[#c2c6d6] leading-[22px] overflow-y-auto"
                    style={{ maxHeight: 200 }}
                  >
                    {defenderArgument}
                  </div>
                  {defenderSources?.length > 0 && (
                    <ul className="flex flex-col gap-[12px] mt-[4px]">
                      {defenderSources.map((src, i) => (
                        <li key={i}>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#adc6ff] text-[13px] hover:underline"
                          >
                            {src.title}
                          </a>
                          <p className="text-[11px] uppercase text-[#8c909f] opacity-60 mt-[2px] leading-[16.8px]">
                            {src.snippet}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
