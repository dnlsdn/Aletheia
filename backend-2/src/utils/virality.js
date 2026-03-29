const axios = require('axios');

const REGOLO_BASE_URL = 'https://api.regolo.ai/v1';
const REGOLO_MODEL = 'Llama-3.3-70B-Instruct';

// Fallback keyword lists — used only when LLM call fails
const URGENCY_WORDS_FALLBACK = [
  'breaking', 'esclusivo', 'urgente', 'attenzione', 'subito', 'ora', 'adesso',
  'immediato', 'shocking', 'incredibile', 'clamoroso', 'censura', 'censorato', 'virale',
  'allerta', 'allarme', 'evacuare', 'evacuazione', 'non bere', 'non mangiare',
  'alert', 'emergenza immediata', 'massima allerta', 'stato di emergenza'
];

const EMOTIONAL_WORDS_FALLBACK = [
  'scandalo', 'vergogna', 'paura', 'pericolo', 'minaccia', 'catastrofe',
  'terrore', 'orrore', 'disastro', 'morte', 'tragedia', 'allarme', 'emergenza', 'crisi',
  'tossico', 'tossica', 'avvelenato', 'avvelenamento', 'contaminato', 'contaminazione',
  'colpiti', 'vittime', 'intossicazione', 'intossicato', 'ospedale', 'ricovero',
  'governo tace', 'autorita nascondono', 'insabbiamento'
];

async function llmScoreText(newsText) {
  const prompt = `You are a disinformation virality analyst. Analyze the following news text and score it on two dimensions, each from 0 to 20:

1. urgencyWords (0-20): presence of urgency language that triggers impulsive sharing — e.g. "BREAKING", alarm words, "DO NOT", emergency declarations, calls to immediate action, warnings. Score higher the more intense and numerous these signals are.

2. emotionalWords (0-20): presence of emotionally loaded language that bypasses critical thinking — e.g. fear, outrage, threats, toxic substances, mass casualties, government cover-ups, health scares. Score higher the more manipulative and emotionally charged the language is.

NEWS TEXT:
"""
${newsText}
"""

Respond ONLY with a valid JSON object, no explanation, no markdown:
{"urgencyWords": <integer 0-20>, "emotionalWords": <integer 0-20>}`;

  const response = await axios.post(
    `${REGOLO_BASE_URL}/chat/completions`,
    {
      model: REGOLO_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 64,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.REGOLO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    }
  );

  const raw = response.data.choices[0].message.content.trim();
  // Strip markdown code blocks if present
  const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(jsonStr);

  return {
    urgencyWords: Math.min(20, Math.max(0, Math.round(parsed.urgencyWords))),
    emotionalWords: Math.min(20, Math.max(0, Math.round(parsed.emotionalWords))),
  };
}

function keywordFallback(newsText) {
  const lowerText = newsText.toLowerCase();
  const urgencyCount = URGENCY_WORDS_FALLBACK.filter(w => lowerText.includes(w)).length;
  const emotionalCount = EMOTIONAL_WORDS_FALLBACK.filter(w => lowerText.includes(w)).length;
  return {
    urgencyWords: Math.min(urgencyCount * 4, 20),
    emotionalWords: Math.min(emotionalCount * 4, 20),
  };
}

function scoreLabel(score) {
  if (score <= 30) return 'Low risk — limited spread expected';
  if (score <= 60) return 'Medium risk — could spread significantly within hours';
  if (score <= 80) return 'High risk — rapid spread likely before a debunk can contain it';
  return 'Critical risk — designed to go viral, extremely hard to debunk in time';
}

async function computeViralityRisk(newsText, versionsWithScores) {
  const words = newsText.trim().split(/\s+/).filter(w => w.length > 0);

  // Structural scores — computed locally, no LLM needed
  let shortMessage = 0;
  if (words.length < 30) shortMessage = 20;
  else if (words.length <= 80) shortMessage = 10;

  const versionCount = versionsWithScores.length;
  let manyVersions = 0;
  if (versionCount >= 8) manyVersions = 20;
  else if (versionCount >= 4) manyVersions = 10;

  const lowCount = versionsWithScores.filter(v => v.credibility?.level === 'low').length;
  let lowCredibilitySources = 0;
  if (lowCount >= 3) lowCredibilitySources = 20;
  else if (lowCount >= 1) lowCredibilitySources = 10;

  // Semantic scores — LLM with keyword fallback
  let urgencyWords, emotionalWords;
  try {
    ({ urgencyWords, emotionalWords } = await llmScoreText(newsText));
    console.log(`[virality] LLM scores — urgency: ${urgencyWords}, emotional: ${emotionalWords}`);
  } catch (err) {
    console.warn(`[virality] LLM failed (${err.message}), using keyword fallback`);
    ({ urgencyWords, emotionalWords } = keywordFallback(newsText));
  }

  const score = shortMessage + urgencyWords + emotionalWords + manyVersions + lowCredibilitySources;

  return {
    score,
    label: scoreLabel(score),
    breakdown: { shortMessage, urgencyWords, emotionalWords, manyVersions, lowCredibilitySources },
  };
}

module.exports = { computeViralityRisk };
