require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HF_TOKEN);

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, png, webp, and gif images are allowed'));
  }
});

// ─── HuggingFace classifier ───────────────────────────────────────────────────
async function detectAI_HF(imageBuffer, mimeType, model) {
  try {
    const blob = new Blob([imageBuffer], { type: mimeType });
    const results = await hf.imageClassification({ model, data: blob });
    console.log(`[HF ${model}]`, JSON.stringify(results));

    const AI_KEYWORDS = ['artificial', 'ai', 'fake', 'generated', 'synthetic', 'deepfake', 'aigc'];
    const artificial = results.find(r => AI_KEYWORDS.some(k => r.label.toLowerCase().includes(k)));
    return artificial?.score ?? results[0]?.score ?? 0;
  } catch (err) {
    console.warn(`[HF ${model}] failed:`, err.message);
    return null;
  }
}

// ─── Groq visual forensics ────────────────────────────────────────────────────
async function detectAI_Groq(imageBuffer, mimeType) {
  const base64data = imageBuffer.toString('base64');

  const messages = [
    {
      role: 'system',
      content: `You are a forensic AI image detection specialist. Your only job is to determine if an image is AI-generated or a real photograph.

Inspect carefully for these AI generation artifacts:
- HANDS & FINGERS: extra/missing/fused fingers, unnatural joints, wrong proportions
- FACES: waxy/overly smooth skin, asymmetric features, uncanny valley eyes, impossible hair
- TEXT & SIGNS: garbled, morphed, or nonsensical letters/words
- BACKGROUNDS: repeating textures, objects melting into each other, impossible geometry
- LIGHTING & SHADOWS: inconsistent light sources, shadows pointing wrong directions, mismatched reflections
- EDGES & SURFACES: airbrushed look, loss of fine detail, smearing artifacts, plastic-like surfaces
- PHYSICS: clothing defying gravity, impossible poses, wrong object topology

Be especially suspicious of images that look "too perfect" or have subtle wrongness.
Respond ONLY with a valid JSON object and nothing else.`
    },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64data}` } },
        {
          type: 'text',
          text: 'Is this image AI-generated or a real photograph? Inspect every detail carefully. Respond ONLY with:\n{"is_ai": true | false, "confidence": <integer 0-100>, "reasoning": "<specific artifacts found or why it looks real>"}'
        }
      ]
    }
  ];

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    { model: 'meta-llama/llama-4-scout-17b-16e-instruct', messages, temperature: 0.1, max_tokens: 256 },
    { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
  );

  const raw = response.data.choices[0].message.content.trim();
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  console.log('[Groq]', JSON.stringify(parsed));
  return parsed;
}

// ─── Ensemble: Groq 60% + HF-umm 20% + HF-organika 20% ──────────────────────
async function detectAI(imageBuffer, mimeType) {
  const [groqResult, hf1Score, hf2Score] = await Promise.all([
    detectAI_Groq(imageBuffer, mimeType),
    detectAI_HF(imageBuffer, mimeType, 'umm-maybe/AI-image-detector'),
    detectAI_HF(imageBuffer, mimeType, 'Organika/sdxl-detector'),
  ]);

  const groqAIScore = groqResult.is_ai ? groqResult.confidence / 100 : 1 - groqResult.confidence / 100;

  let totalWeight = 0.6;
  let weightedScore = groqAIScore * 0.6;

  if (hf1Score !== null) { weightedScore += hf1Score * 0.2; totalWeight += 0.2; }
  if (hf2Score !== null) { weightedScore += hf2Score * 0.2; totalWeight += 0.2; }

  const ensembleScore = weightedScore / totalWeight;

  // Groq override: if very confident (>=80%), trust it directly
  const is_ai_generated = groqResult.confidence >= 80
    ? groqResult.is_ai
    : ensembleScore >= 0.5;

  const ai_confidence = Math.round(is_ai_generated ? ensembleScore * 100 : (1 - ensembleScore) * 100);

  console.log(`[Ensemble] Groq=${Math.round(groqAIScore*100)}% HF1=${hf1Score !== null ? Math.round(hf1Score*100)+'%' : 'N/A'} HF2=${hf2Score !== null ? Math.round(hf2Score*100)+'%' : 'N/A'} → ${is_ai_generated ? 'AI' : 'Real'} ${ai_confidence}%`);

  return { is_ai_generated, ai_confidence, ai_reasoning: groqResult.reasoning };
}

// ─── Groq content fact-check ─────────────────────────────────────────────────
async function factCheckContent(imageBuffer, mimeType) {
  const base64data = imageBuffer.toString('base64');

  const messages = [
    {
      role: 'system',
      content: 'You are an expert fact-checker. Analyze what is depicted in this image and assess whether the content is factually accurate. You must always respond with a valid JSON object and nothing else.'
    },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64data}` } },
        {
          type: 'text',
          text: 'Analyze the content depicted in this image for factual accuracy. Respond ONLY with this JSON structure, no markdown, no explanation outside the JSON:\n{\n  "content_verdict": "VERIFIED" | "PARTIALLY_TRUE" | "INCONCLUSIVE" | "MISLEADING" | "FALSE",\n  "content_confidence": <integer 0-100>,\n  "content_summary": "<2-3 sentences describing what is depicted and whether it is accurate>"\n}'
        }
      ]
    }
  ];

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    { model: 'meta-llama/llama-4-scout-17b-16e-instruct', messages, temperature: 0.2, max_tokens: 512 },
    { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
  );

  const raw = response.data.choices[0].message.content.trim();
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(cleaned);
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded. Use field name "image".' });
  }

  const { buffer, mimetype } = req.file;

  try {
    const [aiResult, contentResult] = await Promise.all([
      detectAI(buffer, mimetype),
      factCheckContent(buffer, mimetype),
    ]);

    return res.json({ ...aiResult, ...contentResult });
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('Analysis error:', JSON.stringify(detail, null, 2));
    return res.status(502).json({ error: JSON.stringify(detail) });
  }
});

app.listen(PORT, () => {
  console.log(`Image Analyzer running on http://localhost:${PORT}`);
});
