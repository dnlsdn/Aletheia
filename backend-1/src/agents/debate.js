const axios = require('axios');

const REGOLO_URL = 'https://api.regolo.ai/v1/chat/completions';
const MODEL = 'Llama-3.3-70B-Instruct';

function formatUserMessage(newsText, searchResults) {
  const sources = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
    .join('\n\n');
  return `ARTICOLO:\n${newsText}\n\nFONTI DI RICERCA:\n${sources}`;
}

async function callRegolo(systemPrompt, userMessage) {
  const response = await axios.post(
    REGOLO_URL,
    {
      model: MODEL,
      max_tokens: 800,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    },
    {
      headers: {
        Authorization: 'Bearer ' + process.env.REGOLO_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content;
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
  'Verdict values and when to use them:\n' +
  '- VERIFIED: use only when confidence >= 80 and sources clearly confirm the article\n' +
  '- PARTIALLY_TRUE: article has real elements mixed with inaccuracies or missing context\n' +
  '- INCONCLUSIVE: genuine credible evidence exists on both sides — this is the honest answer when unsure\n' +
  '- MISLEADING: the article is technically not false but is framed to create a wrong impression\n' +
  '- FALSE: use only when confidence >= 75 and sources clearly contradict the article\n\n' +
  'The confidence score must reflect actual certainty: do not cluster everything between 55-70.\n' +
  'Use the full range. Only use INCONCLUSIVE when you genuinely cannot decide after weighing all evidence.';

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
    const response = await axios.post(
      REGOLO_URL,
      {
        model: MODEL,
        max_tokens: 700,
        messages: [
          { role: 'system', content: JUDGE_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      },
      {
        headers: {
          Authorization: 'Bearer ' + process.env.REGOLO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
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
