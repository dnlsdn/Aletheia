const HIGH_CREDIBILITY_PATTERNS = [
  { pattern: 'ansa.it', score: 92 },
  { pattern: 'corriere.it', score: 90 },
  { pattern: 'repubblica.it', score: 90 },
  { pattern: 'lastampa.it', score: 88 },
  { pattern: 'sole24ore', score: 88 },
  { pattern: 'ilsole24ore', score: 88 },
  { pattern: 'stampa.it', score: 88 },
  { pattern: 'ilmessaggero.it', score: 85 },
  { pattern: 'ilgiornale.it', score: 85 },
  { pattern: 'tgcom24', score: 85 },
  { pattern: 'mediaset', score: 84 },
  { pattern: 'rai.it', score: 90 },
  { pattern: 'raiplay', score: 88 },
  { pattern: 'bbc.com', score: 93 },
  { pattern: 'reuters.com', score: 95 },
  { pattern: 'apnews.com', score: 94 },
  { pattern: 'afp.com', score: 93 },
  { pattern: 'dw.com', score: 91 },
  { pattern: 'lemonde.fr', score: 91 },
  { pattern: 'theguardian.com', score: 92 },
  { pattern: 'nytimes.com', score: 92 },
  { pattern: 'washingtonpost.com', score: 91 },
  { pattern: 'economist.com', score: 92 },
  { pattern: 'nature.com', score: 95 },
  { pattern: 'science.org', score: 95 },
  { pattern: 'governo.it', score: 93 },
  { pattern: 'quirinale.it', score: 94 },
  { pattern: 'senato.it', score: 93 },
  { pattern: 'camera.it', score: 93 },
  { pattern: 'istat.it', score: 92 },
  { pattern: 'eur-lex.europa.eu', score: 94 },
  { pattern: 'who.int', score: 93 },
  { pattern: 'un.org', score: 92 },
  { pattern: '.edu', score: 88 },
  { pattern: '.gov', score: 95 },
];

function assessCredibility(domain) {
  const d = (domain || '').toLowerCase();

  for (const { pattern, score } of HIGH_CREDIBILITY_PATTERNS) {
    if (d.includes(pattern)) {
      return { score, level: 'high', color: '#1D9E75' };
    }
  }

  const hasNumbers = /\d/.test(d);
  const len = d.replace(/^www\./, '').length;

  if (!hasNumbers && len >= 5 && len <= 25) {
    // More positive signals → higher score within medium range
    let score = 50;
    if (len >= 8 && len <= 18) score += 5;  // reasonable length
    if (d.endsWith('.it') || d.endsWith('.com') || d.endsWith('.net') || d.endsWith('.org')) score += 5;
    if (!d.includes('-')) score += 3;        // no hyphens
    if (d.split('.').length === 2) score += 2; // single subdomain level
    score = Math.min(score, 74);
    return { score, level: 'medium', color: '#BA7517' };
  }

  // Low credibility: numbers in domain, very short, or unknown pattern
  let score = 20;
  if (!hasNumbers) score += 10;
  if (len >= 5) score += 5;
  score = Math.min(score, 40);
  return { score, level: 'low', color: '#E24B4A' };
}

module.exports = { assessCredibility };
