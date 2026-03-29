'use client';

import { useState, useEffect } from 'react';

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '\u2026' : str;
}

function barColor(v) {
  if (v.isSource) return '#1D9E75';
  if (v.similarity >= 0.7) return '#BA7517';
  return '#E24B4A';
}

function StatPill({ label, value, color, animate }) {
  // value may be a number or a string like "45%"
  const isPercent = typeof value === 'string' && value.endsWith('%');
  const numericTarget = isPercent
    ? parseInt(value, 10)
    : typeof value === 'number'
    ? value
    : null;

  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!animate || numericTarget == null) return;
    const duration = 800;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplayed(Math.round(eased * numericTarget));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [animate, numericTarget]);

  const displayValue =
    numericTarget != null
      ? isPercent
        ? `${displayed}%`
        : displayed
      : value;

  return (
    <div style={{ background: '#1a2035', borderRadius: 8, padding: '10px 16px', minWidth: 90, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || '#fff', letterSpacing: '-0.5px' }}>{displayValue}</div>
      <div style={{ fontSize: 10, color: '#8c909f', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function PlainSummary({ others, distortedCount, maxDrift }) {
  const total = others.length;

  if (distortedCount === 0) {
    return (
      <p style={{ fontSize: 13, color: '#8c909f', lineHeight: 1.6, margin: 0 }}>
        <span style={{ color: '#1D9E75', fontWeight: 700 }}>Nessuna distorsione significativa rilevata.</span>{' '}
        Tutte le {total} fonti secondarie tracciate sono rimaste fedeli alla notizia originale (oltre 70% di similarità).
        Le informazioni sembrano essersi diffuse senza alterazioni rilevanti.
      </p>
    );
  }

  return (
    <p style={{ fontSize: 13, color: '#8c909f', lineHeight: 1.6, margin: 0 }}>
      Su <span style={{ color: '#fff', fontWeight: 600 }}>{total} fonti secondarie</span> tracciate,{' '}
      <span style={{ color: '#E24B4A', fontWeight: 700 }}>{distortedCount} hanno distorto significativamente</span> il contenuto originale — con una deriva massima del{' '}
      <span style={{ color: '#E24B4A', fontWeight: 700 }}>{maxDrift}%</span>.{' '}
      {distortedCount >= total / 2
        ? 'La maggioranza delle fonti veicola una versione mutata della notizia. Trattare i report secondari con cautela.'
        : "La maggior parte delle fonti rimane vicina all'originale, ma versioni distorte sono in circolazione e potrebbero diffondersi ulteriormente."}
    </p>
  );
}

function mutationScoreColor(score) {
  if (score <= 3) return '#1D9E75';
  if (score <= 6) return '#BA7517';
  return '#E24B4A';
}

function SimilarityBar({ v, expanded, onToggle, mounted, rowIndex }) {
  const pct = Math.round(v.similarity * 100);
  const color = barColor(v);
  const isSource = v.isSource;
  const scoreColor = mutationScoreColor(v.mutationScore ?? 0);

  return (
    <div style={{ borderRadius: 6, overflow: 'hidden' }}>
      {/* Row */}
      <div
        onClick={isSource ? (v.url ? () => window.open(v.url, '_blank', 'noopener,noreferrer') : undefined) : onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 10px',
          borderLeft: isSource ? `3px solid #1D9E75` : '3px solid transparent',
          background: isSource
            ? 'rgba(29,158,117,0.06)'
            : expanded
            ? 'rgba(173,198,255,0.06)'
            : 'transparent',
          cursor: isSource ? (v.url ? 'pointer' : 'default') : 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s ease',
        }}
      >
        {/* Domain label */}
        <div style={{ width: 140, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              lineHeight: '16px',
              color: isSource ? '#1D9E75' : '#adc6ff',
              whiteSpace: 'nowrap',
            }}
          >
            {truncate(v.domain, 20)}
          </span>
          {isSource && (
            <span
              style={{
                fontSize: 9,
                fontFamily: 'sans-serif',
                fontWeight: 700,
                background: '#1D9E75',
                color: '#fff',
                borderRadius: 3,
                padding: '1px 5px',
                letterSpacing: '0.5px',
                flexShrink: 0,
              }}
            >
              ORIGINAL
            </span>
          )}
        </div>

        {/* Bar track */}
        <div style={{ flex: 1, position: 'relative', height: 18 }}>
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: 0,
              height: 14,
              width: mounted ? `${pct}%` : '0%',
              background: color,
              borderRadius: 3,
              opacity: 0.85,
              transition: `width 600ms ease ${rowIndex * 60}ms`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '70%',
              width: 1,
              height: '100%',
              borderLeft: '1.5px dashed #BA7517',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Percentage value */}
        <div style={{ width: 36, textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: color, fontFamily: 'monospace' }}>
            {pct}%
          </span>
        </div>

        {/* Credibility badge (not shown for the source row) */}
        {!isSource && v.credibility && (
          <div
            title="Source credibility score — measures the historical reliability of this outlet (0–100)."
            style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: v.credibility.color,
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: v.credibility.color, fontFamily: 'monospace' }}>
              {v.credibility.score}
            </span>
          </div>
        )}

        {/* Chevron */}
        {!isSource && (
          <div style={{ width: 16, flexShrink: 0, textAlign: 'right', fontSize: 11, color: '#8c909f' }}>
            {expanded ? '▾' : '▸'}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {!isSource && expanded && (
        <div
          style={{
            background: 'rgba(173,198,255,0.04)',
            borderLeft: '3px solid rgba(173,198,255,0.2)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Title */}
          {v.title && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
              {v.title}
            </p>
          )}

          {/* Snippet */}
          {v.snippet && (
            <p style={{ margin: 0, fontSize: 12, color: '#8c909f', lineHeight: 1.6 }}>
              {v.snippet}
            </p>
          )}

          {/* Mutation score */}
          {v.mutationScore != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#8c909f', flexShrink: 0 }}>
                Mutation intensity:
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor, fontFamily: 'monospace', flexShrink: 0 }}>
                {v.mutationScore}/10
              </span>
              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(v.mutationScore / 10) * 100}%`,
                    background: scoreColor,
                    borderRadius: 2,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Link */}
          {v.url && (
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#adc6ff', textDecoration: 'none', alignSelf: 'flex-start' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Open source →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function MutationTimeline({ versions, verdictColor }) {
  const [expandedUrl, setExpandedUrl] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!versions || versions.length < 2) {
    return (
      <div
        className="bg-[#161b2b] rounded-[8px] p-[24px]"
        style={{ borderLeft: verdictColor ? `4px solid ${verdictColor}` : undefined }}
      >
        <p className="text-[#8c909f] text-[15px]">
          Non sono state trovate abbastanza versioni per costruire una timeline.
        </p>
      </div>
    );
  }

  // Normalize: the original source is always 100% faithful to itself
  const normalized = versions.map((v) =>
    v.isSource ? { ...v, similarity: 1.0 } : v
  );

  // Original source first, then others sorted by similarity descending
  const source = normalized.find((v) => v.isSource);
  const others = normalized
    .filter((v) => !v.isSource)
    .sort((a, b) => b.similarity - a.similarity);

  const ordered = source ? [source, ...others] : others;

  // Stats exclude the original source
  const distortedCount = others.filter((v) => v.similarity < 0.7).length;
  const faithfulCount = others.filter((v) => v.similarity >= 0.7).length;
  const minSim = others.length > 0 ? Math.min(...others.map((v) => v.similarity)) : 1;
  const maxDrift = Math.round((1 - minSim) * 100);

  return (
    <div
      className="bg-[#161b2b] rounded-[8px] p-[24px] flex flex-col gap-[20px]"
      style={{ borderLeft: verdictColor ? `4px solid ${verdictColor}` : undefined }}
    >
      {/* Header */}
      <div>
        <h2 className="font-bold text-[20px] text-white tracking-[-0.5px] leading-[28px]">
          Source Drift Analysis
        </h2>
        <p className="text-[12px] tracking-[1.2px] uppercase text-[#8c909f] leading-[16px] mt-[2px]">
          Come la notizia si è trasformata nelle diverse fonti
        </p>
      </div>

      {/* Plain-language explanation */}
      <div style={{ background: '#1a2035', borderRadius: 8, padding: '14px 16px', borderLeft: '3px solid #adc6ff33' }}>
        <p style={{ fontSize: 12, color: '#adc6ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
          Come leggere questo grafico
        </p>
        <p style={{ fontSize: 13, color: '#8c909f', lineHeight: 1.6, margin: 0 }}>
          Il grafico parte dalla <span style={{ color: '#1D9E75', fontWeight: 600 }}>fonte originale</span> (100% fedeltà)
          e mostra come ciascuna fonte secondaria si discosta da essa.
          Sotto il <span style={{ color: '#E24B4A', fontWeight: 600 }}>70% di fedeltà</span> il contenuto è considerato
          significativamente distorto — potenzialmente fonte di disinformazione.
        </p>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatPill label="Fonti secondarie" value={others.length} color="#adc6ff" animate={mounted} />
        <StatPill label="Fedeli" value={faithfulCount} color="#1D9E75" animate={mounted} />
        <StatPill label="Distorte" value={distortedCount} color={distortedCount > 0 ? '#E24B4A' : '#8c909f'} animate={mounted} />
        <StatPill label="Deriva max" value={`${maxDrift}%`} color={minSim < 0.7 ? '#E24B4A' : '#BA7517'} animate={mounted} />
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 4 }}>
          <div style={{ width: 140, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: '#8c909f', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Fonte</span>
          </div>
          <div style={{ flex: 1, position: 'relative', height: 16 }}>
            {/* Threshold label above the 70% mark */}
            <span
              style={{
                position: 'absolute',
                left: '70%',
                transform: 'translateX(-50%)',
                fontSize: 9,
                color: '#BA7517',
                fontWeight: 700,
                letterSpacing: '0.4px',
                whiteSpace: 'nowrap',
              }}
            >
              Distortion threshold
            </span>
          </div>
          <div style={{ width: 36, flexShrink: 0 }} />
          {/* Credibility badge column header */}
          <div style={{ width: 44, flexShrink: 0 }} />
        </div>

        <div style={{ position: 'relative' }}>
          <div
            style={
              others.length > 8
                ? { maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }
                : { display: 'flex', flexDirection: 'column', gap: 2 }
            }
          >
            {ordered.map((v, i) => {
              const key = v.url || v.domain + i;
              return (
                <SimilarityBar
                  key={key}
                  v={v}
                  expanded={expandedUrl === key}
                  onToggle={() => setExpandedUrl(expandedUrl === key ? null : key)}
                  mounted={mounted}
                  rowIndex={i}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-[24px] flex-wrap">
        <div className="flex items-center gap-[8px]">
          <span className="w-[10px] h-[10px] rounded-full flex-shrink-0 bg-[#1D9E75]" />
          <span className="text-[11px] text-[#8c909f]">Fonte originale (100%)</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="w-[8px] h-[8px] rounded-full flex-shrink-0 bg-[#BA7517]" />
          <span className="text-[11px] text-[#8c909f]">Deriva minore — notizia sostanzialmente intatta (&gt;70%)</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="w-[8px] h-[8px] rounded-full flex-shrink-0 bg-[#E24B4A]" />
          <span className="text-[11px] text-[#8c909f]">Distorsione significativa — significato alterato (&lt;70%)</span>
        </div>
      </div>

      {/* Top Distortions */}
      {(() => {
        const topDistorted = others
          .filter((v) => v.similarity < 0.7)
          .sort((a, b) => a.similarity - b.similarity)
          .slice(0, 3);
        if (topDistorted.length === 0) return null;
        return (
          <div style={{ borderTop: '1px solid rgba(66,71,84,0.3)', paddingTop: 16 }}>
            <p style={{ fontSize: 11, color: '#adc6ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              Top Distortions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topDistorted.map((v, i) => {
                const drift = Math.round((1 - v.similarity) * 100);
                return (
                  <div
                    key={v.url || v.domain + i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: '#1a2035',
                      borderRadius: 6,
                      padding: '8px 12px',
                    }}
                  >
                    <span
                      style={{
                        background: '#E24B4A',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 800,
                        borderRadius: 4,
                        padding: '2px 6px',
                        flexShrink: 0,
                        letterSpacing: '0.4px',
                      }}
                    >
                      #{i + 1}
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: '#adc6ff',
                        flexShrink: 0,
                        minWidth: 100,
                      }}
                    >
                      {truncate(v.domain, 20)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#E24B4A',
                        flexShrink: 0,
                      }}
                    >
                      {drift}% drift
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: '#8c909f',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {truncate(v.title || '', 60)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Plain-language summary */}
      <div style={{ borderTop: '1px solid rgba(66,71,84,0.3)', paddingTop: 16 }}>
        <p style={{ fontSize: 11, color: '#adc6ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
          Analisi
        </p>
        <PlainSummary others={others} distortedCount={distortedCount} maxDrift={maxDrift} />
      </div>
    </div>
  );
}
