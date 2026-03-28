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

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '\u2026' : str;
}

function CustomDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  const { isSource, similarity } = payload;
  let fill, r;
  if (isSource) {
    fill = '#1D9E75';
    r = 8;
  } else if (similarity >= 0.7) {
    fill = '#BA7517';
    r = 6;
  } else {
    fill = '#E24B4A';
    r = 6;
  }
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke="none" />;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const pct = Math.round(d.similarity * 100);
  const distortion = 100 - pct;

  let statusColor, statusLabel, statusNote;
  if (d.isSource) {
    statusColor = '#1D9E75';
    statusLabel = 'Primary source';
    statusNote = 'This is the original version of the story.';
  } else if (d.similarity >= 0.7) {
    statusColor = '#BA7517';
    statusLabel = 'Minor drift';
    statusNote = `Content changed ${distortion}% from the original — small but detectable alterations.`;
  } else {
    statusColor = '#E24B4A';
    statusLabel = 'Significant distortion';
    statusNote = `Content changed ${distortion}% from the original — the meaning may have shifted substantially.`;
  }

  return (
    <div
      style={{
        backgroundColor: '#161b2b',
        border: `1px solid ${statusColor}55`,
        borderRadius: 8,
        padding: '12px 14px',
        maxWidth: 220,
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#adc6ff', marginBottom: 6, fontWeight: 700 }}>
        {d.domain}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
      </div>
      <p style={{ fontSize: 11, color: '#c2c6d6', margin: '3px 0' }}>
        Faithfulness to original:{' '}
        <span style={{ fontWeight: 700, color: '#fff' }}>{pct}%</span>
      </p>
      <p style={{ fontSize: 11, color: '#c2c6d6', margin: '3px 0' }}>
        Content changed:{' '}
        <span style={{ fontWeight: 700, color: distortion > 30 ? '#E24B4A' : '#BA7517' }}>{distortion}%</span>
      </p>
      <p style={{ fontSize: 10, color: '#8c909f', marginTop: 8, lineHeight: 1.4 }}>
        {statusNote}
      </p>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: '#1a2035', borderRadius: 8, padding: '10px 16px', minWidth: 90, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || '#fff', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#8c909f', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function PlainSummary({ versions }) {
  const total = versions.length;
  const distorted = versions.filter((v) => !v.isSource && v.similarity < 0.7).length;
  const minSim = Math.min(...versions.map((v) => v.similarity));
  const maxDrift = Math.round((1 - minSim) * 100);

  if (distorted === 0) {
    return (
      <p style={{ fontSize: 13, color: '#8c909f', lineHeight: 1.6, margin: 0 }}>
        <span style={{ color: '#1D9E75', fontWeight: 700 }}>No significant distortion detected.</span>{' '}
        All {total} sources tracked stayed faithful to the original story (above 70% similarity). The information appears to have spread without major alterations.
      </p>
    );
  }

  return (
    <p style={{ fontSize: 13, color: '#8c909f', lineHeight: 1.6, margin: 0 }}>
      Out of <span style={{ color: '#fff', fontWeight: 600 }}>{total} sources</span> tracked,{' '}
      <span style={{ color: '#E24B4A', fontWeight: 700 }}>{distorted} significantly distorted</span> the original content — altering up to{' '}
      <span style={{ color: '#E24B4A', fontWeight: 700 }}>{maxDrift}%</span> of the meaning.{' '}
      {distorted >= total / 2
        ? 'The majority of the sources carry a mutated version of the story. Treat secondary reports with caution.'
        : 'Most sources remain close to the original, but distorted versions are in circulation and may spread further.'}
    </p>
  );
}

export default function MutationTimeline({ versions, verdictColor }) {
  if (!versions || versions.length < 2) {
    return (
      <div
        className="bg-[#161b2b] rounded-[8px] p-[24px]"
        style={{ borderLeft: verdictColor ? `4px solid ${verdictColor}` : undefined }}
      >
        <p className="text-[#8c909f] text-[15px]">
          Not enough source versions found to build a timeline.
        </p>
      </div>
    );
  }

  const sorted = [...versions].sort((a, b) => b.similarity - a.similarity);
  const data = sorted.map((v, i) => ({ ...v, index: i + 1 }));

  const totalSources = versions.length;
  const distortedCount = versions.filter((v) => !v.isSource && v.similarity < 0.7).length;
  const faithfulCount = totalSources - distortedCount;
  const minSim = Math.min(...versions.map((v) => v.similarity));

  const xTickFormatter = (value) => {
    const item = data.find((d) => d.index === value);
    return item ? truncate(item.domain, 18) : String(value);
  };

  return (
    <div
      className="bg-[#161b2b] rounded-[8px] p-[24px] flex flex-col gap-[20px]"
      style={{ borderLeft: verdictColor ? `4px solid ${verdictColor}` : undefined }}
    >
      {/* Header */}
      <div>
        <h2 className="font-bold text-[20px] text-white tracking-[-0.5px] leading-[28px]">
          Mutation Timeline
        </h2>
        <p className="text-[12px] tracking-[1.2px] uppercase text-[#8c909f] leading-[16px] mt-[2px]">
          How the article changed across sources
        </p>
      </div>

      {/* Plain-language explanation */}
      <div style={{ background: '#1a2035', borderRadius: 8, padding: '14px 16px', borderLeft: '3px solid #adc6ff33' }}>
        <p style={{ fontSize: 12, color: '#adc6ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
          What is this?
        </p>
        <p style={{ fontSize: 13, color: '#8c909f', lineHeight: 1.6, margin: 0 }}>
          When a news story spreads online, each outlet may change its wording, emphasis, or even meaning.
          This chart tracks how <span style={{ color: '#fff' }}>faithful each source is to the original article</span>.
          A score of <span style={{ color: '#1D9E75', fontWeight: 600 }}>100%</span> means identical content;
          below <span style={{ color: '#E24B4A', fontWeight: 600 }}>70%</span> means the story has been substantially altered — potentially creating misinformation.
        </p>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatPill label="Sources tracked" value={totalSources} color="#adc6ff" />
        <StatPill label="Faithful" value={faithfulCount} color="#1D9E75" />
        <StatPill label="Distorted" value={distortedCount} color={distortedCount > 0 ? '#E24B4A' : '#8c909f'} />
        <StatPill label="Max drift" value={`${Math.round((1 - minSim) * 100)}%`} color={minSim < 0.7 ? '#E24B4A' : '#BA7517'} />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(66,71,84,0.2)" />
          <XAxis
            dataKey="index"
            tickFormatter={xTickFormatter}
            tick={{ fill: '#8c909f', fontSize: 11 }}
            angle={-18}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fill: '#8c909f', fontSize: 11 }}
            label={{
              value: 'Faithfulness to original',
              angle: -90,
              position: 'insideLeft',
              fill: '#8c909f',
              fontSize: 11,
              dx: -4,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={0.7}
            stroke="#BA7517"
            strokeDasharray="5 3"
            label={{
              value: 'Distortion threshold (70%)',
              position: 'insideTopRight',
              fill: '#BA7517',
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="similarity"
            stroke="#adc6ff"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-[24px] flex-wrap">
        <div className="flex items-center gap-[8px]">
          <span className="w-[10px] h-[10px] rounded-full flex-shrink-0 bg-[#1D9E75]" />
          <span className="text-[11px] text-[#8c909f]">Original source</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="w-[8px] h-[8px] rounded-full flex-shrink-0 bg-[#BA7517]" />
          <span className="text-[11px] text-[#8c909f]">Minor drift — story mostly intact (&gt;70% faithful)</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="w-[8px] h-[8px] rounded-full flex-shrink-0 bg-[#E24B4A]" />
          <span className="text-[11px] text-[#8c909f]">Significant distortion — meaning may have changed (&lt;70% faithful)</span>
        </div>
      </div>

      {/* Plain-language summary */}
      <div style={{ borderTop: '1px solid rgba(66,71,84,0.3)', paddingTop: 16 }}>
        <p style={{ fontSize: 11, color: '#adc6ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
          Analysis
        </p>
        <PlainSummary versions={versions} />
      </div>
    </div>
  );
}
