# Truth Engine — Contesto per Claude

## Il progetto

Sistema avanzato di analisi della disinformazione per l'hackathon **Codemotion Rome AI Tech Week 2026** (28-29 marzo), challenge "Truth Engine" proposta da **Rheinmetall** (€2.500 in prize).

Il sistema risponde a tre domande simultanee su una notizia:
1. **È vero?** — Agenti AI avversariali (Prosecutor vs Defender) + Judge
2. **Come si è trasformata?** — Mutation tracking multi-fonte con similarity semantica
3. **Perché ci crediamo?** — Vulnerability Score con breakdown delle tecniche manipolative

## Architettura (3 servizi, sviluppati in parallelo)

| Servizio | Porta | File prompt | Responsabilità |
|---------|-------|-------------|----------------|
| Backend 1 | 3001 | `lista_prompt/dev_1_prompts.md` | Agenti AI, verdetto `/api/analyze` |
| Backend 2 | 3002 | `lista_prompt/dev_2_prompts.md` | Mutation tracking, source graph `/mutation` |
| Frontend | 3000 | `lista_prompt/dev_3_prompts.md` | Next.js UI, Vulnerability Score |

## Partner tecnici integrati (sponsor hackathon)

### Regolo.ai (Dev 1 + Dev 2)
- **Cosa fa**: LLM inference EU-based, zero data retention, GDPR-compliant, datacenter italiano
- **Dove usato**: Dev 1 — agenti Prosecutor/Defender/Judge (OpenAI-compatible API, modello `Llama-3.3-70B-Instruct`); Dev 2 — embeddings semantici per mutation tracking
- **Angolo pitch**: "Privacy-first per contesti difesa/intelligence" — critico per Rheinmetall
- **API base URL**: `https://api.regolo.ai/v1`
- **Auth**: `Authorization: Bearer $REGOLO_API_KEY`
- **Endpoint chat**: `POST /chat/completions` — body OpenAI-compatible
- **Endpoint embeddings**: `POST /embeddings` — verificare nome modello nella dashboard

### ElevenLabs (Dev 3 Frontend)
- **Cosa fa**: TTS (text-to-speech) con modello multilingua
- **Dove usato**: Dev 3 — pulsante "Ascolta il verdetto" che legge il summary con voce AI
- **Angolo demo**: momento impattante durante il pitch — la voce annuncia il verdetto
- **API**: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` via API route Next.js
- **Modello**: `eleven_multilingual_v2` (supporta italiano)
- **Auth**: `xi-api-key: $ELEVENLABS_API_KEY`

## Stack completo

- **Backend 1 & 2**: Node.js, Express, dotenv, axios, cors
- **LLM**: Regolo.ai (Llama-3.3-70B-Instruct, OpenAI-compatible)
- **Web search**: Serper API (`https://google.serper.dev/search`, `gl:"it"`, `hl:"it"`)
- **Frontend**: Next.js, Tailwind CSS, recharts (charts), vis-network (grafi)
- **TTS**: ElevenLabs (`eleven_multilingual_v2`)

## File chiave

- `concept.md` — documento strategico completo (pitch, differenziatori, casi demo)
- `todo_list.md` — checklist task per fase hackathon
- `gantt.md` — timeline 36 ore (Sab 10:00 → Dom 13:00)
- `lista_prompt/dev_1_prompts.md` — 7 prompt vibecoding per Backend 1
- `lista_prompt/dev_2_prompts.md` — 8 prompt vibecoding per Backend 2
- `lista_prompt/dev_3_prompts.md` — 10 prompt vibecoding per Frontend
- `lista_prompt/flusso.md` — coordinate tra i 3 dev
- `lista_prompt/update_antigravity.md` — istruzioni per Google Antigravity

## Note importanti

- I prompt in `lista_prompt/` sono progettati per **Google Antigravity** (vibecoding — ogni prompt va incollato e lasciato girare prima di passare al successivo)
- Il **JSON contract** tra i 3 dev è fisso e documentato in ogni prompt file — non va cambiato senza sincronizzare tutti
- I 5 verdetti sono: `VERIFIED`, `PARTIALLY_TRUE`, `INCONCLUSIVE`, `MISLEADING`, `FALSE`
- Target audience per il pitch: **istituzioni, intelligence, difesa** — non utenti consumer
- Mockdata completo in `dev_3_prompts.md` Prompt 1 — il frontend è sviluppato in anticipo rispetto ai backend
