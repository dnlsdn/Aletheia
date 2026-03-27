'use client';

const BREAKDOWN_LABELS = {
  shortMessage: 'Short and shareable',
  urgencyWords: 'Contains urgency triggers',
  emotionalWords: 'Emotionally loaded language',
  manyVersions: 'Already spreading across sources',
  lowCredibilitySources: 'Amplified by low-credibility sources',
};

function scoreColor(score) {
  if (score < 30) return '#1D9E75';
  if (score <= 60) return '#D85A30';
  return '#E24B4A';
}

export default function ViralityRisk({ viralityRisk }) {
  if (!viralityRisk) return null;

  const { score, label, breakdown } = viralityRisk;
  const color = scoreColor(score);
  const maxBreakdownValue = Math.max(...Object.values(breakdown), 1);

  return (
    <div className="bg-[#161b2b] rounded-[8px] p-[24px] flex flex-col gap-[24px]">

      {/* Header */}
      <div>
        <h2 className="font-bold text-[20px] text-white tracking-[-0.5px] leading-[28px]">
          Virality Risk Score
        </h2>
        <p className="text-[12px] tracking-[1.2px] uppercase text-[#8c909f] leading-[16px] mt-[2px]">
          Structural spread potential analysis
        </p>
      </div>

      {/* Score display */}
      <div className="flex items-baseline gap-[6px]">
        <span className="font-bold leading-none" style={{ fontSize: '56px', color }}>
          {score}
        </span>
        <span className="font-mono text-[18px] text-[#8c909f] leading-none">/100</span>
      </div>

      {/* Risk label */}
      <p className="text-[15px] text-[#dee1f7] leading-[22px] -mt-[12px]">{label}</p>

      {/* Explanation */}
      <p className="text-[13px] text-[#8c909f] leading-[20px] border-t border-[rgba(66,71,84,0.2)] pt-[16px]">
        This score estimates how quickly this article would spread before an effective debunk could contain it.
        A high score does not mean the article is false — it means it is structurally optimized for sharing.
      </p>

      {/* Breakdown */}
      <div className="flex flex-col gap-[2px]">
        <p className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#8c909f] mb-[8px]">
          Why this score
        </p>
        {Object.entries(breakdown).map(([key, pts]) => {
          const pct = (pts / maxBreakdownValue) * 100;
          return (
            <div key={key} className="bg-[#1a1f2f] px-[16px] py-[12px] flex items-center gap-[16px]">
              <span className="text-[13px] text-[#c2c6d6] leading-[20px] w-[260px] flex-shrink-0">
                {BREAKDOWN_LABELS[key] ?? key}
              </span>
              <div className="flex items-center gap-[12px] flex-1">
                <div className="flex-1 h-[6px] bg-[#2f3445] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: pts === 0 ? '#2f3445' : color }}
                  />
                </div>
                <span className="font-mono text-[11px] text-[#8c909f] w-[24px] text-right flex-shrink-0">
                  {pts}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
