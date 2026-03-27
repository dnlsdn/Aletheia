const { computeSimilarity } = require('./similarity');

async function computeMutationScores(originalText, versions) {
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

  if (results.length > 0) {
    results[0].isSource = true;
  }

  return results;
}

module.exports = { computeMutationScores };
