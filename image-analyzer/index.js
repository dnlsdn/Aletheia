require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const { HfInference } = require('@huggingface/inference');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const hf = new HfInference(process.env.HF_TOKEN);
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const app = express();
const BASE_PORT = Number(process.env.IMAGE_ANALYZER_PORT || process.env.PORT || 3003);
const MAX_PORT_ATTEMPTS = 8;
const PARANOID_MODE = false;
const AI_THRESHOLD = PARANOID_MODE ? 0.55 : 0.62;
const REAL_THRESHOLD = PARANOID_MODE ? 0.18 : 0.22;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CAMERA_BRANDS_REGEX = /Canon|Nikon|Sony|Apple|Samsung|FUJIFILM|Panasonic|Leica|Olympus|Pentax|Hasselblad|iPhone|Pixel|Xiaomi|Huawei|OnePlus/i;
const AI_METADATA_SIGNATURES = [
  'parameters',
  'workflow',
  'Midjourney',
  'DALL-E',
  'Adobe Firefly',
  'Stable Diffusion',
  'DreamStudio',
  'invokeai',
  'ComfyUI',
  'AIGC',
  'generativeai',
  'Prompt:',
  'Negative prompt:',
  'CFG scale:',
  'Sampler:',
  'Steps:'
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, png, webp, and gif images are allowed'));
  }
});

// ─── Metadata analysis (JPEG EXIF + PNG AI chunks) ───────────────────────────
// Metadata absence is weak evidence. Explicit signatures are strong.
function analyzeMetadata(imageBuffer, mimeType) {
  try {
    const fullStr = imageBuffer.toString('latin1');

    const aiSignature = AI_METADATA_SIGNATURES.find(sig => fullStr.includes(sig));
    if (aiSignature) {
      return {
        score: 0.99,
        strength: 'strong',
        signal: 'ai_signature',
        reason: `AI generator signature found in metadata: "${aiSignature}"`
      };
    }

    if (CAMERA_BRANDS_REGEX.test(fullStr)) {
      return {
        score: 0.08,
        strength: 'strong',
        signal: 'camera_model',
        reason: 'Camera make/model found in metadata'
      };
    }

    if (['image/jpeg', 'image/jpg'].includes(mimeType)) {
      const hasExif = fullStr.includes('Exif');
      if (!hasExif) {
        return {
          score: 0.5,
          strength: 'weak',
          signal: 'no_exif',
          reason: 'JPEG without EXIF metadata (neutral: metadata can be stripped by social platforms)'
        };
      }
    }

    return {
      score: 0.5,
      strength: 'weak',
      signal: 'neutral',
      reason: `${mimeType} with no decisive metadata signatures`
    };
  } catch (err) {
    console.warn('[Metadata]', err.message);
    return { score: null, strength: 'none', signal: 'error', reason: 'Metadata parse error' };
  }
}

// ─── Reverse image search via Serper ─────────────────────────────────────────
// Real news photos appear in Google News with attribution. AI-fakes don't.
async function reverseImageSearch(imageBuffer, mimeType) {
  if (!process.env.SERPER_API_KEY) return null;
  try {
    // Serper reverse image search uses image as base64
    const base64 = imageBuffer.toString('base64');
    const response = await axios.post(
      'https://google.serper.dev/images',
      { q: 'related image', image: `data:${mimeType};base64,${base64}`, gl: 'us', hl: 'en', num: 5 },
      { headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' }, timeout: 8000 }
    );

    const results = response.data?.images || [];
    if (results.length === 0) return { score: 0.55, reason: 'No reverse image results (weak signal: image could be new or niche)' };

    const NEWS_DOMAINS = /reuters|apnews|bbc|nytimes|cnn|theguardian|washingtonpost|afp|getty|shutterstock|corbis/i;
    const hasNewsSource = results.some(r => NEWS_DOMAINS.test(r.link || '') || NEWS_DOMAINS.test(r.source || ''));

    if (hasNewsSource) return { score: 0.12, reason: `Found on verified news/photo agency: ${results[0].source || results[0].link}` };
    return { score: 0.48, reason: `Found ${results.length} reverse image results but no verified news/photo agency` };
  } catch (err) {
    console.warn('[ReverseSearch]', err.message);
    return null;
  }
}

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

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function vlmToAiProbability(result) {
  if (!result || typeof result.confidence !== 'number') return null;
  const confidence = clamp(result.confidence / 100, 0, 1);
  const aiProbability = result.is_ai ? confidence : 1 - confidence;
  return clamp(aiProbability, 0, 1);
}

function estimateEvidenceCount(result) {
  if (!result) return 0;
  if (Array.isArray(result.decisive_signals)) return result.decisive_signals.length;
  if (typeof result.reasoning === 'string') {
    return result.reasoning.split(/[.;\n]/).map(s => s.trim()).filter(Boolean).length;
  }
  return 0;
}

// ─── Groq visual forensics ────────────────────────────────────────────────────
async function detectAI_Groq(imageBuffer, mimeType) {
  try {
    const base64data = imageBuffer.toString('base64');

    const messages = [
      {
        role: 'system',
        content: `You are a forensic AI image detection specialist. Your ONLY job is to determine if an image is AI-generated or a real photograph.

Score each category 0-10 (0=clearly real, 10=clearly AI artifact):

1. HANDS & FINGERS — extra/missing/fused fingers, unnatural joints, wrong proportions
2. FACES — waxy/overly smooth skin, impossible symmetry, uncanny valley eyes, plastic-looking hair
3. TEXT & SIGNS — garbled, morphed, or nonsensical letters (AI almost always fails text)
4. BACKGROUNDS — repeating textures, objects melting into each other, impossible geometry, dreamlike blur
5. LIGHTING & SHADOWS — inconsistent light sources, shadows wrong direction, impossible reflections
6. EDGES & TEXTURE — airbrushed look, smearing artifacts, lack of real-world noise/grain, plastic surfaces
7. OVERALL FEEL — "too perfect", hyperrealistic-but-wrong, dreamlike quality, no real-world imperfections

FOR CROWD/ACTION SHOTS (where faces are small or unclear):
- Ground texture: does pavement/ground have realistic variation or AI's characteristic uniform smoothness?
- Crowd density physics: are people physically plausible (bodies occluding each other correctly)?
- Object coherence: flags, signs, clothing — do they have real-world wear/wrinkles or look like 3D renders?
- Perspective consistency: does the depth falloff and lens distortion match a real camera?
- Motion blur: is motion blur physically consistent with the implied shutter speed?
- Smoke/atmospheric effects: do they behave physically or look like a generated texture?

Note: modern AI (Midjourney v6, DALL-E 3, Flux) is very good — look for subtle tells, not obvious glitches.
Respond ONLY with a valid JSON object.`
      },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64data}` } },
          {
            type: 'text',
            text: 'Analyze every pixel. Return ONLY JSON:\n{"is_ai": true | false, "confidence": <0-100>, "scores": {"hands": 0-10, "faces": 0-10, "text": 0-10, "backgrounds": 0-10, "lighting": 0-10, "edges": 0-10, "overall_feel": 0-10}, "decisive_signals": ["signal 1","signal 2"], "reasoning": "<2-3 decisive details>"}'
          }
        ]
      }
    ];

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'meta-llama/llama-4-scout-17b-16e-instruct', messages, temperature: 0.0, max_tokens: 450 },
      { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const raw = response.data.choices[0].message.content.trim();
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    parsed.confidence = Number(parsed.confidence ?? 0);
    console.log('[Groq]', JSON.stringify(parsed));
    return parsed;
  } catch (err) {
    console.warn('[Groq] failed:', err.response?.data || err.message);
    return null;
  }
}

// ─── Gemini visual forensics (second VLM for cross-validation) ────────────────
async function detectAI_Gemini(imageBuffer, mimeType) {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const imagePart = { inlineData: { data: imageBuffer.toString('base64'), mimeType } };
    const prompt = `You are a forensic AI image detection expert. Determine if this image is AI-generated or a real photograph.

Look for: extra/fused fingers, waxy skin, garbled text in signs, repeating background textures, inconsistent lighting/shadows, "too perfect" hyperrealistic quality, lack of natural film grain or sensor noise.

Modern AI (Midjourney, DALL-E 3, Flux) is very convincing — look for subtle artifacts.

Respond ONLY with valid JSON, no markdown:
{"is_ai": true | false, "confidence": <integer 0-100>, "decisive_signals": ["signal 1","signal 2"], "reasoning": "<2-3 decisive details>"}`;

    const result = await model.generateContent([prompt, imagePart]);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    parsed.confidence = Number(parsed.confidence ?? 0);
    console.log('[Gemini]', JSON.stringify(parsed));
    return parsed;
  } catch (err) {
    console.warn('[Gemini] failed:', err.message);
    return null;
  }
}

function buildReasoningParts({ groqResult, geminiResult, metaResult, reverseSearch, disagreementHigh }) {
  const reasoningParts = [];
  if (groqResult?.reasoning) reasoningParts.push(`Groq: ${groqResult.reasoning}`);
  if (geminiResult?.reasoning) reasoningParts.push(`Gemini: ${geminiResult.reasoning}`);
  if (metaResult?.reason) reasoningParts.push(`Metadata: ${metaResult.reason}`);
  if (reverseSearch?.reason) reasoningParts.push(`Search: ${reverseSearch.reason}`);
  if (disagreementHigh) reasoningParts.push('Cross-model disagreement is high-confidence; verdict downgraded to uncertain.');
  return reasoningParts;
}

function normalizeWeightedProbability(signals) {
  let weighted = 0;
  let total = 0;
  for (const signal of signals) {
    if (signal.score === null || signal.score === undefined || Number.isNaN(signal.score)) continue;
    weighted += signal.score * signal.weight;
    total += signal.weight;
  }
  return total > 0 ? clamp(weighted / total) : 0.5;
}

function computeInternalVerdict(ensembleScore, disagreementHigh) {
  if (disagreementHigh) return 'UNCERTAIN';
  if (ensembleScore >= AI_THRESHOLD) return 'AI_GENERATED';
  if (ensembleScore <= REAL_THRESHOLD) return 'REAL_PHOTO';
  return 'UNCERTAIN';
}

function computeDisplayedConfidence(ensembleScore, verdict) {
  const distance = Math.abs(ensembleScore - 0.5);
  if (PARANOID_MODE) {
    if (verdict === 'UNCERTAIN') return Math.round(28 + distance * 26); // 28-41
    return Math.round(38 + distance * 72); // 38-74
  }
  if (verdict === 'UNCERTAIN') return Math.round(35 + distance * 30); // 35-50
  return Math.round(45 + distance * 90); // 45-90
}

function computePhotoAuthenticityVerdict(aiResult) {
  const aiVerdict = aiResult.ai_verdict || 'UNCERTAIN';
  const aiScore = Number(aiResult.ai_score ?? 50);
  const aiConf = Number(aiResult.ai_confidence ?? 50);
  const metaSignal = aiResult.metadata_signal || 'neutral';
  const contextSearch = aiResult.context_search || {};
  const hasTrustedSource = !!contextSearch.has_trusted_source;

  // Very strict provenance policy:
  // REAL_ORIGINAL only if multiple independent signals agree.
  const strongRealChain = (
    aiVerdict === 'REAL_PHOTO' &&
    aiScore <= 18 &&
    aiConf >= 72 &&
    hasTrustedSource &&
    metaSignal === 'camera_model'
  );

  if (strongRealChain) {
    return {
      image_verdict: 'REAL_ORIGINAL',
      image_confidence: 72,
      image_reasoning: 'Strong provenance chain: real-photo signals, trusted source corroboration, and camera metadata.'
    };
  }

  return {
    image_verdict: 'FAKE_OR_DERIVED',
    image_confidence: Math.max(60, Math.min(92, 58 + Math.round((aiScore + aiConf) / 4))),
    image_reasoning: 'Provenance is insufficient for an original-photo label. Treated as fake/derived (AI, edited, screenshot, or re-contextualized image).'
  };
}

function normalizeContentVerdict(contentResult, aiResult) {
  const normalized = { ...contentResult };
  const verdict = normalized.content_verdict;
  const confidence = Number(normalized.content_confidence ?? 0);
  const aiScore = Number(aiResult.ai_score ?? 50);
  const aiConf = Number(aiResult.ai_confidence ?? 50);
  const aiVerdict = aiResult.ai_verdict || 'UNCERTAIN';
  const aiIsLikelyGenerated = aiResult.is_ai_generated && aiConf >= 60;
  const aiIsSuspicious = aiVerdict !== 'REAL_PHOTO' || aiScore >= 40 || aiConf >= 55;
  const contextSearch = aiResult.context_search || {};
  const hasTrustedSource = !!contextSearch.has_trusted_source;
  const reverseScore = Number(contextSearch.score ?? 0.5);
  const imageVerdict = aiResult.image_verdict || 'FAKE_OR_DERIVED';

  normalized.content_confidence = Math.max(0, Math.min(100, confidence));

  if (PARANOID_MODE && verdict === 'VERIFIED') {
    const veryStrongRealSignal = aiVerdict === 'REAL_PHOTO' && aiConf >= 80 && aiScore <= 18;
    if (!veryStrongRealSignal) {
      normalized.content_verdict = aiIsSuspicious ? 'MISLEADING' : 'PARTIALLY_TRUE';
      normalized.content_confidence = Math.min(normalized.content_confidence, 52);
      normalized.content_summary = `${normalized.content_summary} Paranoid mode is active: strict evidence threshold not met for VERIFIED.`;
      return normalized;
    }
  }

  if (PARANOID_MODE && !hasTrustedSource && ['VERIFIED', 'PARTIALLY_TRUE'].includes(normalized.content_verdict)) {
    normalized.content_verdict = aiIsSuspicious ? 'MISLEADING' : 'INCONCLUSIVE';
    normalized.content_confidence = Math.min(normalized.content_confidence, 48);
    normalized.content_summary = `${normalized.content_summary} Photo-only mode: no trusted source corroboration found for this context.`;
  }

  if (!PARANOID_MODE && verdict === 'VERIFIED') {
    if (aiIsLikelyGenerated) {
      normalized.content_verdict = 'MISLEADING';
      normalized.content_confidence = Math.min(normalized.content_confidence, 58);
      normalized.content_summary = `${normalized.content_summary} The image appears AI-generated, so treating this as a verified real-world capture is misleading.`;
      return normalized;
    }

    if (normalized.content_confidence < 88) {
      normalized.content_verdict = 'PARTIALLY_TRUE';
      normalized.content_confidence = Math.min(normalized.content_confidence, 68);
      normalized.content_summary = `${normalized.content_summary} Evidence is not strong enough for a strict VERIFIED label; downgraded to PARTIALLY_TRUE.`;
      return normalized;
    }
  }

  if (verdict === 'PARTIALLY_TRUE' && aiIsLikelyGenerated) {
    normalized.content_verdict = 'MISLEADING';
    normalized.content_confidence = Math.min(normalized.content_confidence, PARANOID_MODE ? 48 : 60);
    normalized.content_summary = `${normalized.content_summary} Since the image itself appears AI-generated, the representation is likely misleading.`;
  }

  if (PARANOID_MODE && verdict === 'PARTIALLY_TRUE' && aiIsSuspicious) {
    normalized.content_verdict = 'INCONCLUSIVE';
    normalized.content_confidence = Math.min(normalized.content_confidence, 46);
    normalized.content_summary = `${normalized.content_summary} Paranoid mode: downgraded due to synthetic/manipulation risk signals.`;
  }

  if (PARANOID_MODE && verdict === 'INCONCLUSIVE' && aiIsSuspicious && aiScore >= 50) {
    normalized.content_verdict = 'MISLEADING';
    normalized.content_confidence = Math.min(normalized.content_confidence, 50);
    normalized.content_summary = `${normalized.content_summary} Paranoid mode: suspicious synthetic signals suggest likely misleading representation.`;
  }

  if (PARANOID_MODE && ['VERIFIED', 'PARTIALLY_TRUE'].includes(normalized.content_verdict)) {
    normalized.content_confidence = Math.min(normalized.content_confidence, 55);
  }

  if (PARANOID_MODE && hasTrustedSource && aiVerdict === 'REAL_PHOTO' && reverseScore <= 0.2) {
    if (normalized.content_verdict === 'INCONCLUSIVE' && normalized.content_confidence <= 45) {
      normalized.content_verdict = 'PARTIALLY_TRUE';
      normalized.content_confidence = 52;
      normalized.content_summary = `${normalized.content_summary} Trusted reverse-search sources support contextual authenticity.`;
    }
  }

  // Target behavior: fake/derived photo can still represent a real context.
  if (
    hasTrustedSource &&
    imageVerdict === 'FAKE_OR_DERIVED' &&
    ['INCONCLUSIVE', 'MISLEADING', 'FALSE'].includes(normalized.content_verdict)
  ) {
    normalized.content_verdict = 'PARTIALLY_TRUE';
    normalized.content_confidence = Math.min(64, Math.max(52, normalized.content_confidence));
    normalized.content_summary = `${normalized.content_summary} The image appears fake/derived, but the depicted context is corroborated by trusted sources as a real event.`;
  }

  return normalized;
}

// ─── Ensemble with uncertainty handling ───────────────────────────────────────
async function detectAI(imageBuffer, mimeType) {
  const metaResult = analyzeMetadata(imageBuffer, mimeType);

  const [groqResult, geminiResult, hfHeemScore, hfOrganika, reverseSearch] = await Promise.all([
    detectAI_Groq(imageBuffer, mimeType),
    detectAI_Gemini(imageBuffer, mimeType),
    detectAI_HF(imageBuffer, mimeType, 'Heem2/Real-vs-AI-generated-Image-Detection'),
    detectAI_HF(imageBuffer, mimeType, 'Organika/sdxl-detector'),
    reverseImageSearch(imageBuffer, mimeType),
  ]);

  if (!groqResult && !geminiResult) {
    throw new Error('No visual model available for AI detection');
  }

  const groqAIScore = vlmToAiProbability(groqResult);
  const geminiAIScore = vlmToAiProbability(geminiResult);

  const groqEvidence = estimateEvidenceCount(groqResult);
  const geminiEvidence = estimateEvidenceCount(geminiResult);

  const groqReliability = groqResult ? clamp(0.55 + (groqResult.confidence / 100) * 0.45) : 0;
  const geminiReliability = geminiResult ? clamp(0.55 + (geminiResult.confidence / 100) * 0.45) : 0;
  const groqEvidencePenalty = groqEvidence < 2 ? 0.75 : 1;
  const geminiEvidencePenalty = geminiEvidence < 2 ? 0.75 : 1;

  const signals = [
    { name: 'groq', score: groqAIScore, weight: 0.38 * groqReliability * groqEvidencePenalty },
    { name: 'gemini', score: geminiAIScore, weight: 0.30 * geminiReliability * geminiEvidencePenalty },
    { name: 'hf_heem', score: hfHeemScore, weight: 0.14 },
    { name: 'hf_organika', score: hfOrganika, weight: 0.08 },
    { name: 'metadata', score: metaResult.score, weight: metaResult.strength === 'strong' ? 0.08 : 0.04 },
    { name: 'reverse', score: reverseSearch?.score ?? null, weight: 0.04 },
  ];

  const ensembleScore = normalizeWeightedProbability(signals);

  const disagreementHigh = !!(
    groqResult &&
    geminiResult &&
    groqResult.is_ai !== geminiResult.is_ai &&
    groqResult.confidence >= 75 &&
    geminiResult.confidence >= 75
  );

  const internalVerdict = computeInternalVerdict(ensembleScore, disagreementHigh);
  const ai_confidence = computeDisplayedConfidence(ensembleScore, internalVerdict);
  const is_ai_generated = internalVerdict === 'AI_GENERATED';
  const reasoningParts = buildReasoningParts({ groqResult, geminiResult, metaResult, reverseSearch, disagreementHigh });

  const compactSignals = signals
    .filter(s => s.score !== null && s.score !== undefined)
    .map(s => `${s.name}:${Math.round(s.score * 100)}(w${s.weight.toFixed(2)})`)
    .join(' ');

  console.log(`[Ensemble] score=${Math.round(ensembleScore * 100)} verdict=${internalVerdict} conf=${ai_confidence} ${compactSignals}`);

  return {
    is_ai_generated,
    ai_verdict: internalVerdict,
    ai_confidence,
    ai_score: Math.round(ensembleScore * 100),
    metadata_signal: metaResult.signal,
    ai_reasoning: reasoningParts.join(' '),
    context_search: reverseSearch
      ? {
          has_trusted_source: /verified news\/photo agency/i.test(reverseSearch.reason || ''),
          score: reverseSearch.score,
          reason: reverseSearch.reason
        }
      : { has_trusted_source: false, score: null, reason: 'Reverse search unavailable' }
  };
}

// ─── Groq content fact-check ─────────────────────────────────────────────────
async function factCheckContent(imageBuffer, mimeType) {
  const base64data = imageBuffer.toString('base64');

  const messages = [
    {
      role: 'system',
      content: 'You are a strict, skeptical fact-checker. Be conservative: if evidence is incomplete or uncertain, prefer INCONCLUSIVE or MISLEADING over VERIFIED. Use VERIFIED only when the image itself contains strong, unambiguous evidence. You must always respond with a valid JSON object and nothing else.'
    },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64data}` } },
        {
          type: 'text',
          text: `Analyze the image in photo-only mode (no external claim provided). Determine whether the context represented appears authentic or likely misleading/fake.
If corroboration is weak, prefer INCONCLUSIVE or MISLEADING. Do NOT use VERIFIED unless evidence is strong.
Respond ONLY with this JSON structure, no markdown, no explanation outside the JSON:
{
  "content_verdict": "VERIFIED" | "PARTIALLY_TRUE" | "INCONCLUSIVE" | "MISLEADING" | "FALSE",
  "content_confidence": <integer 0-100>,
  "content_summary": "<2-3 sentences describing what is depicted and whether it is accurate>"
}`
        }
      ]
    }
  ];

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    { model: 'meta-llama/llama-4-scout-17b-16e-instruct', messages, temperature: 0.0, max_tokens: 512 },
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
    const [aiResult, rawContentResult] = await Promise.all([
      detectAI(buffer, mimetype),
      factCheckContent(buffer, mimetype),
    ]);

    const authenticityResult = computePhotoAuthenticityVerdict(aiResult);
    const mergedAIResult = { ...aiResult, ...authenticityResult };
    const contentResult = normalizeContentVerdict(rawContentResult, mergedAIResult);

    return res.json({ ...mergedAIResult, ...contentResult });
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('Analysis error:', JSON.stringify(detail, null, 2));
    return res.status(502).json({ error: JSON.stringify(detail) });
  }
});

function startServer(preferredPort, attemptsLeft = MAX_PORT_ATTEMPTS) {
  const server = app.listen(preferredPort, () => {
    console.log(`Image Analyzer running on http://localhost:${preferredPort}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = preferredPort + 1;
      console.warn(`[Startup] Port ${preferredPort} already in use, retrying on ${nextPort}...`);
      startServer(nextPort, attemptsLeft - 1);
      return;
    }
    console.error('[Startup] Failed to start image-analyzer:', err.message);
    process.exit(1);
  });
}

startServer(BASE_PORT);
