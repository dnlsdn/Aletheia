'use client';

import { useState } from 'react';

const VERDICT_TRANSLATIONS = {
  VERIFIED:       'Verificato',
  PARTIALLY_TRUE: 'Parzialmente vero',
  INCONCLUSIVE:   'Inconcludente',
  MISLEADING:     'Fuorviante',
  FALSE:          'Falso',
};

const VERDICT_COLORS = {
  VERIFIED:       { bg: '#68dbae', text: '#003822' },
  PARTIALLY_TRUE: { bg: '#ffd8a8', text: '#5c3800' },
  INCONCLUSIVE:   { bg: '#c2c6d6', text: '#2f3445' },
  MISLEADING:     { bg: '#ffb4ab', text: '#690005' },
  FALSE:          { bg: '#ffb4ab', text: '#690005' },
};

export default function VoiceVerdict({ verdict, summary, confidence }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const colors = VERDICT_COLORS[verdict] ?? VERDICT_COLORS.INCONCLUSIVE;
  const verdictLabel = VERDICT_TRANSLATIONS[verdict] ?? verdict;

  const handlePlay = async () => {
    setIsLoading(true);
    setError(null);

    const verdictText = `Verdetto: ${verdictLabel}. Confidenza: ${confidence} percento. ${summary}`;

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: verdictText }),
      });

      if (!res.ok) {
        throw new Error('API error');
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);

      setIsLoading(false);
      setIsPlaying(true);

      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(objectUrl);
      };
    } catch {
      setIsLoading(false);
      setError('Audio non disponibile');
    }
  };

  return (
    <div className="flex flex-col items-start gap-[6px]">
      <button
        onClick={handlePlay}
        disabled={isLoading || isPlaying}
        style={{
          backgroundColor: isLoading || isPlaying ? 'rgba(0,0,0,0.15)' : colors.bg,
          color: isLoading || isPlaying ? '#8c909f' : colors.text,
        }}
        className="flex items-center gap-[8px] px-[18px] py-[8px] rounded-full text-[14px] font-bold uppercase tracking-[0.7px] transition-all disabled:cursor-not-allowed hover:opacity-90"
      >
        {isLoading ? (
          <>
            <span className="inline-block w-[14px] h-[14px] border-2 border-current border-t-transparent rounded-full animate-spin" />
            Generazione audio...
          </>
        ) : isPlaying ? (
          <>▶ In riproduzione...</>
        ) : (
          <>🔊 Ascolta il verdetto</>
        )}
      </button>
      {error && (
        <span className="text-[#ff6b6b] text-[12px]">{error}</span>
      )}
    </div>
  );
}
