const express = require('express');
const router = express.Router();
const { webSearch } = require('../utils/search');
const { runProsecutor, runDefender, runJudge } = require('../agents/debate');

// POST /api/analyze
router.post('/analyze', async (req, res) => {
  try {
    // Step 1 — Validate
    const { text } = req.body;
    if (!text || text.length < 20) {
      return res.status(400).json({ error: 'Please provide a news article with at least 20 characters.' });
    }

    // Step 2 — Sanitize
    const cleanedText = text.replace(/<[^>]*>/g, '').slice(0, 3000);

    // Step 3 — Base query from first 12 words
    const baseQuery = cleanedText.split(/\s+/).slice(0, 12).join(' ');

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

    // Step 7 — Return
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
    console.error('[/api/analyze] unhandled error:', error.message);
    res.status(500).json({ error: 'Analysis failed. Please try again.', details: error.message });
  }
});

// GET /api/test
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
