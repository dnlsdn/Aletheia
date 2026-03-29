const axios = require('axios');

const REGOLO_URL = 'https://api.regolo.ai/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'Llama-3.3-70B-Instruct';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function formatUserMessage(newsText, searchResults) {
  const sources = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
    .join('\n\n');
  return `ARTICOLO:\n${newsText}\n\nFONTI DI RICERCA:\n${sources}`;
}

async function callRegolo(systemPrompt, userMessage) {
  const body = (model, tokens) => ({
    model,
    max_tokens: tokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });
  try {
    const response = await axios.post(REGOLO_URL, body(MODEL, 800), {
      headers: { Authorization: 'Bearer ' + process.env.REGOLO_API_KEY, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return response.data.choices[0].message.content;
  } catch (_) {
    const response = await axios.post(GROQ_URL, body(GROQ_MODEL, 800), {
      headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY, 'Content-Type': 'application/json' },
    });
    return response.data.choices[0].message.content;
  }
}

async function runProsecutor(newsText, searchResults) {
  const systemPrompt =
    'You are a skeptical investigative fact-checker. Your single goal is to build the strongest ' +
    'possible case that the following news article is false, misleading, or untrustworthy. ' +
    'Use only the provided search results as your evidence base — do not invent facts. ' +
    'Cite each source you use by its URL. Be specific: point to exact claims in the article ' +
    'that are contradicted by the sources. Respond entirely in Italian.';
  try {
    return await callRegolo(systemPrompt, formatUserMessage(newsText, searchResults));
  } catch (err) {
    return `Agent error: ${err.message}`;
  }
}

async function runDefender(newsText, searchResults) {
  const systemPrompt =
    'You are a journalist whose job is to verify that news articles are accurate. ' +
    'Your single goal is to build the strongest possible case that the following news article ' +
    'is true, well-sourced, and trustworthy. Use only the provided search results as your ' +
    'evidence base — do not invent facts. Cite each source you use by its URL. ' +
    'Be specific: point to exact claims in the article that are confirmed by the sources. ' +
    'Respond entirely in Italian.';
  try {
    return await callRegolo(systemPrompt, formatUserMessage(newsText, searchResults));
  } catch (err) {
    return `Agent error: ${err.message}`;
  }
}

const JUDGE_SYSTEM_PROMPT =
  'You are an impartial judge in a fact-checking debate. You have read a news article\n' +
  'and two opposing arguments: one claiming the article is false or misleading, one claiming\n' +
  'it is accurate and trustworthy. Your job is to weigh the evidence and deliver a final verdict.\n\n' +
  'You MUST respond with ONLY a valid JSON object. No text before it, no text after it,\n' +
  'no markdown formatting, no code blocks. Just the raw JSON.\n\n' +
  'Use this exact structure:\n' +
  '{\n' +
  '  "verdict": "VERIFIED",\n' +
  '  "confidence": 85,\n' +
  '  "summary": "2-3 sentence explanation of the verdict in Italian.",\n' +
  '  "prosecutor_points": ["strongest point from the prosecution", "second strongest point"],\n' +
  '  "defender_points": ["strongest point from the defense", "second strongest point"]\n' +
  '}\n\n' +
  'Verdict values — read carefully, these are MUTUALLY EXCLUSIVE:\n' +
  '- VERIFIED: the core claims are confirmed by reliable sources, confidence >= 80\n' +
  '- PARTIALLY_TRUE: specific claims are verified true AND other specific claims are verified false or missing crucial context — both sides have concrete evidence\n' +
  '- INCONCLUSIVE: the article makes claims that are speculative, unverified, or explicitly "still under analysis" — use this when the article itself admits uncertainty or when no sources confirm OR deny the claim\n' +
  '- MISLEADING: the facts stated are real but are selectively framed, exaggerated, or decontextualised to create a false impression — use this when a real quote or real statistic is used deceptively\n' +
  '- FALSE: the core factual claim is directly contradicted by reliable sources, confidence >= 75\n\n' +
  'CRITICAL DISTINCTIONS:\n' +
  '- If an article reports speculation or unverified data ("according to some sources", "data still being analyzed", "might cause") → INCONCLUSIVE, not PARTIALLY_TRUE\n' +
  '- If an article quotes a real statement but the statement is numerically wrong vs official data → MISLEADING, not FALSE (the article may be accurately reporting a misleading claim)\n' +
  '- Do not use FALSE when the article is accurate but deceptive — use MISLEADING\n' +
  '- Do not use PARTIALLY_TRUE for speculative articles — use INCONCLUSIVE\n\n' +
  'The confidence score must reflect actual certainty: use the full range, not just 55-70.\n' +
  'Only use INCONCLUSIVE when you genuinely cannot decide after weighing all evidence.';

const JUDGE_FALLBACK = {
  verdict: 'INCONCLUSIVE',
  confidence: 0,
  summary: 'The judge could not produce a valid verdict. Please try again.',
  prosecutor_points: [],
  defender_points: [],
};

async function runJudge(newsText, prosecutorArgument, defenderArgument) {
  const userMessage =
    `ARTICOLO:\n${newsText}\n\n` +
    `ARGOMENTO DELL'ACCUSA:\n${prosecutorArgument}\n\n` +
    `ARGOMENTO DELLA DIFESA:\n${defenderArgument}`;

  let raw;
  try {
    let response;
    try {
      response = await axios.post(REGOLO_URL, {
        model: MODEL, max_tokens: 700,
        messages: [{ role: 'system', content: JUDGE_SYSTEM_PROMPT }, { role: 'user', content: userMessage }],
      }, { headers: { Authorization: 'Bearer ' + process.env.REGOLO_API_KEY, 'Content-Type': 'application/json' }, timeout: 15000 });
    } catch (_) {
      response = await axios.post(GROQ_URL, {
        model: GROQ_MODEL, max_tokens: 700,
        messages: [{ role: 'system', content: JUDGE_SYSTEM_PROMPT }, { role: 'user', content: userMessage }],
      }, { headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY, 'Content-Type': 'application/json' } });
    }
    raw = response.data.choices[0].message.content;
  } catch (err) {
    console.error('Judge API error:', err.message);
    return JUDGE_FALLBACK;
  }

  try {
    return JSON.parse(raw);
  } catch (_) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {}
    }
    console.error('Judge JSON parse failed. Raw response:', raw);
    return JUDGE_FALLBACK;
  }
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

// Maps verdict + confidence to a signed position on the -100…+100 scale.
// Positive = leaning TRUE/VERIFIED, negative = leaning FALSE.
const VERDICT_DIRECTION = { VERIFIED: 1, PARTIALLY_TRUE: 0.5, INCONCLUSIVE: 0, MISLEADING: -0.5, FALSE: -1 };
function verdictFinalPosition(verdict, confidence) {
  const dir = VERDICT_DIRECTION[verdict] ?? 0;
  return Math.round(dir * confidence);
}

function generateFallbackTimeline(interleaved, finalPosition) {
  const points = [{ step: 0, agent: 'start', source: 'Analysis begins', domain: '', confidence: 0 }];
  const n = interleaved.length;
  for (let i = 0; i < n; i++) {
    const s = interleaved[i];
    const progress = (i + 1) / n;
    const trend = finalPosition * progress;           // 0 → finalPosition
    const swing = s.agent === 'prosecutor' ? -9 : 9; // prosecutor pulls negative, defender positive
    const dampen = 1 - progress * 0.5;
    const confidence = Math.round(Math.max(-95, Math.min(95, trend + swing * dampen)));
    points.push({ step: i + 1, agent: s.agent, source: s.title || '', domain: extractDomain(s.url || ''), confidence });
  }
  points[points.length - 1].confidence = finalPosition;
  return points;
}

// Guarantees: defender points always rise, prosecutor points always fall.
// Then linearly rescales intermediates so the last value lands exactly on finalPosition.
function enforceOscillation(points, finalPosition) {
  if (points.length < 2) return points;

  // Pass 1: fix direction violations (min delta = 1 in the correct direction)
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].confidence;
    if (points[i].agent === 'defender' && points[i].confidence <= prev) {
      points[i].confidence = Math.min(95, prev + 1);
    } else if (points[i].agent === 'prosecutor' && points[i].confidence >= prev) {
      points[i].confidence = Math.max(-95, prev - 1);
    }
  }

  // Pass 2: rescale intermediate values so the sequence ends at finalPosition
  const s = points[0].confidence; // 0
  const e = points[points.length - 1].confidence;
  if (Math.abs(e - s) > 1) {
    const scale = (finalPosition - s) / (e - s);
    for (let i = 1; i < points.length - 1; i++) {
      points[i].confidence = Math.round(s + (points[i].confidence - s) * scale);
      points[i].confidence = Math.max(-95, Math.min(95, points[i].confidence));
    }
  }
  points[points.length - 1].confidence = finalPosition;

  // Pass 3: fix any direction violations introduced by rescaling
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1].confidence;
    if (points[i].agent === 'defender' && points[i].confidence <= prev) {
      points[i].confidence = Math.min(95, prev + 1);
    } else if (points[i].agent === 'prosecutor' && points[i].confidence >= prev) {
      points[i].confidence = Math.max(-95, prev - 1);
    }
  }
  points[points.length - 1].confidence = finalPosition;

  return points;
}

async function generateConfidenceTimeline(prosecutionResults, defenseResults, verdict, finalConfidence) {
  const finalPosition = verdictFinalPosition(verdict, finalConfidence);

  // Interleave sources: P0, D0, P1, D1, ...
  const maxLen = Math.max(prosecutionResults.length, defenseResults.length);
  const interleaved = [];
  for (let i = 0; i < maxLen; i++) {
    if (i < prosecutionResults.length) interleaved.push({ agent: 'prosecutor', ...prosecutionResults[i] });
    if (i < defenseResults.length)    interleaved.push({ agent: 'defender',   ...defenseResults[i] });
  }

  const sourceList = interleaved
    .map((s, i) => `${i + 1}. [${s.agent.toUpperCase()}] ${(s.title || '').slice(0, 80)} (${extractDomain(s.url || '')})`)
    .join('\n');

  const systemPrompt =
    'You are reconstructing a fact-checking judge\'s deliberation during a debate.\n' +
    `Final verdict: ${verdict}. Final position: ${finalPosition} on a scale from -100 (FALSE) to +100 (VERIFIED/TRUE).\n\n` +
    'Given sources reviewed in alternating order, return the judge\'s signed position after each source. Rules:\n' +
    '- Start at 0 (neutral)\n' +
    '- PROSECUTION sources push toward FALSE — the value must decrease compared to the previous step\n' +
    '- DEFENSE sources push toward TRUE — the value must increase compared to the previous step\n' +
    '- The last step MUST end at exactly ' + finalPosition + '\n' +
    '- Show realistic oscillation between positive and negative territory\n\n' +
    'Return ONLY a valid JSON array, no text before or after:\n' +
    '[{"step":1,"agent":"prosecutor","source":"title","domain":"domain.com","confidence":-28}, ...]';

  try {
    const raw = await callRegolo(systemPrompt, `Sources in order:\n${sourceList}`);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      parsed = match ? JSON.parse(match[0]) : null;
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      const normalized = parsed.map((p, i) => ({
        ...p,
        agent: i < interleaved.length ? interleaved[i].agent : p.agent,
        domain: i < interleaved.length ? extractDomain(interleaved[i].url || '') : p.domain,
        source: i < interleaved.length ? (interleaved[i].title || '') : p.source,
      }));
      const full = [{ step: 0, agent: 'start', source: 'Analysis begins', domain: '', confidence: 0 }, ...normalized];
      return enforceOscillation(full, finalPosition);
    }
  } catch (err) {
    console.error('generateConfidenceTimeline error:', err.message);
  }
  return generateFallbackTimeline(interleaved, finalPosition);
}

module.exports = { runProsecutor, runDefender, runJudge, generateConfidenceTimeline };
