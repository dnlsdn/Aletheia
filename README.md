# Truth Engine

> Advanced disinformation analysis system — Codemotion Rome AI Tech Week 2026

## 3 domande su ogni notizia
1. **È vero?** — Agenti AI avversariali (Prosecutor vs Defender) + Judge
2. **Come si è trasformata?** — Mutation tracking multi-fonte con similarity semantica
3. **Perché ci crediamo?** — Vulnerability Score con breakdown delle tecniche manipolative

## Architettura

| Servizio | Porta | Descrizione |
|---------|-------|-------------|
| `backend-1` | 3001 | Agenti LLM — POST `/api/analyze` |
| `backend-2` | 3002 | Mutation tracking — POST `/mutation` |
| `frontend` | 3000 | Next.js UI |

## Setup

```bash
# 1. Clona la repo
git clone <repo-url> && cd truth-engine

# 2. Installa tutte le dipendenze
npm run install:all

# 3. Crea i file .env in ogni servizio
cp .env.example backend-1/.env
cp .env.example backend-2/.env
cp .env.example frontend/.env.local
# → aggiungi le API keys nei file .env

# 4. Avvia tutto
npm run dev
```

## API keys necessarie

| Key | Dove ottenerla | Usata da |
|-----|---------------|---------|
| `REGOLO_API_KEY` | [dashboard.regolo.ai](https://dashboard.regolo.ai) | backend-1 + backend-2 |
| `SERPER_API_KEY` | [serper.dev](https://serper.dev) | backend-1 + backend-2 |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) | frontend |

## Docs

Vedi `docs/` per concept, gantt, todo list e prompt di sviluppo.
