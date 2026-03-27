const URGENCY_WORDS = [
  'breaking', 'esclusivo', 'urgente', 'attenzione', 'subito', 'ora', 'adesso',
  'immediato', 'shocking', 'incredibile', 'clamoroso', 'censura', 'censorato', 'virale'
];

const EMOTIONAL_WORDS = [
  'scandalo', 'vergogna', 'paura', 'pericolo', 'minaccia', 'catastrofe',
  'terrore', 'orrore', 'disastro', 'morte', 'tragedia', 'allarme', 'emergenza', 'crisi'
];

function computeViralityRisk(newsText, versionsWithScores) {
  const lowerText = newsText.toLowerCase();
  const words = newsText.trim().split(/\s+/).filter(w => w.length > 0);

  // 1. shortMessage
  let shortMessage = 0;
  if (words.length < 30) shortMessage = 20;
  else if (words.length <= 80) shortMessage = 10;

  // 2. urgencyWords
  const urgencyCount = URGENCY_WORDS.filter(w => lowerText.includes(w)).length;
  const urgencyWords = Math.min(urgencyCount * 4, 20);

  // 3. emotionalWords
  const emotionalCount = EMOTIONAL_WORDS.filter(w => lowerText.includes(w)).length;
  const emotionalWords = Math.min(emotionalCount * 4, 20);

  // 4. manyVersions
  let manyVersions = 0;
  const versionCount = versionsWithScores.length;
  if (versionCount >= 8) manyVersions = 20;
  else if (versionCount >= 4) manyVersions = 10;

  // 5. lowCredibilitySources
  let lowCredibilitySources = 0;
  const lowCount = versionsWithScores.filter(v => v.credibility && v.credibility.level === 'low').length;
  if (lowCount >= 3) lowCredibilitySources = 20;
  else if (lowCount >= 1) lowCredibilitySources = 10;

  const score = shortMessage + urgencyWords + emotionalWords + manyVersions + lowCredibilitySources;

  let label;
  if (score <= 30) label = 'Low risk — limited spread expected';
  else if (score <= 60) label = 'Medium risk — could spread significantly within hours';
  else if (score <= 80) label = 'High risk — rapid spread likely before a debunk can contain it';
  else label = 'Critical risk — designed to go viral, extremely hard to debunk in time';

  return {
    score,
    label,
    breakdown: { shortMessage, urgencyWords, emotionalWords, manyVersions, lowCredibilitySources }
  };
}

module.exports = { computeViralityRisk };
