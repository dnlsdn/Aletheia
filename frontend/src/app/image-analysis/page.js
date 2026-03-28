'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

const VERDICT_STYLES = {
  VERIFIED:       { label: 'Verified',       bg: '#0f2d1f', border: '#1d9e75', color: '#4ade80' },
  PARTIALLY_TRUE: { label: 'Partially True', bg: '#2d2200', border: '#d69e2e', color: '#fbbf24' },
  INCONCLUSIVE:   { label: 'Inconclusive',   bg: '#1a1f2e', border: '#4a5568', color: '#a0aec0' },
  MISLEADING:     { label: 'Misleading',     bg: '#2d1a00', border: '#dd6b20', color: '#fb923c' },
  FALSE:          { label: 'False',          bg: '#2d0f0f', border: '#e53e3e', color: '#fc8181' },
};

export default function ImageAnalysisPage() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  function onFileChange(e) {
    handleFile(e.target.files[0]);
  }

  function onDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const resp = await fetch('http://localhost:3003/api/analyze-image', {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || `HTTP ${resp.status}`);
      setResult(data);
    } catch (err) {
      setError(typeof err.message === 'object' ? JSON.stringify(err.message) : err.message);
    } finally {
      setLoading(false);
    }
  }

  const verdict = result ? (VERDICT_STYLES[result.content_verdict] || VERDICT_STYLES.INCONCLUSIVE) : null;
  const isAI = result?.is_ai_generated;

  return (
    <div className="min-h-screen bg-[#0e1322] flex">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[256px] bg-[#161b2b] border-r border-[rgba(66,71,84,0.1)] flex flex-col z-20">
        <div className="px-[32px] pt-[24px] pb-[16px]">
          <div className="font-mono font-bold text-[16px] text-[#adc6ff] tracking-[-0.8px]">ALETHE-IA</div>
          <div className="text-[9.6px] tracking-[1.92px] uppercase text-[#8c909f] opacity-50 mt-[2px]">V.2026.AI</div>
        </div>
        <nav className="flex-1 flex flex-col">
          <Link href="/" className="flex items-center pl-[32px] pr-[34px] py-[16px] hover:bg-[#1a1f2f] border-r-2 border-transparent hover:border-[#adc6ff] cursor-pointer transition-colors">
            <span className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#8c909f] hover:text-[#adc6ff]">TEXT ANALYSIS</span>
          </Link>
          <Link href="/image-analysis" className="flex items-center pl-[32px] pr-[34px] py-[16px] bg-[#1a1f2f] border-r-2 border-[#adc6ff] cursor-pointer">
            <span className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#adc6ff]">IMAGE ANALYSIS</span>
          </Link>
        </nav>
        <div className="px-[32px] py-[24px]">
          <div className="bg-[rgba(47,52,69,0.2)] rounded-[8px] px-[16px] py-[15px] flex flex-col gap-[8px]">
            <span className="text-[9.6px] tracking-[0.96px] uppercase text-[#8c909f]">System Status</span>
            <div className="flex items-center gap-[8px]">
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0 bg-[#1d9e75]" />
              <span className="font-mono text-[11px] text-[#1d9e75]">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="ml-[256px] flex flex-col flex-1 min-h-screen">

        <header className="bg-[#0e1322] px-[32px] py-[16px] flex items-center justify-between border-b border-[rgba(66,71,84,0.1)] sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-[24px] text-white tracking-[-0.6px] leading-[32px]">Image Analysis</h1>
            <p className="text-[12px] tracking-[1.2px] uppercase text-[#c2c6d6] leading-[16px]">
              AI Detection &amp; Content Fact-Check
            </p>
          </div>
          <span className="text-[11px] tracking-[0.55px] uppercase text-[#c2c6d6] hidden sm:block">
            Codemotion Rome / AI Tech Week 2026
          </span>
        </header>

        <main className="flex-1 px-[32px] py-[32px] max-w-[800px] w-full mx-auto">

          {/* Upload area */}
          <div className="mb-[24px]">
            <p className="text-[11px] tracking-[1.1px] uppercase text-[#8c909f] mb-[16px]">Upload an image to analyze</p>
            <div
              className="border-2 border-dashed border-[#2d3748] rounded-[12px] p-[32px] text-center cursor-pointer hover:border-[#6366f1] transition-colors relative"
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onFileChange}
              />
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-[360px] max-w-full mx-auto rounded-[8px] border border-[#2d3748]" />
              ) : (
                <div className="text-[#64748b]">
                  <div className="text-[32px] mb-[8px]">🖼</div>
                  <p className="text-[14px]"><span className="text-[#a5b4fc] font-semibold">Click to upload</span> or drag &amp; drop</p>
                  <p className="text-[12px] mt-[4px]">JPG, PNG, WEBP, GIF — max 20 MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Analyze button */}
          <div className="flex justify-end mb-[32px]">
            <button
              onClick={analyze}
              disabled={!file || loading}
              className="px-[28px] py-[12px] bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#2d3748] disabled:cursor-not-allowed text-white font-semibold text-[14px] rounded-[8px] transition-colors"
            >
              {loading ? 'Analyzing…' : 'Analyze Image →'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#2d0f0f] border border-[#e53e3e] rounded-[12px] px-[24px] py-[16px] text-[#fc8181] text-[14px] mb-[24px]">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="flex flex-col gap-[16px]">

              {/* Badges row */}
              <div className="grid grid-cols-2 gap-[16px]">
                {/* AI Detection */}
                <div
                  className="rounded-[12px] px-[20px] py-[16px] border flex flex-col gap-[4px]"
                  style={{
                    background: isAI ? '#2d0f0f' : '#0f2d1f',
                    borderColor: isAI ? '#e53e3e' : '#1d9e75',
                  }}
                >
                  <span className="text-[9.6px] tracking-[0.96px] uppercase" style={{ color: isAI ? '#fc8181' : '#4ade80', opacity: 0.7 }}>
                    AI Detection
                  </span>
                  <span className="font-bold text-[18px]" style={{ color: isAI ? '#fc8181' : '#4ade80' }}>
                    {isAI ? 'AI Generated' : 'Real Photo'}
                  </span>
                  <span className="text-[12px]" style={{ color: isAI ? '#fc8181' : '#4ade80', opacity: 0.75 }}>
                    Confidence: {result.ai_confidence ?? '—'}%
                  </span>
                </div>

                {/* Content verdict */}
                <div
                  className="rounded-[12px] px-[20px] py-[16px] border flex flex-col gap-[4px]"
                  style={{ background: verdict.bg, borderColor: verdict.border }}
                >
                  <span className="text-[9.6px] tracking-[0.96px] uppercase" style={{ color: verdict.color, opacity: 0.7 }}>
                    Content Verdict
                  </span>
                  <span className="font-bold text-[18px]" style={{ color: verdict.color }}>
                    {verdict.label}
                  </span>
                  <span className="text-[12px]" style={{ color: verdict.color, opacity: 0.75 }}>
                    Confidence: {result.content_confidence ?? '—'}%
                  </span>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-[#161b2b] border border-[rgba(66,71,84,0.3)] rounded-[12px] px-[24px] py-[20px]">
                <p className="text-[9.6px] tracking-[0.96px] uppercase text-[#8c909f] mb-[10px]">AI Detection Reasoning</p>
                <p className="text-[14px] text-[#cbd5e1] leading-[1.6]">{result.ai_reasoning}</p>
              </div>

              {/* Content Summary */}
              <div className="bg-[#161b2b] border border-[rgba(66,71,84,0.3)] rounded-[12px] px-[24px] py-[20px]">
                <p className="text-[9.6px] tracking-[0.96px] uppercase text-[#8c909f] mb-[10px]">Content Fact-Check Summary</p>
                <p className="text-[14px] text-[#cbd5e1] leading-[1.6]">{result.content_summary}</p>
              </div>

            </div>
          )}
        </main>

        <footer className="py-[16px] text-center text-[11px] text-[#8c909f] border-t border-[rgba(66,71,84,0.1)]">
          Truth Engine — Codemotion Rome AI Tech Week 2026 | Hackathon
        </footer>
      </div>
    </div>
  );
}
