'use client';

import { useState, useEffect } from 'react';

const BREAKDOWN_MAX = {
  shortMessage: 20,
  urgencyWords: 20,
  emotionalWords: 20,
  manyVersions: 20,
  lowCredibilitySources: 20,
};

const BREAKDOWN_LABELS = {
  shortMessage: 'Short and shareable',
  urgencyWords: 'Contains urgency triggers',
  emotionalWords: 'Emotionally loaded language',
  manyVersions: 'Already spreading across sources',
  lowCredibilitySources: 'Amplified by low-credibility sources',
};

const BREAKDOWN_LABELS_ZERO = {
  shortMessage: 'Not unusually short',
  urgencyWords: 'No urgency triggers detected',
  emotionalWords: 'No emotional manipulation detected',
  manyVersions: 'Not yet spreading widely',
  lowCredibilitySources: 'No low-credibility amplifiers',
};

const BREAKDOWN_DESCRIPTIONS = {
  shortMessage: 'Short content spreads faster — easier to share without reading fully',
  urgencyWords: 'Words like "breaking", "urgent", "imminent" trigger impulsive sharing',
  emotionalWords: 'Fear, anger, or outrage bypass critical thinking',
  manyVersions: 'Multiple versions already circulating amplify reach exponentially',
  lowCredibilitySources: 'Low-credibility amplifiers reduce friction to resharing',
};

function scoreColor(score) {
  if (score < 30) return '#1D9E75';
  if (score <= 60) return '#D85A30';
  return '#E24B4A';
}

// SVG half-circle arc gauge
// The arc runs from 180° (left) to 0° (right), i.e. a top semicircle.
// cx=70, cy=70, r=56 — the flat edge sits at y=70, leaving room for the number below.
function ArcGauge({ score, color }) {
  const cx = 70, cy = 70, r = 56;
  // Arc from left (180°) to right (0°) — angles in standard math coords
  const toRad = (deg) => (deg * Math.PI) / 180;
  const ptOnArc = (angleDeg) => {
    const a = toRad(angleDeg);
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };

  // Background arc: full 180° (left → right)
  const bgStart = ptOnArc(180);
  const bgEnd   = ptOnArc(0);
  const bgPath  = `M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 0 1 ${bgEnd.x} ${bgEnd.y}`;

  // Foreground arc: 0..score mapped to 180..0°
  const fgAngle = 180 - (score / 100) * 180;
  const fgEnd   = ptOnArc(fgAngle);
  const largeArc = score > 50 ? 1 : 0;
  const fgPath  = `M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${largeArc} 1 ${fgEnd.x} ${fgEnd.y}`;

  return (
    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background track */}
      <path d={bgPath} stroke="#2f3445" strokeWidth="10" strokeLinecap="round" />
      {/* Foreground fill */}
      {score > 0 && (
        <path d={fgPath} stroke={color} strokeWidth="10" strokeLinecap="round" />
      )}
      {/* Score number */}
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize="32"
        fontWeight="bold"
        fontFamily="inherit"
      >
        {score}
      </text>
    </svg>
  );
}

export default function ViralityRisk({ viralityRisk, verdictColor }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const targetScore = viralityRisk?.score ?? 0;

  useEffect(() => {
    if (!viralityRisk) return;
    setAnimatedScore(0);
    setAnimatedProgress(0);
    const duration = 800;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // quadratic ease-out: f(t) = 1 - (1 - t)^2
      const eased = 1 - (1 - t) * (1 - t);
      setAnimatedScore(Math.round(targetScore * eased));
      setAnimatedProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetScore]);

  if (!viralityRisk) return null;

  const { label, breakdown } = viralityRisk;
  const color = scoreColor(targetScore);

  return (
    <div
      className="bg-[#161b2b] rounded-[8px] p-[24px] flex flex-col gap-[24px]"
      style={{ borderLeft: verdictColor ? `4px solid ${verdictColor}` : undefined }}
    >

      {/* Header */}
      <div>
        <h2 className="font-bold text-[20px] text-white tracking-[-0.5px] leading-[28px]">
          Virality Risk Score
        </h2>
        <p className="text-[12px] tracking-[1.2px] uppercase text-[#8c909f] leading-[16px] mt-[2px]">
          Structural spread potential analysis
        </p>
      </div>

      {/* Arc gauge + risk label */}
      <div>
        <ArcGauge score={animatedScore} color={color} />
        <p className="text-[15px] text-[#dee1f7] leading-[22px] mt-[8px]">{label}</p>
      </div>

      {/* Explanation */}
      <p className="text-[15px] text-[#8c909f] leading-[22px] border-t border-[rgba(66,71,84,0.2)] pt-[16px]">
        This score estimates how quickly this article would spread before an effective debunk could contain it.
        A high score does not mean the article is false — it means it is structurally optimized for sharing.
      </p>

      {/* Breakdown */}
      <div className="flex flex-col gap-[2px]">
        <p className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#8c909f] mb-[8px]">
          Why this score
        </p>
        {Object.entries(breakdown).map(([key, pts]) => {
          const max = BREAKDOWN_MAX[key] ?? 20;
          const pct = (pts / max) * 100;
          return (
            <div key={key} className="bg-[#1a1f2f] px-[16px] py-[12px] flex items-start gap-[16px]">
              <div className="w-[260px] flex-shrink-0 flex flex-col gap-[2px]">
                <span
                  className="text-[15px] leading-[22px]"
                  style={{ color: pts === 0 ? '#555c72' : '#c2c6d6' }}
                >
                  {pts === 0 && <span className="mr-[6px]">✓</span>}
                  {pts === 0 ? (BREAKDOWN_LABELS_ZERO[key] ?? BREAKDOWN_LABELS[key] ?? key) : (BREAKDOWN_LABELS[key] ?? key)}
                </span>
                {pts !== 0 && BREAKDOWN_DESCRIPTIONS[key] && (
                  <span style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic', lineHeight: '16px' }}>
                    {BREAKDOWN_DESCRIPTIONS[key]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-[12px] flex-1 mt-[2px]">
                {pts === 0 ? (
                  <div className="flex-1 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-[#555c72]" />
                  </div>
                ) : (
                  <div className="flex-1 h-[6px] bg-[#2f3445] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct * animatedProgress}%`, backgroundColor: color }}
                    />
                  </div>
                )}
                <span className="font-mono text-[11px] w-[40px] text-right flex-shrink-0" style={{ color: pts === 0 ? '#555c72' : '#8c909f' }}>
                  {pts === 0 ? '—' : `${pts} / ${max}`}
                </span>
              </div>
            </div>
          );
        })}
        <div
          className="px-[16px] py-[12px] flex items-center justify-between"
          style={{ borderTop: '1px solid #2f3445' }}
        >
          <span style={{ color: '#8c909f', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.1px' }}>
            Total Virality Risk Score
          </span>
          <span>
            <span style={{ color, fontSize: '16px', fontWeight: 'bold' }}>{animatedScore}</span>
            <span style={{ color: '#555c72', fontSize: '13px' }}> / 100</span>
          </span>
        </div>
      </div>

    </div>
  );
}
