'use client';

import { useRef, useEffect, useCallback } from 'react';

const CREDIBILITY_LEVELS = [
  { color: '#1D9E75', label: 'High credibility', bg: 'rgba(29,158,117,0.12)', border: 'rgba(29,158,117,0.3)' },
  { color: '#BA7517', label: 'Medium credibility', bg: 'rgba(186,117,23,0.12)', border: 'rgba(186,117,23,0.3)' },
  { color: '#E24B4A', label: 'Low credibility', bg: 'rgba(226,75,74,0.12)', border: 'rgba(226,75,74,0.3)' },
];

function deriveStats(graph) {
  if (!graph) return { total: 0, high: 0, medium: 0, low: 0 };
  const total = graph.nodes.length;
  const high = graph.nodes.filter((n) => n.color === '#1D9E75').length;
  const low = graph.nodes.filter((n) => n.color === '#E24B4A').length;
  const medium = total - high - low;
  return { total, high, medium, low };
}

function CredibilityVerdict({ stats }) {
  const { total, high, low, medium } = stats;
  if (total === 0) return null;

  const highPct = Math.round((high / total) * 100);
  const lowPct = Math.round((low / total) * 100);

  let color, icon, headline, body;

  if (lowPct >= 50) {
    color = '#E24B4A';
    icon = '⚠';
    headline = 'Dominated by low-credibility outlets';
    body = `${lowPct}% of the sources spreading this story come from outlets with a low credibility score. Stories that circulate primarily through unreliable channels are at significantly higher risk of distortion and misinformation.`;
  } else if (highPct >= 50) {
    color = '#1D9E75';
    icon = '✓';
    headline = 'Mostly picked up by credible outlets';
    body = `${highPct}% of sources are high-credibility outlets. While this does not guarantee accuracy, broad coverage by established media is a positive signal for the reliability of this story.`;
  } else {
    color = '#BA7517';
    icon = '~';
    headline = 'Mixed credibility landscape';
    body = `This story has spread across a mix of credible and less reliable outlets (${high} high, ${medium} medium, ${low} low). Cross-check the claim against primary sources before sharing.`;
  }

  return (
    <div style={{ borderTop: '1px solid rgba(66,71,84,0.3)', padding: '16px 24px 4px' }}>
      <p style={{ fontSize: 11, color: '#adc6ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
        Credibility Assessment
      </p>
      <div style={{ background: '#1a2035', borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
        <p style={{ fontSize: 13, color, fontWeight: 700, marginBottom: 4 }}>
          {icon}&nbsp; {headline}
        </p>
        <p style={{ fontSize: 12, color: '#8c909f', lineHeight: 1.6, margin: 0 }}>
          {body}
        </p>
      </div>
    </div>
  );
}

export default function SourceGraph({ graph, verdictColor }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graph || graph.nodes.length < 2) return;

    let Network, DataSet;
    try {
      ({ Network } = require('vis-network/standalone'));
      ({ DataSet } = require('vis-network/standalone'));
    } catch {
      return;
    }

    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    const enrichedNodes = graph.nodes.map((n) => ({
      ...n,
      font: {
        color: '#dee1f7',
        size: 12,
        face: 'monospace',
        strokeWidth: 3,
        strokeColor: '#0e1322',
      },
      borderWidth: 2,
      borderWidthSelected: 3,
      color: {
        background: n.color,
        border: n.color,
        highlight: { background: n.color, border: '#ffffff' },
        hover: { background: n.color, border: '#ffffff' },
      },
    }));

    const data = {
      nodes: new DataSet(enrichedNodes),
      edges: new DataSet(graph.edges.map(({ label: _label, ...e }) => e)),
    };

    const options = {
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed',
          levelSeparation: 110,
          nodeSpacing: 160,
        },
      },
      edges: {
        arrows: { to: { enabled: true, scaleFactor: 0.7 } },
        color: { color: 'rgba(173,198,255,0.25)', highlight: 'rgba(173,198,255,0.7)', hover: 'rgba(173,198,255,0.5)' },
        font: {
          size: 10,
          color: '#8c909f',
          face: 'monospace',
          background: 'rgba(14,19,34,0.85)',
          strokeWidth: 0,
          align: 'middle',
        },
        smooth: { type: 'curvedCW', roundness: 0.15 },
        width: 1.5,
        selectionWidth: 2.5,
      },
      nodes: {
        shape: 'dot',
        scaling: { min: 14, max: 44 },
      },
      physics: { enabled: false },
      interaction: { hover: true, tooltipDelay: 100, zoomView: true },
    };

    networkRef.current = new Network(containerRef.current, data, options);

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graph]);

  const handleZoom = useCallback((direction) => {
    if (!networkRef.current) return;
    const current = networkRef.current.getScale();
    const next = direction === 'in' ? current * 1.3 : current / 1.3;
    networkRef.current.moveTo({ scale: next, animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
  }, []);

  const isEmpty = !graph || graph.nodes.length < 2;
  const stats = deriveStats(graph);

  return (
    <div
      className="bg-[#161b2b] rounded-[8px] overflow-hidden"
      style={{ borderLeft: verdictColor ? `4px solid ${verdictColor}` : undefined }}
    >
      {/* Header */}
      <div className="px-[24px] pt-[24px] pb-[20px] border-b border-[rgba(66,71,84,0.15)]">
        <div className="flex items-start justify-between gap-[16px]">
          <div>
            <h2 className="font-bold text-[20px] text-white tracking-[-0.5px] leading-[28px]">
              Source Credibility Graph
            </h2>
            <p className="text-[11px] tracking-[1.1px] uppercase text-[#8c909f] leading-[16px] mt-[2px]">
              Propagation network · size = credibility score
            </p>
          </div>

          {/* Stats chips */}
          {!isEmpty && (
            <div className="flex items-center gap-[8px] flex-shrink-0 pt-[2px]">
              <span className="font-mono text-[11px] px-[10px] py-[4px] rounded-[4px] bg-[rgba(29,158,117,0.1)] text-[#1D9E75] border border-[rgba(29,158,117,0.2)]">
                {stats.high} HIGH
              </span>
              <span className="font-mono text-[11px] px-[10px] py-[4px] rounded-[4px] bg-[rgba(226,75,74,0.1)] text-[#E24B4A] border border-[rgba(226,75,74,0.2)]">
                {stats.low} LOW
              </span>
              <span className="font-mono text-[11px] px-[10px] py-[4px] rounded-[4px] bg-[rgba(173,198,255,0.06)] text-[#adc6ff] border border-[rgba(173,198,255,0.15)]">
                {stats.total} NODES
              </span>
            </div>
          )}
        </div>

        {/* Plain-language explanation */}
        <div style={{ background: '#1a2035', borderRadius: 8, padding: '12px 14px', marginTop: 16, borderLeft: '3px solid rgba(173,198,255,0.2)' }}>
          <p style={{ fontSize: 11, color: '#adc6ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            How to read this graph
          </p>
          <p style={{ fontSize: 12, color: '#8c909f', lineHeight: 1.6, margin: 0 }}>
            Each <span style={{ color: '#fff' }}>dot is a website</span> that published or shared this story.{' '}
            <span style={{ color: '#fff' }}>Bigger dot = more credible source.</span>{' '}
            Arrows show how information flowed — follow them top to bottom to trace where the story came from and how it spread.{' '}
            <span style={{ color: '#1D9E75' }}>Green</span> nodes are trusted outlets,{' '}
            <span style={{ color: '#BA7517' }}>orange</span> are uncertain,{' '}
            <span style={{ color: '#E24B4A' }}>red</span> are low-credibility sources.
          </p>
        </div>
      </div>

      {/* Graph area */}
      <div className="px-[16px] pt-[16px] pb-[12px]">
        {isEmpty ? (
          <div className="bg-[#090e1c] border border-dashed border-[rgba(66,71,84,0.4)] rounded-[6px] h-[320px] flex flex-col items-center justify-center gap-[12px]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(140,144,159,0.4)" strokeWidth="1.5">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <p className="text-[#8c909f] text-[13px] text-center">
              Not enough sources found to build a graph.
            </p>
          </div>
        ) : (
          <div
            className="rounded-[6px] border border-[rgba(66,71,84,0.2)] overflow-hidden relative"
            style={{ background: 'linear-gradient(160deg, #090e1c 0%, #0c1220 100%)' }}
          >
            <div ref={containerRef} style={{ height: '340px' }} />
            <div className="absolute bottom-[12px] right-[12px] flex flex-col gap-[4px]">
              <button
                onClick={() => handleZoom('in')}
                className="w-[28px] h-[28px] flex items-center justify-center rounded-[4px] font-mono text-[16px] text-[#adc6ff] bg-[rgba(14,19,34,0.85)] border border-[rgba(173,198,255,0.15)] hover:border-[rgba(173,198,255,0.4)] hover:text-white transition-colors"
              >
                +
              </button>
              <button
                onClick={() => handleZoom('out')}
                className="w-[28px] h-[28px] flex items-center justify-center rounded-[4px] font-mono text-[16px] text-[#adc6ff] bg-[rgba(14,19,34,0.85)] border border-[rgba(173,198,255,0.15)] hover:border-[rgba(173,198,255,0.4)] hover:text-white transition-colors"
              >
                −
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-[24px] pb-[16px] pt-[4px]">
        <div className="flex items-center gap-[6px] flex-wrap">
          {CREDIBILITY_LEVELS.map(({ color, label, bg, border }) => (
            <span
              key={label}
              className="flex items-center gap-[6px] text-[10px] tracking-[0.6px] uppercase px-[10px] py-[5px] rounded-[4px]"
              style={{ color, backgroundColor: bg, border: `1px solid ${border}` }}
            >
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
          <span className="text-[10px] text-[#8c909f] tracking-[0.4px] ml-[4px]">
            · Dot size proportional to credibility score
          </span>
        </div>
      </div>

      {/* Credibility verdict */}
      {!isEmpty && <CredibilityVerdict stats={stats} />}

      {/* Bottom padding */}
      <div style={{ height: 20 }} />
    </div>
  );
}
