const express = require('express');
const router = express.Router();
const { webSearch } = require('../utils/search');
const { runProsecutor, runDefender, runJudge } = require('../agents/debate');

// ── CORS: allow any localhost port (Dev 3 Next.js may run on 3000 or any port) ──
router.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Rate limiter: max 8 requests per IP per 60 seconds ──
const rateLimitMap = new Map(); // ip → { count, resetAt }

function checkRateLimit(ip) {
  const now = Date.now();
  const WINDOW_MS = 60_000;
  const MAX_REQUESTS = 8;

  const entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

// ── Helpers ──
function timestamp() {
  return new Date().toTimeString().slice(0, 8); // HH:MM:SS
}

function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), ms)
  );
}

// ── POST /api/analyze ──
router.post('/analyze', async (req, res) => {
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  // Rate limit check
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait 60 seconds before trying again.' });
  }

  // Step 1 — Validate
  const { text } = req.body;
  if (!text || text.length < 20) {
    return res.status(400).json({ error: 'Please provide a news article with at least 20 characters.' });
  }

  // Step 2 — Sanitize
  const cleanedText = text.replace(/<[^>]*>/g, '').slice(0, 3000);

  // Step 3 — Base query from first 12 words
  const baseQuery = cleanedText.split(/\s+/).slice(0, 12).join(' ');

  const pipeline = async () => {
    // Step 4 — Parallel searches
    const [prosecutionResults, defenseResults] = await Promise.all([
      webSearch('smentita falsa bufala ' + baseQuery, 6),
      webSearch('confermato verificato fonte ufficiale ' + baseQuery, 6),
    ]);

    // Step 5 — Parallel agents
    const [prosecutorArg, defenderArg] = await Promise.all([
      runProsecutor(cleanedText, prosecutionResults),
      runDefender(cleanedText, defenseResults),
    ]);

    // Step 6 — Judge (sequential)
    const judgeResult = await runJudge(cleanedText, prosecutorArg, defenderArg);

    return { prosecutionResults, defenseResults, prosecutorArg, defenderArg, judgeResult };
  };

  try {
    const result = await Promise.race([pipeline(), timeoutPromise(60_000)]);

    const { prosecutionResults, defenseResults, prosecutorArg, defenderArg, judgeResult } = result;
    const duration = Date.now() - start;
    const preview = cleanedText.slice(0, 60).replace(/\n/g, ' ');

    console.log(
      `[${timestamp()}] ANALYZE | ${preview}... | verdict: ${judgeResult.verdict} | confidence: ${judgeResult.confidence} | ${duration}ms`
    );

    res.json({
      verdict: judgeResult.verdict,
      confidence: judgeResult.confidence,
      summary: judgeResult.summary,
      prosecutor_argument: prosecutorArg,
      defender_argument: defenderArg,
      prosecutor_sources: prosecutionResults,
      defender_sources: defenseResults,
      prosecutor_points: judgeResult.prosecutor_points,
      defender_points: judgeResult.defender_points,
    });
  } catch (error) {
    const duration = Date.now() - start;
    if (error.message === 'TIMEOUT') {
      const preview = cleanedText.slice(0, 60).replace(/\n/g, ' ');
      console.log(`[${timestamp()}] ANALYZE | ${preview}... | verdict: TIMEOUT | ${duration}ms`);
      return res.status(408).json({ error: 'Analysis timed out. The news article may be too complex. Please try again.' });
    }
    console.error('[/api/analyze] unhandled error:', error.message);
    res.status(500).json({ error: 'Analysis failed. Please try again.', details: error.message });
  }
});

// ── GET /api/test ──
router.get('/test', async (req, res) => {
  const regolo = process.env.REGOLO_API_KEY ? 'ok' : 'missing';
  const serperKeySet = !!process.env.SERPER_API_KEY;

  let serper = 'error';
  if (serperKeySet) {
    try {
      const results = await webSearch('test', 1);
      serper = results.length > 0 ? 'ok' : 'error';
    } catch (_) {
      serper = 'error';
    }
  } else {
    serper = 'missing';
  }

  res.json({ regolo, serper, ready: regolo === 'ok' && serper === 'ok' });
});

module.exports = router;
