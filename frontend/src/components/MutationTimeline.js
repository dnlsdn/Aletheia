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
  return (
    <div
      style={{
        backgroundColor: '#161b2b',
        border: '1px solid rgba(66,71,84,0.3)',
        borderRadius: 6,
        padding: '10px 12px',
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#adc6ff', marginBottom: 4 }}>
        {d.domain}
      </p>
      <p style={{ fontSize: 11, color: '#c2c6d6', margin: '2px 0' }}>
        Similarity:{' '}
        <span style={{ fontWeight: 700, color: '#fff' }}>{Math.round(d.similarity * 100)}%</span>
      </p>
      <p style={{ fontSize: 11, color: '#c2c6d6', margin: '2px 0' }}>
        Mutation score:{' '}
        <span style={{ fontWeight: 700, color: '#fff' }}>{d.mutationScore}</span>
      </p>
    </div>
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

  const xTickFormatter = (value) => {
    const item = data.find((d) => d.index === value);
    return item ? truncate(item.domain, 18) : String(value);
  };

  return (
    <div
      className="bg-[#161b2b] rounded-[8px] p-[24px] flex flex-col gap-[16px]"
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
            tickFormatter={(v) => v.toFixed(1)}
            tick={{ fill: '#8c909f', fontSize: 11 }}
            label={{
              value: 'Similarity to original',
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
              value: 'Distortion threshold',
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
          <span className="text-[11px] text-[#8c909f]">Primary source</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="w-[8px] h-[8px] rounded-full flex-shrink-0 bg-[#BA7517]" />
          <span className="text-[11px] text-[#8c909f]">Minor drift (&lt; 30% mutation)</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="w-[8px] h-[8px] rounded-full flex-shrink-0 bg-[#E24B4A]" />
          <span className="text-[11px] text-[#8c909f]">Significant distortion (&gt; 30% mutation)</span>
        </div>
      </div>
    </div>
  );
}
