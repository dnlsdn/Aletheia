'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

// 5 verdict zones on the signed axis
const VERDICT_REFS = [
  { y: 75,  label: 'VERIFIED',       color: '#68dbae' },
  { y: 25,  label: 'PARTIALLY TRUE', color: '#ba7517' },
  { y: 0,   label: 'INCONCLUSIVE',   color: '#8c909f' },
  { y: -25, label: 'MISLEADING',     color: '#ffb4ab' },
  { y: -75, label: 'FALSE',          color: '#ff4444' },
];

function getAgentColor(agent) {
  if (agent === 'prosecutor') return '#E24B4A';
  if (agent === 'defender')   return '#1D9E75';
  return '#8c909f';
}

function leanLabel(value) {
  if (value > 60)  return 'Strongly toward VERIFIED';
  if (value > 20)  return 'Leaning toward TRUE';
  if (value > -20) return 'Neutral / Inconclusive';
  if (value > -60) return 'Leaning toward FALSE';
  return 'Strongly toward FALSE';
}

// Custom Y axis tick — shows verdict name in color instead of numbers
function VerdictTick({ x, y, payload }) {
  const ref = VERDICT_REFS.find((r) => r.y === payload.value);
  if (!ref) return null;
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={ref.color}
      fontSize={9}
      fontWeight={700}
      letterSpacing="0.6px"
    >
      {ref.label}
    </text>
  );
}

function CustomDot({ cx, cy, payload, verdictColor }) {
  if (cx == null || cy == null) return null;
  if (payload.isFinal) {
    return (
      <circle cx={cx} cy={cy} r={9} fill={verdictColor || '#adc6ff'} stroke="#0e1322" strokeWidth={2} />
    );
  }
  const color = getAgentColor(payload.agent);
  const r = payload.agent === 'start' ? 4 : 6;
  return <circle cx={cx} cy={cy} r={r} fill={color} stroke="none" />;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const agentColor = getAgentColor(d.agent);
  const agentLabel =
    d.agent === 'prosecutor' ? 'Prosecution evidence' :
    d.agent === 'defender'   ? 'Defense evidence' :
    'Starting point';

  return (
    <div
      style={{
        backgroundColor: '#161b2b',
        border: `1px solid ${agentColor}55`,
        borderRadius: 8,
        padding: '12px 14px',
        maxWidth: 240,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: agentColor, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: agentColor, fontWeight: 700 }}>{agentLabel}</span>
      </div>
      {d.domain && !d.domain.toLowerCase().includes('implicit') && (
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#adc6ff', marginBottom: 4 }}>
          {d.domain}
        </p>
      )}
      {d.source && d.agent !== 'start' && !d.source.toLowerCase().includes('implicit') && (
        <p style={{ fontSize: 11, color: '#c2c6d6', marginBottom: 6, lineHeight: 1.4 }}>
          {d.source.length > 70 ? d.source.slice(0, 70) + '\u2026' : d.source}
        </p>
      )}
      <p style={{ fontSize: 11, color: '#8c909f', marginTop: 4 }}>
        {leanLabel(d.confidence)}
      </p>
    </div>
  );
}

export default function JudgeTimeline({ confidenceTimeline, verdict, verdictColor }) {
  if (!confidenceTimeline || confidenceTimeline.length < 3) return null;

  const data = confidenceTimeline.map((p, i) => ({
    ...p,
    isFinal: i === confidenceTimeline.length - 1,
  }));

  const xTickFormatter = (value) => {
    const item = data.find((d) => d.step === value);
    if (!item || item.agent === 'start') return 'Start';
    return item.domain ? item.domain.slice(0, 14) : `#${value}`;
  };

  return (
    <div
      className="bg-[#161b2b] rounded-[8px] p-[24px] flex flex-col gap-[20px]"
      style={{ borderLeft: verdictColor ? `4px solid ${verdictColor}` : undefined }}
    >
      {/* Header */}
      <div>
        <h2 className="font-bold text-[20px] text-white tracking-[-0.5px] leading-[28px]">
          Judge&apos;s Deliberation
        </h2>
        <p className="text-[12px] tracking-[1.2px] uppercase text-[#8c909f] leading-[16px] mt-[2px]">
          How the judge&apos;s position shifted as evidence was reviewed
        </p>
      </div>

      {/* What is this */}
      <div style={{ background: '#1a2035', borderRadius: 8, padding: '14px 16px', borderLeft: '3px solid #adc6ff33' }}>
        <p style={{ fontSize: 12, color: '#adc6ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
          What is this?
        </p>
        <p style={{ fontSize: 13, color: '#8c909f', lineHeight: 1.6, margin: 0 }}>
          Each point is a source reviewed during the debate. The judge started{' '}
          <span style={{ color: '#8c909f', fontWeight: 600 }}>neutral (0)</span>.{' '}
          <span style={{ color: '#E24B4A', fontWeight: 600 }}>Prosecution evidence</span> pulls toward{' '}
          <span style={{ color: '#ff4444', fontWeight: 600 }}>FALSE</span>;{' '}
          <span style={{ color: '#1D9E75', fontWeight: 600 }}>defense evidence</span> pulls toward{' '}
          <span style={{ color: '#68dbae', fontWeight: 600 }}>VERIFIED</span>.{' '}
          The final position reflects the verdict: <span style={{ color: verdictColor || '#adc6ff', fontWeight: 700 }}>{verdict}</span>.
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 72, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(66,71,84,0.2)" />

          <XAxis
            dataKey="step"
            tickFormatter={xTickFormatter}
            tick={{ fill: '#8c909f', fontSize: 10 }}
            angle={-18}
            textAnchor="end"
            interval={0}
          />

          <YAxis
            domain={[-100, 100]}
            ticks={[-75, -25, 0, 25, 75]}
            tick={<VerdictTick />}
            axisLine={{ stroke: 'rgba(66,71,84,0.3)' }}
            tickLine={false}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* 5 verdict zone reference lines */}
          {VERDICT_REFS.map((ref) => (
            <ReferenceLine
              key={ref.label}
              y={ref.y}
              stroke={ref.color}
              strokeOpacity={0.25}
              strokeDasharray="4 3"
            />
          ))}

          <Line
            type="monotone"
            dataKey="confidence"
            stroke="#adc6ff"
            strokeWidth={2}
            dot={(dotProps) => <CustomDot {...dotProps} verdictColor={verdictColor} />}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-[24px] flex-wrap">
        <div className="flex items-center gap-[8px]">
          <span className="w-[8px] h-[8px] rounded-full flex-shrink-0 bg-[#E24B4A]" />
          <span className="text-[11px] text-[#8c909f]">Prosecution source — pulls toward FALSE</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="w-[8px] h-[8px] rounded-full flex-shrink-0 bg-[#1D9E75]" />
          <span className="text-[11px] text-[#8c909f]">Defense source — pulls toward VERIFIED</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span
            className="w-[10px] h-[10px] rounded-full flex-shrink-0"
            style={{ backgroundColor: verdictColor || '#adc6ff' }}
          />
          <span className="text-[11px] text-[#8c909f]">
            Final verdict — {verdict}
          </span>
        </div>
      </div>
    </div>
  );
}
