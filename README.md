# ALETHE-IA

> Disinformation analysis platform — Codemotion Rome AI Tech Week 2026

ALETHE-IA analyzes a news story across three axes in parallel:
1. **Is it true?** — adversarial AI debate (Prosecutor vs Defender) with a final Judge
2. **How did it mutate?** — multi-source mutation tracking with semantic similarity
3. **Why do we believe it?** — rhetorical vulnerability scores and virality risk

## Architecture

| Service | Port | Responsibility |
|---------|------|----------------|
| `backend-1` | `3001` | Adversarial fact-checking (`POST /api/analyze`) |
| `backend-2` | `3002` | Mutation tracking + virality (`POST /mutation`) |
| `frontend` | `3000` | Next.js UI + API integration + ElevenLabs TTS |
| `image-analyzer` | `3003+` | AI/derived image analysis (`POST /api/analyze-image`) |

## Main Endpoints

### Backend 1 — `POST http://localhost:3001/api/analyze`
- Input: news text
- Output: `verdict`, `confidence`, `summary`, prosecutor/defender arguments, sources, key points, `confidence_timeline`

### Backend 2 — `POST http://localhost:3002/mutation`
- Input: news text (`text`) + optional `sourceUrl`
- Output: `versions` with `similarity`/`mutationScore`/`credibility`, `graph`, `viralityRisk`

### Image Analyzer — `POST http://localhost:3003/api/analyze-image`
- Input: multipart form-data with `image` field
- Output: `image_verdict` (REAL_ORIGINAL or FAKE_OR_DERIVED), AI detection scores and `content_verdict`

## Quick Setup

```bash
# 1) Open the project root
cd Aletheia

# 2) Install all dependencies
npm run install:all

# 3) Create env files
cp .env.example backend-1/.env
cp .env.example backend-2/.env
cp .env.example frontend/.env.local
cp .env.example image-analyzer/.env

# 4) Fill in your API keys in the .env files
# 5) Start everything (backend-1, backend-2, frontend, image-analyzer)
npm run dev
```

## API Keys

| Key | Where to get it | Used by |
|-----|-----------------|---------|
| `REGOLO_API_KEY` | [dashboard.regolo.ai](https://dashboard.regolo.ai) | backend-1, backend-2 |
| `SERPER_API_KEY` | [serper.dev](https://serper.dev) | backend-1, backend-2, image-analyzer (reverse image search) |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) | frontend (`/api/speak`) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | backend-1 fallback, image-analyzer |
| `GEMINI_API_KEY` | Google AI Studio | image-analyzer (optional cross-check) |
| `HF_TOKEN` | Hugging Face | image-analyzer (additional classifiers) |

## Operational Notes

- `npm run dev` uses `concurrently` to start all services together.
- Backend APIs are protected by in-memory rate limiting and application-level timeouts.
- The frontend supports both plain text and URL input (content extraction via `fetch-url` API route).
- Verdict TTS output uses the ElevenLabs `eleven_multilingual_v2` model.

## Project Documentation

- `concept.md` — product vision and pitch strategy
- `STATUS.md` — service status and sync points
- `docs/` — working copies of concept, gantt, todo and prompts
