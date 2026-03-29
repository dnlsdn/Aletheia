# ALETHE-IA

> Disinformation analysis platform — Codemotion Rome AI Tech Week 2026

ALETHE-IA analizza una notizia su tre assi in parallelo:
1. **È vero?** — dibattito AI avversariale (Prosecutor vs Defender) con Judge finale
2. **Come si è trasformata?** — mutation tracking multi-fonte con similarità semantica
3. **Perché ci crediamo?** — punteggi di vulnerabilità retorica e rischio di viralità

## Architettura

| Servizio | Porta | Responsabilità |
|---------|-------|----------------|
| `backend-1` | `3001` | Fact-check avversariale (`POST /api/analyze`) |
| `backend-2` | `3002` | Mutation tracking + virality (`POST /mutation`) |
| `frontend` | `3000` | UI Next.js + integrazione API + TTS ElevenLabs |
| `image-analyzer` | `3003+` | Analisi immagini AI/derivate (`POST /api/analyze-image`) |

## Endpoint principali

### Backend 1 — `POST http://localhost:3001/api/analyze`
- Input: testo notizia
- Output: `verdict`, `confidence`, `summary`, argomenti prosecutor/defender, fonti, punti chiave, `confidence_timeline`

### Backend 2 — `POST http://localhost:3002/mutation`
- Input: testo notizia (`text`) + opzionale `sourceUrl`
- Output: `versions` con `similarity`/`mutationScore`/`credibility`, `graph`, `viralityRisk`

### Image Analyzer — `POST http://localhost:3003/api/analyze-image`
- Input: multipart form-data con campo `image`
- Output: `image_verdict` (REAL_ORIGINAL o FAKE_OR_DERIVED), punteggi AI detection e `content_verdict`

## Setup rapido

```bash
# 1) Apri la root del progetto
cd Aletheia

# 2) Installa tutte le dipendenze
npm run install:all

# 3) Crea i file env
cp .env.example backend-1/.env
cp .env.example backend-2/.env
cp .env.example frontend/.env.local
cp .env.example image-analyzer/.env

# 4) Inserisci le chiavi API nei file .env
# 5) Avvia tutto (backend-1, backend-2, frontend, image-analyzer)
npm run dev
```

## API keys

| Key | Dove ottenerla | Usata da |
|-----|-----------------|---------|
| `REGOLO_API_KEY` | [dashboard.regolo.ai](https://dashboard.regolo.ai) | backend-1, backend-2 |
| `SERPER_API_KEY` | [serper.dev](https://serper.dev) | backend-1, backend-2, image-analyzer (reverse image search) |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) | frontend (`/api/speak`) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | backend-1 fallback, image-analyzer |
| `GEMINI_API_KEY` | Google AI Studio | image-analyzer (cross-check opzionale) |
| `HF_TOKEN` | Hugging Face | image-analyzer (classifier aggiuntivi) |

## Note operative

- `npm run dev` usa `concurrently` per avviare tutti i servizi insieme.
- Le API backend sono protette da rate limit in-memory e timeout applicativi.
- Il frontend supporta input testo e URL (estrazione contenuto via API route `fetch-url`).
- L'output TTS del verdetto usa il modello ElevenLabs `eleven_multilingual_v2`.

## Documentazione progetto

- `concept.md` — visione prodotto e strategia pitch
- `STATUS.md` — stato servizi/sync point
- `docs/` — copie operative di concept, gantt, todo e prompt
