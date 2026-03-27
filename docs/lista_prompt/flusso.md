## Come funziona il flusso

- **Step 0** è uguale per tutti — i primi 30 minuti li passate insieme a scambiarvi i JSON contract. Dev 3 riceve i formati da Dev 1 e Dev 2, li mette nel mock data, e poi lavora completamente in autonomia per le prime 5-6 ore.
- **Dev 1 e Dev 2** lavorano in parallelo senza mai bloccarsi a vicenda. L'unica dipendenza tra loro è che alla fine Dev 3 ha bisogno che entrambi abbiano i backend attivi.
- I **sync point espliciti** sono due: Dev 1 manda un messaggio a Dev 3 quando il Prompt 5 funziona (porta il backend live), stessa cosa Dev 2 con il suo Prompt 7. Dev 3 aspetta entrambi i messaggi prima di fare il Prompt 8 (integrazione reale).
- **Dev 3** non si blocca mai in attesa — costruisce tutta la UI con i mock data, e solo nell'ultimo blocco swappa con le chiamate reali.

---

## Routine per ogni prompt (tutti e 3 i dev)

Per ogni prompt, il ciclo è:
1. Incolla il prompt in Antigravity (o invia a Claude)
2. Leggi il piano che genera — approvalo solo se ha senso
3. Lascialo eseguire
4. Verifica che funzioni (curl test o verifica nel browser)
5. **Invia il contenuto di `lista_prompt/update_antigravity.md`** — questo aggiorna `.agent/skills/SKILL.md`, il log di memoria dell'AI per le sessioni successive
6. Passa al prompt successivo

Se riapri una sessione dopo una pausa, incolla sempre nell'ordine:
1. `CLAUDE.md` (contesto progetto)
2. `.agent/skills/SKILL.md` (log di cosa è già stato costruito)

---

## Git workflow (repo condiviso)

I tre dev lavorano in cartelle completamente separate — nessun conflitto possibile se ognuno resta nella propria:

| Dev | Cartella di lavoro |
|-----|-------------------|
| Dev 1 (backend agenti) | `/backend1/` |
| Dev 2 (mutation tracking) | `/backend2/` |
| Dev 3 (frontend) | `/frontend/` |

**Regola semplice**: commit e push su `main` dopo ogni prompt che funziona. Non serve branching — le cartelle sono separate.

Commit message consigliato: `dev1: prompt 3 - prosecutor + defender agents done`

Dopo ogni push: gli altri due vedono le modifiche con `git pull`.

**Cosa committare e cosa NO:**
- ✅ Tutto il codice sorgente
- ✅ `STATUS.md` aggiornato ai sync point
- ✅ `.agent/skills/SKILL.md` aggiornato
- ❌ `.env` (contiene API keys — aggiunto al .gitignore da Prompt 1)

---

## Sync point — cosa fare esattamente

**Dev 1 quando Prompt 5 è live:**
1. Aggiorna `STATUS.md`: metti ✅ su "Backend 1 /api/analyze è live"
2. Incolla nel STATUS.md un esempio di risposta JSON reale
3. Committa e pusha
4. Manda messaggio a Dev 3: "backend 1 live, ho pushato su STATUS.md"

**Dev 2 quando Prompt 7 è live:**
1. Aggiorna `STATUS.md`: metti ✅ su "Backend 2 /mutation è live"
2. Incolla nel STATUS.md un esempio di risposta JSON reale
3. Committa e pusha
4. Manda messaggio a Dev 3: "backend 2 live, ho pushato su STATUS.md"

**Dev 3 quando riceve entrambe le conferme:**
1. Fa `git pull`
2. Legge gli esempi JSON reali da STATUS.md
3. Aggiorna `mockData.js` con i dati reali (per sicurezza)
4. Procede con Prompt 8 (integrazione API reale)
