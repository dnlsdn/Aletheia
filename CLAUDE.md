# Truth Engine — Contesto del progetto

> **Se usi Claude**: questo file viene letto automaticamente. Non devi fare nulla.
> **Se usi Antigravity o altro AI**: incolla l'intero contenuto di questo file come **primo messaggio** prima di iniziare a lavorare sui prompt del tuo file `lista_prompt/dev_X_prompts.md`.

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

## JSON contracts (contratti fissi tra i 3 servizi)

Non modificare questi contratti senza sincronizzarsi con tutti e tre i dev.

### Backend 1 → Frontend: `POST http://localhost:3001/api/analyze`
```json
{
  "verdict": "VERIFIED | PARTIALLY_TRUE | INCONCLUSIVE | MISLEADING | FALSE",
  "confidence": 78,
  "summary": "Spiegazione del verdetto in 2-3 frasi.",
  "prosecutor_argument": "Testo completo dell'argomento contro la notizia.",
  "defender_argument": "Testo completo dell'argomento a favore della notizia.",
  "prosecutor_sources": [{ "title": "...", "url": "...", "snippet": "..." }],
  "defender_sources": [{ "title": "...", "url": "...", "snippet": "..." }],
  "prosecutor_points": ["punto chiave 1", "punto chiave 2"],
  "defender_points": ["punto chiave 1", "punto chiave 2"]
}
```

### Backend 2 → Frontend: `POST http://localhost:3002/mutation`
```json
{
  "versions": [
    {
      "title": "Titolo articolo",
      "url": "https://...",
      "domain": "ansa.it",
      "snippet": "Estratto breve",
      "similarity": 0.94,
      "mutationScore": 6,
      "isSource": true,
      "credibility": { "score": 92, "level": "high", "color": "#1D9E75" }
    }
  ],
  "graph": {
    "nodes": [{ "id": 1, "label": "ansa.it", "color": "#1D9E75", "size": 30, "credibilityScore": 92 }],
    "edges": [{ "from": 1, "to": 2, "label": "republished by", "arrows": "to" }]
  },
  "viralityRisk": {
    "score": 65,
    "label": "High risk — rapid spread likely before a debunk can contain it",
    "breakdown": { "shortMessage": 20, "urgencyWords": 15, "emotionalWords": 10, "manyVersions": 20, "lowCredibilitySources": 0 }
  }
}
```

## Memoria delle sessioni precedenti

- `.agent/skills/SKILL.md` — log aggiornato dopo ogni prompt completato da tutti e 3 i dev. Se esiste, leggilo per sapere cosa è già stato costruito prima di iniziare a lavorare.
- `STATUS.md` — stato dei sync point: quali backend sono live, esempi JSON reali.

## Note importanti

- I prompt in `lista_prompt/` sono progettati per **Google Antigravity** (vibecoding — ogni prompt va incollato e lasciato girare prima di passare al successivo)
- I 5 verdetti sono: `VERIFIED`, `PARTIALLY_TRUE`, `INCONCLUSIVE`, `MISLEADING`, `FALSE`
- Target audience per il pitch: **istituzioni, intelligence, difesa** — non utenti consumer
- Mockdata completo in `dev_3_prompts.md` Prompt 1 — il frontend è sviluppato in anticipo rispetto ai backend
- I SYNC POINT nei file prompt indicano quando un dev deve comunicare agli altri che il suo endpoint è live
