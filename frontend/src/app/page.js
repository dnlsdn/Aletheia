'use client';

import { useState } from 'react';
import { mockAnalysis, mockMutation } from '@/lib/mockData';
import VerdictCard from '@/components/VerdictCard';

export default function Home() {
  const [newsText, setNewsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [mutationResult, setMutationResult] = useState(null);

  const handleAnalyze = async () => {
    if (!newsText.trim()) return;
    setIsLoading(true);
    setAnalysisResult(null);
    setMutationResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setAnalysisResult(mockAnalysis);
    setMutationResult(mockMutation);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0e1322] flex">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[256px] bg-[#161b2b] border-r border-[rgba(66,71,84,0.1)] flex flex-col z-20">
        {/* Logo */}
        <div className="px-[32px] pt-[24px] pb-[16px]">
          <div className="font-mono font-bold text-[16px] text-[#adc6ff] tracking-[-0.8px]">TRUTH_ENGINE</div>
          <div className="text-[9.6px] tracking-[1.92px] uppercase text-[#8c909f] opacity-50 mt-[2px]">V.2026.AI</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col">
          <a className="flex items-center pl-[32px] pr-[34px] py-[16px] bg-[#1a1f2f] border-r-2 border-[#adc6ff] cursor-pointer">
            <span className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#adc6ff]">ANALYZE</span>
          </a>
          <a className="flex items-center px-[32px] py-[16px] opacity-70 cursor-pointer">
            <span className="text-[11px] tracking-[1.1px] uppercase text-[#c2c6d6]">SOURCES</span>
          </a>
          <a className="flex items-center px-[32px] py-[16px] opacity-70 cursor-pointer">
            <span className="text-[11px] tracking-[1.1px] uppercase text-[#c2c6d6]">ARCHIVE</span>
          </a>
          <a className="flex items-center px-[32px] py-[16px] opacity-70 cursor-pointer">
            <span className="text-[11px] tracking-[1.1px] uppercase text-[#c2c6d6]">SETTINGS</span>
          </a>
        </nav>

        {/* System Status */}
        <div className="px-[32px] py-[24px]">
          <div className="bg-[rgba(47,52,69,0.2)] rounded-[8px] px-[16px] py-[15px] flex flex-col gap-[8px]">
            <span className="text-[9.6px] tracking-[0.96px] uppercase text-[#8c909f]">System Status</span>
            <div className="flex items-center gap-[8px]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#68dbae] flex-shrink-0" />
              <span className="font-mono text-[11px] text-[#68dbae]">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="ml-[256px] flex flex-col flex-1 min-h-screen">

        {/* Top header */}
        <header className="bg-[#0e1322] px-[32px] py-[16px] flex items-center justify-between border-b border-[rgba(66,71,84,0.1)] sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-[24px] text-white tracking-[-0.6px] leading-[32px]">Truth Engine</h1>
            <p className="text-[12px] tracking-[1.2px] uppercase text-[#c2c6d6] leading-[16px]">
              Advanced disinformation analysis
            </p>
          </div>
          <span className="text-[11px] tracking-[0.55px] uppercase text-[#c2c6d6] hidden sm:block">
            Codemotion Rome / AI Tech Week 2026
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 px-[40px] py-[48px]">
          <div className="max-w-[800px] mx-auto flex flex-col gap-[24px]">

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
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.55px] uppercase text-[#8c909f]">
                  {newsText.length} / 3000 characters
                </span>
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !newsText.trim()}
                  className="bg-[#adc6ff] hover:bg-[#c2d8ff] disabled:opacity-40 disabled:cursor-not-allowed text-[#002e6a] font-bold text-[16px] px-[24px] py-[8px] rounded-[6px] transition-colors"
                >
                  Analyze →
                </button>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-16">
                <div className="inline-block w-8 h-8 border-4 border-[#adc6ff] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[11px] tracking-[1.1px] uppercase text-[#8c909f]">Analyzing...</p>
              </div>
            )}

            {/* Results */}
            {!isLoading && analysisResult && (
              <>
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

                {/* Mutation Tracking */}
                {mutationResult && (
                  <div className="bg-[#161b2b] rounded-[8px] p-[24px] flex flex-col gap-[24px]">
                    <div>
                      <h2 className="font-bold text-[20px] text-white tracking-[-0.5px] leading-[28px]">
                        Mutation Tracking
                      </h2>
                      <p className="text-[12px] tracking-[1.2px] uppercase text-[#8c909f] leading-[16px] mt-[2px]">
                        {mutationResult.versions.length} versions found across sources
                      </p>
                    </div>

                    {/* Version rows */}
                    <div className="bg-[#0e1322] flex flex-col gap-[2px] pb-[8px]">
                      {mutationResult.versions.map((v, i) => {
                        const isHigh = v.mutationScore > 30;
                        return (
                          <div key={i} className="bg-[#1a1f2f] flex items-center justify-between p-[16px]">
                            <div className="flex items-center gap-[16px]">
                              <span
                                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                                style={{ backgroundColor: v.credibility.color }}
                              />
                              <div>
                                <p className="font-medium text-[14px] text-[#dee1f7] leading-[20px]">{v.title}</p>
                                <p className="text-[11px] tracking-[0.55px] uppercase text-[#8c909f] leading-[16.5px]">
                                  {v.domain}
                                </p>
                              </div>
                            </div>
                            <span
                              className="font-mono text-[11px] px-[8px] py-[2px] rounded-[4px] flex-shrink-0"
                              style={{
                                color: isHigh ? '#ffb4ab' : '#68dbae',
                                backgroundColor: isHigh ? 'rgba(255,180,171,0.1)' : 'rgba(104,219,174,0.1)',
                              }}
                            >
                              {`VER_${v.mutationScore}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Virality Risk */}
                    <div className="border-t border-[rgba(66,71,84,0.1)] pt-[25px] flex items-center justify-between">
                      <div className="flex items-center gap-[16px]">
                        <span className="font-bold text-[24px] text-[#ba7517] leading-[32px]">
                          {mutationResult.viralityRisk.score} / 100
                        </span>
                        <div className="w-px h-[32px] bg-[rgba(66,71,84,0.3)]" />
                        <div>
                          <p className="text-[11px] font-bold tracking-[1.1px] uppercase text-[#ba7517] leading-[16.5px]">
                            Virality Risk
                          </p>
                          <p className="text-[12px] text-[#c2c6d6] leading-[16px]">
                            {mutationResult.viralityRisk.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-[8px]">
                        <span className="w-[8px] h-[8px] rounded-full bg-[#ba7517]" />
                        <span className="w-[8px] h-[8px] rounded-full bg-[rgba(186,117,23,0.4)]" />
                        <span className="w-[8px] h-[8px] rounded-full bg-[rgba(186,117,23,0.2)]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Source Graph placeholder */}
                <div className="bg-[#161b2b] rounded-[8px] p-[24px] flex flex-col gap-[24px]">
                  <h2 className="font-bold text-[20px] text-white tracking-[-0.5px] leading-[28px]">
                    Source propagation graph
                  </h2>
                  <div className="bg-[#090e1c] border border-dashed border-[rgba(66,71,84,0.4)] rounded-[8px] h-[300px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-[16px]">
                      <p className="text-[#8c909f] text-[14px] text-center">Interactive graph — vis-network</p>
                      <div className="flex items-center gap-[16px]">
                        <div className="flex items-center gap-[8px]">
                          <span className="w-[8px] h-[8px] rounded-full bg-[#adc6ff]" />
                          <span className="text-[9.6px] tracking-[-0.48px] uppercase text-[#8c909f]">Nodes</span>
                        </div>
                        <div className="flex items-center gap-[8px]">
                          <span className="w-[8px] h-[8px] rounded-full bg-[#424754]" />
                          <span className="text-[9.6px] tracking-[-0.48px] uppercase text-[#8c909f]">Vectors</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
