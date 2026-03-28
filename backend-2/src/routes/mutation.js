const express = require('express');
const router = express.Router();
const axios = require('axios');

const { fetchVersions } = require('../utils/multisource');
const { computeMutationScores } = require('../utils/mutation');
const { assessCredibility } = require('../utils/credibility');
const { buildSourceGraph } = require('../utils/graph');
const { computeViralityRisk } = require('../utils/virality');

// In-memory rate limiter: { ip -> [timestamp, ...] }
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

function formatTime(date) {
  return date.toTimeString().slice(0, 8);
}

router.post('/mutation', async (req, res) => {
  const { text, sourceUrl } = req.body;

  if (!text || text.length < 20) {
    return res.status(400).json({
      error: 'Please provide a news article with at least 20 characters.',
    });
  }

  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait 60 seconds.',
    });
  }

  const startTime = Date.now();

  const pipeline = async () => {
    // Strip HTML tags and truncate
    const cleanedText = text.replace(/<[^>]*>/g, '').slice(0, 3000);

    // 1. Fetch versions from multiple sources (proceed even with < 2 results)
    const versions = await fetchVersions(cleanedText);

    // 2. Compute mutation scores (similarity, mutationScore, isSource)
    const versionsWithMutation = await computeMutationScores(cleanedText, versions, sourceUrl);

    // 3. Assess credibility for each version
    const versionsWithCredibility = versionsWithMutation.map((v) => ({
      ...v,
      credibility: assessCredibility(v.domain),
    }));

    // 4. Build source graph
    const graph = buildSourceGraph(versionsWithCredibility);

    // 5. Compute virality risk
    const viralityRisk = computeViralityRisk(cleanedText, versionsWithCredibility);

    return { versions: versionsWithCredibility, graph, viralityRisk };
  };

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), 20000)
  );

  try {
    const result = await Promise.race([pipeline(), timeout]);

    const elapsed = Date.now() - startTime;
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 60);
    console.log(
      `[${formatTime(new Date())}] MUTATION | ${preview}... | versions: ${result.versions.length} | virality: ${result.viralityRisk.score} | ${elapsed}ms`
    );

    return res.json(result);
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      return res.status(408).json({
        error: 'Mutation analysis timed out. Please try again.',
      });
    }
    console.error('[POST /mutation] error:', err.message);
    return res.status(500).json({
      error: 'Mutation analysis failed.',
      details: err.message,
    });
  }
});

router.get('/mutation/test', async (req, res) => {
  const serperKey = process.env.SERPER_API_KEY;

  if (!serperKey) {
    return res.json({ serper: 'error', ready: false });
  }

  try {
    await axios.post(
      'https://google.serper.dev/search',
      { q: 'test notizia', num: 1, gl: 'it', hl: 'it' },
      {
        headers: {
          'X-API-Key': serperKey,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.json({ serper: 'ok', ready: true });
  } catch (err) {
    return res.json({ serper: 'error', ready: false });
  }
});

module.exports = router;
