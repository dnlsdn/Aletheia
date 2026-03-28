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

module.exports = { runProsecutor, runDefender, runJudge };
