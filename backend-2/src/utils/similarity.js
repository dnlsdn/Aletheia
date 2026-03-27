const axios = require('axios');

const REGOLO_API_URL = 'https://api.regolo.ai/v1/embeddings';
const EMBEDDING_MODELS = ['Qwen3-Embedding-8B'];

async function getEmbedding(text) {
  for (const model of EMBEDDING_MODELS) {
    try {
      const response = await axios.post(
        REGOLO_API_URL,
        { model, input: text },
        {
          headers: {
            'Authorization': 'Bearer ' + process.env.REGOLO_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data[0].embedding;
    } catch (err) {
      const status = err.response?.status;
      if (status === 404 || (err.response?.data?.error?.code === 'model_not_found')) {
        // try next model
        continue;
      }
      console.error(`[similarity] getEmbedding error (model=${model}):`, err.message);
      return null;
    }
  }
  console.error('[similarity] getEmbedding: no working model found');
  return null;
}

function computeCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

function wordOverlapFallback(text1, text2) {
  const words = t => new Set(t.toLowerCase().match(/\w+/g) || []);
  const w1 = words(text1);
  const w2 = words(text2);
  let shared = 0;
  for (const w of w1) if (w2.has(w)) shared++;
  const maxLen = Math.max(w1.size, w2.size);
  return maxLen === 0 ? 0 : shared / maxLen;
}

async function computeSimilarity(text1, text2) {
  const [emb1, emb2] = await Promise.all([getEmbedding(text1), getEmbedding(text2)]);
  if (!emb1 || !emb2) {
    console.warn('[similarity] Falling back to word overlap ratio');
    return wordOverlapFallback(text1, text2);
  }
  return computeCosineSimilarity(emb1, emb2);
}

module.exports = { getEmbedding, computeCosineSimilarity, computeSimilarity };

// Self-test (only when executed directly)
if (require.main === module) {
  (async () => {
    const s1 = await computeSimilarity(
      'Il governo ha approvato una legge',
      'Il parlamento ha approvato la norma'
    );
    const s2 = await computeSimilarity(
      'Il governo ha approvato una legge',
      'La pizza napoletana è ottima'
    );
    console.log(`Similar sentences: ${s1.toFixed(4)} (expected > 0.7)`);
    console.log(`Unrelated sentences: ${s2.toFixed(4)} (expected < 0.4)`);
  })();
}
