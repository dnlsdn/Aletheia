## Stato setup iniziale

- [x] Creare repo GitHub con struttura monorepo (backend-1/, backend-2/, frontend/, docs/)
- [x] Configurare variabili d'ambiente: REGOLO_API_KEY, SERPER_API_KEY (backend-1/.env, backend-2/.env)
- [x] ELEVENLABS_API_KEY in frontend/.env.local
- [x] Definire stack: Next.js + Node.js (3 servizi separati)
- [x] Serper API scelto come motore di web search
- [x] `npm run install:all` eseguito — tutte le dipendenze installate
- [ ] Deployment (Vercel + Railway/Render) — da fare DOPO che tutto funziona in locale

---

## Cosa è già stato scaffoldato da Claude (Step 0)

> Non serve eseguire i Prompt 1 di nessun dev — lo scaffold è già fatto.

| Servizio | Cosa esiste già |
|---------|----------------|
| `backend-1/` | `src/server.js` (Express su 3001, /health, POST /api/analyze stub), package.json, .env con keys |
| `backend-2/` | `src/server.js` (Express su 3002, /health, POST /mutation stub), package.json, .env con keys |
| `frontend/` | Next.js + Tailwind + recharts + vis-network installati, App Router scaffold, .env.local con ElevenLabs key |

**→ Tutti e 3 i Prompt 1 sono SALTATI. Parti dal Prompt 2 di ogni dev.**

---

## Ordine di esecuzione consigliato

### Perché questo ordine?
Dev 3 (frontend) prima perché non ha bisogno di API keys o backend attivi — costruisce tutto con mock data e dà una UI completa da mostrare subito. Dev 1 e Dev 2 si fanno dopo in sequenza (sono lo stesso dev). L'integrazione reale (Dev 3 Prompt 8) si sblocca solo quando entrambi i backend sono live.

---

### FASE 1 — Frontend con mock data (Dev 3, Prompt 2→7)
*Nessuna dipendenza. Parte subito. Risultato: UI completa visibile nel browser.*

> File di riferimento: `docs/lista_prompt/dev_3_prompts.md`

- [x] **Dev 3 — Prompt 1** *(adattato)*: creare solo `src/lib/mockData.js` con `mockAnalysis` e `mockMutation`
      → il resto del setup è già fatto, non serve ricreare il progetto Next.js
- [x] **Dev 3 — Prompt 2**: main page layout + textarea + bottone Analyze (mock delay 1500ms)
- [x] **Dev 3 — Prompt 3**: componente `VerdictCard` (badge, confidence bar, full debate collapsibile)
- [x] **Dev 3 — Prompt 4**: componente `VulnerabilityScore` (calcolato lato client dal testo)
- [x] **Dev 3 — Prompt 5**: componente `MutationTimeline` (recharts line chart)
- [x] **Dev 3 — Prompt 6**: componente `SourceGraph` (vis-network, usa `'use client'`)
- [x] **Dev 3 — Prompt 7**: componente `ViralityRisk` (score grande + breakdown)

**✅ CHECKPOINT FASE 1**: `npm run fe` → apri browser su localhost:3000 → clicca Analyze → tutti i componenti visibili con mock data.

---

### FASE 2 — Backend 1: agenti LLM (Dev 1, Prompt 2→7)
*Dipendenza: REGOLO_API_KEY e SERPER_API_KEY (già in .env). Prompt 1 già fatto.*

> File di riferimento: `docs/lista_prompt/dev_1_prompts.md`

- [x] **Dev 1 — Prompt 2**: `src/utils/search.js` — utility Serper + self-test
      → verifica: `node src/utils/search.js` stampa risultati reali
- [x] **Dev 1 — Prompt 3**: `src/agents/debate.js` — `runProsecutor` + `runDefender` via Regolo.ai
- [x] **Dev 1 — Prompt 4**: aggiungere `runJudge` a `debate.js` — risposta JSON con fallback
- [x] **Dev 1 — Prompt 5**: `src/routes/analyze.js` — pipeline completa `POST /api/analyze`
      → verifica con curl (vedi sotto)
- [x] **Dev 1 — Prompt 6**: `src/scripts/runTests.js` — stress test 4 casi, calibrazione Judge
- [x] **Dev 1 — Prompt 7**: hardening — timeout 30s, rate limit, logging, CORS

**✅ CHECKPOINT FASE 2**:
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "BREAKING: Scienziati italiani hanno dimostrato che il 5G causa perdita di memoria."}'
```
→ risposta JSON con `verdict`, `confidence`, `summary`, argomenti, fonti.
→ Aggiornare `STATUS.md` con ✅ e incollare esempio JSON reale.

---

### FASE 3 — Backend 2: mutation tracking (Dev 2, Prompt 2→8)
*Dipendenza: REGOLO_API_KEY e SERPER_API_KEY (già in .env). Prompt 1 già fatto.*

> File di riferimento: `docs/lista_prompt/dev_2_prompts.md`

- [x] **Dev 2 — Prompt 2**: `src/utils/search.js` + `src/utils/multisource.js` — 3 query parallele + dedup
      → verifica: `node src/utils/multisource.js` stampa domini trovati
- [x] **Dev 2 — Prompt 3**: `src/utils/similarity.js` (embeddings Regolo.ai + fallback word-overlap) + `src/utils/mutation.js`
      → verifica: self-test similarity semantica
- [x] **Dev 2 — Prompt 4**: `src/utils/credibility.js` — score per dominio (high/medium/low)
- [x] **Dev 2 — Prompt 5**: `src/utils/graph.js` — grafo vis-network compatible
- [x] **Dev 2 — Prompt 6**: `src/utils/virality.js` — Virality Risk Score euristico
- [x] **Dev 2 — Prompt 7**: `src/routes/mutation.js` — pipeline completa `POST /mutation`
      → verifica con curl (vedi sotto)
- [x] **Dev 2 — Prompt 8**: hardening — timeout 20s, rate limit, logging, CORS

**✅ CHECKPOINT FASE 3**:
```bash
curl -X POST http://localhost:3002/mutation \
  -H "Content-Type: application/json" \
  -d '{"text": "BREAKING: Scienziati italiani hanno dimostrato che il 5G causa perdita di memoria."}'
```
→ risposta JSON con `versions`, `graph`, `viralityRisk`.
→ Aggiornare `STATUS.md` con ✅ e incollare esempio JSON reale.

---

### FASE 4 — Integrazione reale + polish (Dev 3, Prompt 8→10)
*Dipendenza: entrambi i backend live (Fase 2 + Fase 3 complete).*

> File di riferimento: `docs/lista_prompt/dev_3_prompts.md`

- [x] **Dev 3 — Prompt 8**: sostituire mock data con chiamate reali a :3001 e :3002 (Promise.all)
      + loading messages ciclici + error handling
- [x] **Dev 3 — Prompt 9**: demo polish — 3 bottoni demo pre-fill, export JSON, font size, colori verdetto, footer
- [ ] **Dev 3 — Prompt 10**: `VoiceVerdict` ElevenLabs — API route `/api/speak` + componente + pulsante "Ascolta il verdetto"

**✅ CHECKPOINT FINALE**:
- `npm run dev` (avvia tutti e 3 i servizi)
- Analizza "Case 1" → verdetto FALSE/MISLEADING, grafo, voce italiana

---

## Preparazione demo

- [ ] Caso 1: notizia falsa con alta mutazione — output calibrato
- [ ] Caso 2: notizia vera ma con Vulnerability Score alto — output calibrato
- [ ] Caso 3: notizia inconcludente — il sistema dice "non lo so"
- [ ] Caso 4 (live): notizia fresca sabato mattina → analisi overnight
- [ ] Dry-run pitch completo in meno di 2 minuti
- [ ] Screenshot/gif di backup in caso di problemi di rete

---

## Pitch & presentazione

- [ ] Slide apertura: le 3 domande + dati 59% italiani / 1 su 3 giovani
- [ ] Slide architettura tecnica — loghi Regolo.ai + ElevenLabs
- [ ] Slide angolo Rheinmetall: information warfare + privacy-first EU-hosted
- [ ] Risposta pronta: "come calcolate il Vulnerability Score?"
- [ ] Risposta pronta: "e se il modello allucina?"
- [ ] Risposta pronta: "perché Regolo.ai e non ChatGPT/Claude?"

---

## Prossima conversazione — primo prompt da incollare

**→ Dev 3, Prompt 1** — copia il testo del prompt dal file `lista_prompt/dev_3_prompts.md` (sezione "Prompt 1 — Mock data") e incollalo direttamente. Il testo è già pronto e auto-contenuto.

Poi procedi in ordine: Dev 3 P2 → P3 → P4 → P5 → P6 → P7 → Dev 1 P2→P7 → Dev 2 P2→P8 → Dev 3 P8→P9→P10.
