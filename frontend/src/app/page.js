'use client';

import { useState, useEffect, useRef } from 'react';
import VerdictCard from '@/components/VerdictCard';
import VoiceVerdict from '@/components/VoiceVerdict';
import VulnerabilityScore from '@/components/VulnerabilityScore';
import MutationTimeline from '@/components/MutationTimeline';
import SourceGraph from '@/components/SourceGraph';
import ViralityRisk from '@/components/ViralityRisk';

const LOADING_MESSAGES = [
  'Searching for sources...',
  'Running adversarial debate between agents...',
  'Evaluating judge verdict...',
  'Building source credibility graph...',
  'Computing virality risk...',
];

const VERDICT_COLORS = {
  VERIFIED:       '#68dbae',
  PARTIALLY_TRUE: '#ba7517',
  INCONCLUSIVE:   '#8c909f',
  MISLEADING:     '#ffb4ab',
  FALSE:          '#ff4444',
};

const DEMO_CASES = [
  {
    label: 'Case 1: False with high mutation',
    text: 'BREAKING: Scienziati italiani hanno dimostrato che il 5G causa perdita di memoria a breve termine. Uno studio rivoluzionario dell\'Università di Palermo ha esaminato 12 persone e i risultati sono devastanti. Il governo vuole censurare questa notizia. Condividi subito prima che sparisca.',
  },
  {
    label: 'Case 2: True but manipulative',
    text: 'Il Parlamento italiano ha approvato ieri la legge di bilancio con 312 voti favorevoli e 201 contrari. La manovra prevede un aumento del 3% delle pensioni minime. I pensionati dovranno però pagare più tasse sui risparmi. La sinistra ha già annunciato ricorso alla Corte Costituzionale.',
  },
  {
    label: 'Case 3: Inconclusive',
    text: 'Secondo alcune fonti mediche, il nuovo vaccino anti-influenzale stagionale potrebbe causare effetti collaterali neurologici in soggetti geneticamente predisposti. I dati sono ancora in fase di analisi e la comunità scientifica è divisa. Le autorità sanitarie invitano alla calma.',
  },
];

export default function Home() {
  const [newsText, setNewsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [mutationResult, setMutationResult] = useState(null);
  const [error, setError] = useState(null);
  const [inputError, setInputError] = useState(false);
  const [mutationWarning, setMutationWarning] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const resultsRef = useRef(null);
  const [analysisTime, setAnalysisTime] = useState(null);
  const analysisStartRef = useRef(null);
  const loadingIntervalRef = useRef(null);
  const [systemStatus, setSystemStatus] = useState({ label: 'CHECKING...', color: '#8c909f' });
  const abortRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      setLoadingMsgIndex(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 2000);
    } else {
      clearInterval(loadingIntervalRef.current);
    }
    return () => clearInterval(loadingIntervalRef.current);
  }, [isLoading]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 3000);

    Promise.allSettled([
      fetch('http://localhost:3001/health', { signal: controller.signal }),
      fetch('http://localhost:3002/health', { signal: controller.signal }),
    ]).then(([r1, r2]) => {
      clearTimeout(timeout);
      const ok1 = r1.status === 'fulfilled' && r1.value.ok;
      const ok2 = r2.status === 'fulfilled' && r2.value.ok;
      if (ok1 && ok2)       setSystemStatus({ label: 'OPERATIONAL', color: '#68dbae' });
      else if (ok1 || ok2)  setSystemStatus({ label: 'DEGRADED',    color: '#ba7517' });
      else                  setSystemStatus({ label: 'OFFLINE',     color: '#ff6b6b' });
    });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  const handleExport = () => {
    if (!analysisResult) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      inputText: newsText,
      analysis: analysisResult,
      mutation: mutationResult,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truth-engine-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    if (newsText.trim().length < 20) {
      setInputError(true);
      return;
    }
    setInputError(false);
    setError(null);
    analysisStartRef.current = Date.now();
    setIsLoading(true);
    setAnalysisResult(null);
    setAnalysisTime(null);
    setMutationResult(null);

    try {
      setMutationWarning(false);

      const [analysisSettled, mutationSettled] = await Promise.allSettled([
        fetch('http://localhost:3001/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newsText }),
        }),
        fetch('http://localhost:3002/mutation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newsText }),
        }),
      ]);

      if (analysisSettled.status === 'rejected' || !analysisSettled.value.ok) {
        throw new Error('Analysis service unavailable. Please check backend-1 (port 3001).');
      }

      const analysis = await analysisSettled.value.json();
      setAnalysisResult(analysis);

      if (mutationSettled.status === 'fulfilled' && mutationSettled.value.ok) {
        const mutation = await mutationSettled.value.json();
        setMutationResult(mutation);
      } else {
        setMutationResult(null);
        setMutationWarning(true);
      }

      setAnalysisTime(((Date.now() - analysisStartRef.current) / 1000).toFixed(1));
      setIsLoading(false);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Analysis failed:', err);
      setIsLoading(false);
      setError('Analysis failed. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1322] flex">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[256px] bg-[#161b2b] border-r border-[rgba(66,71,84,0.1)] flex flex-col z-20">
        {/* Logo */}
        <div className="px-[32px] pt-[24px] pb-[16px]">
          <div className="font-mono font-bold text-[16px] text-[#adc6ff] tracking-[-0.8px]">ALETHEIA</div>
          <div className="text-[9.6px] tracking-[1.92px] uppercase text-[#8c909f] opacity-50 mt-[2px]">V.2026.AI</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col">
          <a className="flex items-center pl-[32px] pr-[34px] py-[16px] bg-[#1a1f2f] border-r-2 border-[#adc6ff] cursor-pointer">
            <span className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#adc6ff]">ANALYZE</span>
          </a>
        </nav>

        {/* System Status */}
        <div className="px-[32px] py-[24px]">
          <div className="bg-[rgba(47,52,69,0.2)] rounded-[8px] px-[16px] py-[15px] flex flex-col gap-[8px]">
            <span className="text-[9.6px] tracking-[0.96px] uppercase text-[#8c909f]">System Status</span>
            <div className="flex items-center gap-[8px]">
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: systemStatus.color }} />
              <span className="font-mono text-[11px]" style={{ color: systemStatus.color }}>{systemStatus.label}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="ml-[256px] flex flex-col flex-1 min-h-screen">

        {/* Top header */}
        <header className="bg-[#0e1322] px-[32px] py-[16px] flex items-center justify-between border-b border-[rgba(66,71,84,0.1)] sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-[24px] text-white tracking-[-0.6px] leading-[32px]">Aletheia</h1>
            <p className="text-[12px] tracking-[1.2px] uppercase text-[#c2c6d6] leading-[16px]">
              Truth Engine: Advanced disinformation analysis system
            </p>
          </div>
          <span className="text-[11px] tracking-[0.55px] uppercase text-[#c2c6d6] hidden sm:block">
            Codemotion Rome / AI Tech Week 2026
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 px-[40px] py-[48px]">
          <div className="max-w-[800px] mx-auto flex flex-col gap-[24px]">

            {/* Demo cases */}
            <div className="flex flex-col gap-[10px]">
              <span className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#8c909f]">Demo cases</span>
              <div className="flex flex-wrap gap-[8px]">
                {DEMO_CASES.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => setNewsText(c.text)}
                    className="text-[15px] px-[14px] py-[8px] rounded-[6px] bg-[#1a1f2f] border border-[rgba(173,198,255,0.15)] text-[#adc6ff] hover:bg-[#25293a] hover:border-[rgba(173,198,255,0.35)] transition-colors text-left"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input section */}
            <div className="bg-[#161b2b] rounded-[8px] p-[24px] flex flex-col gap-[16px]">
              <label htmlFor="news-input" className="font-semibold text-[18px] text-white leading-[28px]">
                Paste a news article or claim to analyze
              </label>
              <div className="bg-[#090e1c] rounded-[8px] px-[16px] pt-[16px] pb-[8px]">
                <textarea
                  id="news-input"
                  value={newsText}
                  onChange={(e) => setNewsText(e.target.value)}
                  maxLength={3000}
                  rows={6}
                  placeholder="Paste the full text of the news article here..."
                  className="w-full bg-transparent text-[16px] text-white placeholder:text-[rgba(140,144,159,0.4)] focus:outline-none resize-none leading-[24px]"
                />
              </div>
              {inputError && (
                <p className="text-[#ff6b6b] text-[13px]">Please enter a longer text to analyze.</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.55px] uppercase text-[#8c909f]">
                  {newsText.length} / 3000 characters
                </span>
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="bg-[#adc6ff] hover:bg-[#c2d8ff] disabled:opacity-40 disabled:cursor-not-allowed text-[#002e6a] font-bold text-[16px] px-[24px] py-[8px] rounded-[6px] transition-colors"
                >
                  Analyze →
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-[rgba(255,107,107,0.1)] border border-[#ff6b6b] rounded-[8px] px-[16px] py-[12px] text-[#ff6b6b] text-[14px]">
                {error}
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-16">
                <div className="inline-block w-8 h-8 border-4 border-[#adc6ff] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[11px] tracking-[1.1px] uppercase text-[#adc6ff] transition-all duration-500">
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </p>
              </div>
            )}

            {/* Results */}
            {!isLoading && analysisResult && (
              <div ref={resultsRef} className="flex flex-col gap-[24px]">
                <div className="flex items-center gap-[8px] flex-wrap">
                  {mutationResult?.versions?.length > 0 && (
                    <span className="font-mono text-[11px] tracking-[1.1px] uppercase px-[10px] py-[5px] rounded-[4px] bg-[rgba(173,198,255,0.08)] border border-[rgba(173,198,255,0.15)] text-[#adc6ff]">
                      {mutationResult.versions.length} sources analyzed
                    </span>
                  )}
                  {analysisTime && (
                    <span className="font-mono text-[11px] tracking-[1.1px] uppercase px-[10px] py-[5px] rounded-[4px] bg-[rgba(173,198,255,0.08)] border border-[rgba(173,198,255,0.15)] text-[#adc6ff]">
                      completed in {analysisTime}s
                    </span>
                  )}
                  <span className="font-mono text-[11px] tracking-[1.1px] uppercase px-[10px] py-[5px] rounded-[4px] bg-[rgba(104,219,174,0.08)] border border-[rgba(104,219,174,0.15)] text-[#68dbae]">
                    Regolo.ai · EU hosted
                  </span>
                </div>
                {/* Verdict Card */}
                <VerdictCard
                  verdict={analysisResult.verdict}
                  confidence={analysisResult.confidence}
                  summary={analysisResult.summary}
                  prosecutorPoints={analysisResult.prosecutor_points}
                  defenderPoints={analysisResult.defender_points}
                  prosecutorSources={analysisResult.prosecutor_sources}
                  defenderSources={analysisResult.defender_sources}
                  prosecutorArgument={analysisResult.prosecutor_argument}
                  defenderArgument={analysisResult.defender_argument}
                />
                <VoiceVerdict
                  verdict={analysisResult.verdict}
                  summary={analysisResult.summary}
                  confidence={analysisResult.confidence}
                />

                {mutationWarning && (
                  <div className="bg-[rgba(186,117,23,0.1)] border border-[rgba(186,117,23,0.3)] rounded-[6px] px-[14px] py-[10px] text-[13px] text-[#ba7517]">
                    Mutation tracking unavailable — backend-2 did not respond. Showing fact-check analysis only.
                  </div>
                )}

                {/* Vulnerability Score */}
                <VulnerabilityScore
                  newsText={newsText}
                  verdictColor={VERDICT_COLORS[analysisResult.verdict] ?? VERDICT_COLORS.INCONCLUSIVE}
                />

                {/* Mutation Timeline */}
                {mutationResult && (
                  <MutationTimeline
                    versions={mutationResult.versions}
                    verdictColor={VERDICT_COLORS[analysisResult.verdict] ?? VERDICT_COLORS.INCONCLUSIVE}
                  />
                )}

                {/* Source Graph */}
                {mutationResult && (
                  <SourceGraph
                    graph={mutationResult.graph}
                    verdictColor={VERDICT_COLORS[analysisResult.verdict] ?? VERDICT_COLORS.INCONCLUSIVE}
                  />
                )}

                {/* Virality Risk */}
                {mutationResult && (
                  <ViralityRisk
                    viralityRisk={mutationResult.viralityRisk}
                    verdictColor={VERDICT_COLORS[analysisResult.verdict] ?? VERDICT_COLORS.INCONCLUSIVE}
                  />
                )}

                {/* Export button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleExport}
                    className="text-[15px] px-[20px] py-[10px] rounded-[6px] bg-[#1a1f2f] border border-[rgba(173,198,255,0.2)] text-[#adc6ff] hover:bg-[#25293a] hover:border-[rgba(173,198,255,0.4)] transition-colors font-medium"
                  >
                    Export full report (JSON)
                  </button>
                </div>

              </div>
            )}

          </div>
        </main>

        {/* Footer */}
        <footer className="px-[40px] py-[16px] border-t border-[rgba(66,71,84,0.15)] text-center">
          <span className="text-[13px] tracking-[0.65px] text-[#8c909f]">
            Truth Engine — Codemotion Rome AI Tech Week 2026 | Hackathon
          </span>
        </footer>
      </div>
    </div>
  );
}
