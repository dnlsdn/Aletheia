const { computeSimilarity } = require('./similarity');

async function computeMutationScores(originalText, versions, sourceUrl) {
  const results = [];

  for (const version of versions) {
    const similarity = await computeSimilarity(originalText, version.snippet || version.title || '');
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
