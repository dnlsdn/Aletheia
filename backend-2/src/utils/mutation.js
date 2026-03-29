const { computeSimilarity } = require('./similarity');

/**
 * Parses a Serper date string (e.g. "3 hours ago", "Dec 15, 2024", "2024-12-15")
 * and returns a Date or null.
 */
function parseSerperDate(dateStr) {
  if (!dateStr) return null;
  const s = dateStr.trim().toLowerCase();

  // Relative: "X hours/days/weeks/months ago"
  const rel = s.match(/(\d+)\s+(hour|day|week|month)s?\s+ago/);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = rel[2];
    const d = new Date();
    if (unit === 'hour') d.setHours(d.getHours() - n);
    else if (unit === 'day') d.setDate(d.getDate() - n);
    else if (unit === 'week') d.setDate(d.getDate() - n * 7);
    else if (unit === 'month') d.setMonth(d.getMonth() - n);
    return d;
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Score 0–1 based on how close the version date is to today (original text is assumed current).
 * Older articles get lower scores, biasing mutation detection toward recency.
 */
function dateProximityScore(dateStr) {
  const d = parseSerperDate(dateStr);
  if (!d) return 0.5; // neutral when unknown
  const daysDiff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff <= 1) return 1.0;
  if (daysDiff <= 7) return 0.9;
  if (daysDiff <= 30) return 0.75;
  if (daysDiff <= 180) return 0.55;
  if (daysDiff <= 365) return 0.4;
  return 0.25;
}

/**
 * Build an enriched text for embedding that includes structured metadata
 * so the model captures temporal and source context, not just semantics.
 */
function buildEnrichedText(version) {
  const parts = [];
  if (version.date) parts.push(`[Data: ${version.date}]`);
  if (version.domain) parts.push(`[Fonte: ${version.domain}]`);
  if (version.title) parts.push(version.title + '.');
  if (version.snippet) parts.push(version.snippet);
  return parts.join(' ').trim() || version.title || '';
}

async function computeMutationScores(originalText, versions, sourceUrl) {
  const results = [];

  for (const version of versions) {
    const enrichedText = buildEnrichedText(version);
    const semanticSim = await computeSimilarity(originalText, enrichedText);
    const dateSim = dateProximityScore(version.date);

    // Blend: 80% semantic (content), 20% temporal (date proximity)
    const similarity = Math.min(1, 0.8 * semanticSim + 0.2 * dateSim);

    results.push({
      ...version,
      similarity,
      mutationScore: Math.round((1 - similarity) * 100),
      isSource: false,
    });
  }

  results.sort((a, b) => b.similarity - a.similarity);

  // If the user submitted a URL, pin it as the primary source regardless of similarity scores.
  if (sourceUrl) {
    let domain = '';
    try {
      domain = new URL(sourceUrl).hostname.replace(/^www\./, '');
    } catch {
      domain = sourceUrl;
    }

    // Remove any duplicate result that Serper may have returned for the same URL
    const filtered = results.filter((r) => r.url !== sourceUrl);

    const sourceEntry = {
      title: domain,
      url: sourceUrl,
      snippet: originalText.slice(0, 200),
      domain,
      similarity: 1.0,
      mutationScore: 0,
      isSource: true,
    };

    return [sourceEntry, ...filtered];
  }

  // Fallback when no URL was provided: mark the closest match as the source
  if (results.length > 0) {
    results[0].isSource = true;
  }

  return results;
}

module.exports = { computeMutationScores };
