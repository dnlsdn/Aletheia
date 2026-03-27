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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-950 text-white px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Truth Engine</h1>
            <p className="text-gray-400 text-lg mt-1">Advanced disinformation analysis</p>
          </div>
          <span className="text-xs text-gray-500 text-right hidden sm:block leading-snug">
            Codemotion Rome<br />AI Tech Week 2026
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Input section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <label
            htmlFor="news-input"
            className="block text-xl font-semibold text-gray-800 mb-4"
          >
            Paste a news article or claim to analyze
          </label>
          <textarea
            id="news-input"
            rows={6}
            maxLength={3000}
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
            placeholder="Paste the full text of the news article here..."
            className="w-full rounded-xl border border-gray-300 p-4 text-gray-800 text-base leading-relaxed
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              resize-none transition"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-gray-400">
              {newsText.length} / 3000 characters
            </span>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !newsText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                text-white font-semibold text-base px-8 py-3 rounded-xl transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </section>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Analyzing...</p>
          </div>
        )}

        {/* Results section */}
        {!isLoading && analysisResult && (
          <section className="space-y-6">
            {/* Verdict card */}
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

            {/* Mutation tracking placeholder */}
            {mutationResult && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Mutation Tracking</h2>
                <p className="text-gray-500 text-sm mb-6">
                  {mutationResult.versions.length} versions found across sources
                </p>
                <div className="space-y-3">
                  {mutationResult.versions.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <div
                        className="mt-1 w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: v.credibility.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm leading-snug truncate">
                          {v.title}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">{v.domain}</p>
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">{v.snippet}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-500">
                          Mutation
                        </span>
                        <p
                          className="text-lg font-bold"
                          style={{ color: v.mutationScore > 30 ? '#E24B4A' : '#1D9E75' }}
                        >
                          {v.mutationScore}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Virality risk */}
                <div className="mt-6 p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-orange-800 text-sm">Virality Risk</span>
                    <span className="text-2xl font-bold text-orange-700">
                      {mutationResult.viralityRisk.score}
                      <span className="text-sm font-normal">/100</span>
                    </span>
                  </div>
                  <p className="text-orange-700 text-sm">{mutationResult.viralityRisk.label}</p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
