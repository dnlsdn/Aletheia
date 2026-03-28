'use client';

import { useState, useRef } from 'react';

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
  FALSE:          { bg: '#ff4444', text: '#ffffff' },
};

function SoundWave({ color }) {
  return (
    <span className="flex items-center gap-[2px]" style={{ height: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 3,
            borderRadius: 2,
            backgroundColor: color,
            animation: `soundBar 0.8s ease-in-out ${(i - 1) * 0.12}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes soundBar {
          from { height: 3px; }
          to   { height: 16px; }
        }
      `}</style>
    </span>
  );
}

export default function VoiceVerdict({ verdict, summary, confidence }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);

  const colors = VERDICT_COLORS[verdict] ?? VERDICT_COLORS.INCONCLUSIVE;
  const verdictLabel = VERDICT_TRANSLATIONS[verdict] ?? verdict;

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsPlaying(false);
  };

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

      if (!res.ok) throw new Error('API error');

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audioRef.current = audio;

      setIsLoading(false);
      setIsPlaying(true);

      audio.play();
      audio.onended = () => {
        audioRef.current = null;
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        setIsPlaying(false);
      };
    } catch {
      setIsLoading(false);
      setError('Audio non disponibile');
    }
  };

  return (
    <div className="flex flex-col items-start gap-[6px]">
      <button
        onClick={isPlaying ? handleStop : handlePlay}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? 'rgba(0,0,0,0.15)' : colors.bg,
          color: isLoading ? '#8c909f' : colors.text,
          transition: 'background-color 0.2s, color 0.2s, opacity 0.2s',
        }}
        className="flex items-center gap-[8px] px-[18px] py-[8px] rounded-full text-[14px] font-bold uppercase tracking-[0.7px] disabled:cursor-not-allowed hover:opacity-90"
      >
        {isLoading ? (
          <>
            <span className="inline-block w-[14px] h-[14px] border-2 border-current border-t-transparent rounded-full animate-spin" />
            Generazione audio...
          </>
        ) : isPlaying ? (
          <>
            <SoundWave color={colors.text} />
            <span>Stop</span>
          </>
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
