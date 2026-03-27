# Truth Engine — Stato del team

**Aggiorna questo file quando completi un sync point. Committa e pusha subito così gli altri vedono.**

---

## Backend 1 (porta 3001) — Dev 1

- [ ] `/api/analyze` è live e risponde
- [ ] Stress test (4 casi) passato — risultati calibrati

Quando `/api/analyze` è pronto, incolla qui un esempio di risposta reale:
```json
// TODO: incollare qui il JSON reale dopo Prompt 5
```

---

## Backend 2 (porta 3002) — Dev 2

- [ ] `/mutation` è live e risponde
- [ ] Self-test embeddings passato (similarity semantica funzionante)

Quando `/mutation` è pronto, incolla qui un esempio di risposta reale:
```json
// TODO: incollare qui il JSON reale dopo Prompt 7
```

---

## Frontend (porta 3000) — Dev 3

- [ ] UI con mock data completa (tutti i componenti visibili nel browser)
- [ ] Integrazione API reale completa (chiamate reali a :3001 e :3002)
- [ ] VoiceVerdict ElevenLabs funzionante

---

## Problemi aperti / blocchi

_Scrivi qui se sei bloccato su qualcosa e hai bisogno degli altri._

---

## API keys disponibili

| Key | Chi la fornisce | Chi la usa |
|-----|----------------|------------|
| `REGOLO_API_KEY` | Dev 1 la genera su dashboard.regolo.ai | Dev 1 + Dev 2 |
| `SERPER_API_KEY` | Dev 1 la genera su serper.dev | Dev 1 + Dev 2 |
| `ELEVENLABS_API_KEY` | Dev 3 la genera su elevenlabs.io | Dev 3 |
