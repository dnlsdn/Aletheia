# Truth Engine — Stato del team

**Aggiorna questo file quando completi un sync point. Committa e pusha subito così gli altri vedono.**

---

## Backend 1 (porta 3001) — Dev 1

- [x] `/api/analyze` è live e risponde
- [ ] Stress test (4 casi) passato — risultati calibrati

Esempio di risposta reale (`POST /api/analyze`, input: notizia su legge registrazione dispositivi):
```json
{
  "verdict": "FALSE",
  "confidence": 90,
  "summary": "L'articolo in questione afferma che il governo italiano ha approvato una legge che obbliga tutti i cittadini a registrare i propri dispositivi elettronici entro 30 giorni pena una multa di 5000 euro, ma dopo aver esaminato le fonti di ricerca fornite, non è stato possibile trovare alcuna conferma a questa affermazione. Le fonti suggeriscono che le notizie false sono diffuse e possono essere utilizzate per manipolare l'opinione pubblica. Pertanto, è probabile che l'articolo in questione sia falso.",
  "prosecutor_argument": "L'articolo in questione afferma che il governo italiano ha approvato una legge che obbliga tutti i cittadini a registrare i propri dispositivi elettronici entro 30 giorni pena una multa di 5000 euro. Tuttavia, dopo aver esaminato le fonti di ricerca fornite, non è stato possibile trovare alcuna conferma a questa affermazione.\n\nIn particolare, la fonte [1] https://www.ilfoglio.it/giustizia/2026/03/26/news/la-fake-news-sull-obbligo-per-l-italia-di-reintrodurre-l-abuso-d-ufficio-8837258/ parla di una \"fake news\" sull'obbligo per l'Italia di reintrodurre l'abuso d'ufficio, il che suggerisce che le notizie false sono diffuse e possono essere utilizzate per manipolare l'opinione pubblica.\n\nAnche la fonte [4] https://comunicazioneitaliana.it/news/ba983ba7e2db3a7c0ab76934ddfc2a9f menziona gli \"attacchi maldestri e pretestuosi\" con \"fake news\" contro il governo italiano, il che conferma l'esistenza di notizie false e manipolatorie.\n\nInoltre, la fonte [5] https://discrimen.it/wp-content/uploads/Guerini-Fake-news-e-diritto-penale.pdf discute del problema delle \"fake news\" e del loro impatto sul diritto penale, senza menzionare alcuna legge che obbliga i cittadini a registrare i propri dispositivi elettronici.\n\nInfine, la fonte [6] https://pagellapolitica.it/articoli/legge-bilancio-record-governo-meloni smentisce una notizia falsa sulla legge di Bilancio, il che conferma che le notizie false sono diffuse e possono essere utilizzate per manipolare l'opinione pubblica.\n\nIn conclusione, non è stato possibile trovare alcuna conferma alla affermazione dell'articolo e, anzi, le fonti di ricerca suggeriscono che le notizie false sono diffuse e possono essere utilizzate per manipolare l'opinione pubblica. Pertanto, è probabile che l'articolo in questione sia falso o, almeno, non sia supportato da prove attendibili.",
  "defender_argument": "Sfortunatamente, non sono in grado di confermare l'articolo in questione come vero e attendibile in base alle fonti di ricerca fornite. L'articolo afferma che il governo italiano ha approvato una legge che obbliga tutti i cittadini a registrare i propri dispositivi elettronici entro 30 giorni pena una multa di 5000 euro.\n\nTuttavia, nessuna delle fonti fornite supporta questa affermazione. Le fonti parlano di argomenti diversi, come l'approvazione di una legge sul registro nazionale dei lobbisti (https://www.instagram.com/p/DUNL36EDG4M/), nuove norme sulla cittadinanza italiana (https://www.governo.it/it/articolo/comunicato-stampa-del-consiglio-dei-ministri-n-121/28079, https://www.senato.it/service/PDF/PDFServer/DF/442211.pdf, https://www.gazzettaufficiale.it/eli/id/2025/03/28/25G00049/sg), e obblighi relativi al Green Pass (https://www.agendadigitale.eu/sanita/green-pass-obbligatorio-tutto-sui-nuovi-limiti-rispettata-la-costituzione/).\n\nInoltre, il documento della Camera dei Deputati (https://documenti.camera.it/leg19/dossier/pdf/AC0276c.pdf) non menziona l'obbligo di registrazione dei dispositivi elettronici.\n\nIn conclusione, non sono in grado di confermare l'articolo come vero e attendibile in base alle fonti di ricerca fornite, poiché nessuna di esse supporta l'affermazione principale dell'articolo. È possibile che l'articolo sia stato scritto in base a informazioni non verificate o che sia stato modificato in modo da non riflettere più la realtà.",
  "prosecutor_sources": [
    { "title": "La fake news sull'obbligo per l'Italia di reintrodurre l'abuso d'ufficio", "url": "https://www.ilfoglio.it/giustizia/2026/03/26/news/la-fake-news-sull-obbligo-per-l-italia-di-reintrodurre-l-abuso-d-ufficio-8837258/", "snippet": "La fake news sull'obbligo per l'Italia di reintrodurre l'abuso d'ufficio · Ermes Antonucci · Classe 1991, abruzzese d'origine e romano d'adozione." },
    { "title": "Riforma della Giustizia, Cittadino Zero smonta un'altra fake news.", "url": "https://www.facebook.com/legasalvinipremier/posts/riforma-della-giustizia-cittadino-zero-smonta-unaltra-fake-news/1492999505515070/", "snippet": "Riforma della Giustizia, Cittadino Zero smonta un'altra fake news. ; Francesco Scorza. Mauro Alexandro Gandini ; Massimiliano De Paolis. I giudici ..." },
    { "title": "Riforma della Giustizia, Cittadino Zero smonta un'altra fake news.", "url": "https://www.facebook.com/legasalvinipremier/videos/riforma-della-giustizia-cittadino-zero-smonta-unaltra-fake-news/1506998554161589/", "snippet": "Riforma della Giustizia, Cittadino Zero smonta un'altra fake news ... Fratelli d'Italia Senato. 󱢏. Political Organization. No photo ..." },
    { "title": "Fake news per attaccare governo italiano - Comunicazione Italiana", "url": "https://comunicazioneitaliana.it/news/ba983ba7e2db3a7c0ab76934ddfc2a9f", "snippet": "\"Attacchi maldestri e pretestuosi\" con \"fake news\" contro il governo italiano dopo la Relazione annuale sullo stato di diritto dell'Unione europea." },
    { "title": "[PDF] Fake News e diritto penale - Discrimen", "url": "https://discrimen.it/wp-content/uploads/Guerini-Fake-news-e-diritto-penale.pdf", "snippet": "un regime politico ascrivibile alla democrazia autoritaria122, ha ap- provato una legge che criminalizza la diffusione di informazioni false online. La ..." },
    { "title": "Falso: la legge di Bilancio non è stata approvata in tempi record", "url": "https://pagellapolitica.it/articoli/legge-bilancio-record-governo-meloni", "snippet": "Falso: la legge di Bilancio non è stata approvata in tempi record. 09 ... Al terzo posto c'è la legge di Bilancio per il 2008, presentata dal ..." }
  ],
  "defender_sources": [
    { "title": "Dopo anni di tentativi falliti, la Camera ha approvato una legge che ...", "url": "https://www.instagram.com/p/DUNL36EDG4M/", "snippet": "Dopo anni di tentativi falliti, la Camera ha approvato una legge che introduce un registro nazionale dei lobbisti, una novità rilevante per ..." },
    { "title": "Comunicato stampa del Consiglio dei Ministri n. 121 | www.governo.it", "url": "https://www.governo.it/it/articolo/comunicato-stampa-del-consiglio-dei-ministri-n-121/28079", "snippet": "Le nuove norme prevedono che i discendenti di cittadini italiani, nati all'estero, saranno automaticamente cittadini solo per due generazioni: ..." },
    { "title": "[PDF] Senato della Repubblica - DISEGNO DI LEGGE", "url": "https://www.senato.it/service/PDF/PDFServer/DF/442211.pdf", "snippet": "Il presente decreto-legge introduce disposizioni urgenti in materia di cittadinanza italiana iure sanguinis. A distanza di oltre 30 anni ..." },
    { "title": "DECRETO-LEGGE 28 marzo 2025, n. 36 - Gazzetta Ufficiale", "url": "https://www.gazzettaufficiale.it/eli/id/2025/03/28/25G00049/sg", "snippet": "DECRETO-LEGGE 28 marzo 2025, n. 36. Disposizioni urgenti in materia di cittadinanza. (25G00049) (GU Serie Generale n.73 del 28-03-2025)." },
    { "title": "[PDF] 19 novembre 2025 - Camera dei Deputati", "url": "https://documenti.camera.it/leg19/dossier/pdf/AC0276c.pdf", "snippet": "282 del 2013 ha stabilito che la legge regionale oggetto della sentenza che comportava l'obbligo di iscrizione nell'albo della Regione in ..." },
    { "title": "Obbligo Green pass in Italia, le novità sul filo della costituzione", "url": "https://www.agendadigitale.eu/sanita/green-pass-obbligatorio-tutto-sui-nuovi-limiti-rispettata-la-costituzione/", "snippet": "Il Decreto Legge n. 111 del 6 agosto aggiunge obblighi per scuola, università, mezzi di trasporto. Per la prima volta ci sono anche obblighi per dipendenti, ..." }
  ],
  "prosecutor_points": [
    "le fonti di ricerca non confermano l'obbligo di registrazione dei dispositivi elettronici",
    "le fonti suggeriscono che le notizie false sono diffuse e possono essere utilizzate per manipolare l'opinione pubblica"
  ],
  "defender_points": [
    "nessuna delle fonti fornite supporta l'affermazione principale dell'articolo",
    "il documento della Camera dei Deputati non menziona l'obbligo di registrazione dei dispositivi elettronici"
  ]
}
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
