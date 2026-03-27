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

module.exports = { runProsecutor, runDefender };
