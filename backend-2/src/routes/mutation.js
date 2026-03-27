const express = require('express');
const router = express.Router();
const axios = require('axios');

const { fetchVersions } = require('../utils/multisource');
const { computeMutationScores } = require('../utils/mutation');
const { assessCredibility } = require('../utils/credibility');
const { buildSourceGraph } = require('../utils/graph');
const { computeViralityRisk } = require('../utils/virality');

router.post('/mutation', async (req, res) => {
  const { text } = req.body;

  if (!text || text.length < 20) {
    return res.status(400).json({
      error: 'Please provide a news article with at least 20 characters.',
    });
  }

  try {
    // Strip HTML tags and truncate
    const cleanedText = text.replace(/<[^>]*>/g, '').slice(0, 3000);

    // 1. Fetch versions from multiple sources
    const versions = await fetchVersions(cleanedText);

    // 2. Compute mutation scores (similarity, mutationScore, isSource)
    const versionsWithMutation = await computeMutationScores(cleanedText, versions);

    // 3. Assess credibility for each version
    const versionsWithCredibility = versionsWithMutation.map((v) => ({
      ...v,
      credibility: assessCredibility(v.domain),
    }));

    // 4. Build source graph
    const graph = buildSourceGraph(versionsWithCredibility);

    // 5. Compute virality risk
    const viralityRisk = computeViralityRisk(cleanedText, versionsWithCredibility);

    return res.json({
      versions: versionsWithCredibility,
      graph,
      viralityRisk,
    });
  } catch (err) {
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
