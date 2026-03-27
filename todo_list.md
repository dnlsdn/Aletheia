## Setup iniziale — Tutto il team

- [ ]  Creare repo GitHub con struttura monorepo (frontend/, backend/, docs/)
- [ ]  Configurare variabili d'ambiente (.env): chiavi API Anthropic, Serper/Tavily, etc.
- [ ]  Definire stack definitivo: Next.js + FastAPI o tutto Node — decidere subito
- [ ]  Scegliere il motore di web search: Serper API, Tavily, o Brave Search API
- [ ]  Configurare deployment veloce (Vercel per frontend, Railway/Render per backend)

## Dev 1 — Pipeline agenti & verdetto

- [ ]  Implementare Agent Prosecutor: cerca fonti che smentiscono la notizia via web search
- [ ]  Implementare Agent Defender: cerca fonti che confermano la notizia via web search
- [ ]  Implementare Judge Agent: legge il dibattito e produce verdetto motivato con confidence score
- [ ]  Gestire orchestrazione parallela dei tre agenti (async/await, timeout handling)
- [ ]  Implementare classificazione 5 categorie: VERIFICATO / PARZIALMENTE VERO / INCONCLUDENTE / FUORVIANTE / FALSO
- [ ]  Endpoint POST /analyze che accetta URL o testo grezzo e restituisce risultato strutturato
- [ ]  Aggiungere deduplication delle fonti trovate dai due agenti
- [ ]  Gestione errori: cosa fare se web search non trova nulla o le fonti sono irraggiungibili

## Dev 2 — Mutation tracking & Source Graph

- [ ]  Recuperare versioni multiple della notizia da fonti diverse con web search multi-query
- [ ]  Identificare la fonte primaria (più autorevole o più antica trovata)
- [ ]  Calcolare semantic similarity tra ogni versione e la fonte primaria (cosine similarity su embeddings)
- [ ]  Produrre Mutation Score: 0 = identico all'originale, 100 = completamente alterato
- [ ]  Costruire Source Credibility Graph: nodi = fonti, archi = "ha ripreso da"
- [ ]  Assegnare credibilità a ogni nodo (verde/giallo/rosso) basata su dominio, HTTPS, presenza redazione, etc.
- [ ]  Esporre dati del grafo come JSON (nodes[], edges[]) per il frontend
- [ ]  Implementare Virality Risk Score: formula euristica su emotional loading + brevità + pattern fonti
- [ ]  Endpoint /mutation che restituisce source graph + mutation score + virality risk

## Dev 3 — Frontend & Vulnerability Score

- [ ]  Implementare Vulnerability Score con breakdown per categoria (urgency, tribal, emotional, cherry-pick, authority, no-sources)
- [ ]  Costruire pagina principale: input URL/testo + bottone analizza
- [ ]  Componente risultato: badge verdetto colorato + confidence score
- [ ]  Componente reasoning: mostrare il dibattito Prosecutor vs Defender con fonti citate
- [ ]  Componente Vulnerability Score: barra breakdown con etichette per ogni tecnica trovata
- [ ]  Componente Source Graph: visualizzazione interattiva con vis.js o D3 (nodi colorati, archi)
- [ ]  Componente Mutation Timeline: curva discendente da fonte primaria alle versioni successive
- [ ]  Componente Virality Risk: numero grande + frase "se fosse falsa, in X ore..."
- [ ]  Loading state durante l'analisi (streaming o polling con progress indicator)
- [ ]  Responsive e leggibile da proiettore (font grandi, contrasto alto per la demo)

## Preparazione demo

- [ ]  Caso 1: trovare notizia italiana falsa con alta mutazione — testare e verificare output
- [ ]  Caso 2: trovare notizia vera ma con Vulnerability Score alto — testare e verificare output
- [ ]  Caso 3: trovare notizia inconcludente — testare e verificare che il sistema dica "non lo so"
- [ ]  Caso 4 (live): trovare notizia fresca sabato mattina — analizzarla overnight per la demo domenica
- [ ]  Fare un dry-run completo del pitch con demo in meno di 2 minuti
- [ ]  Preparare fallback: screenshot/gif pre-registrati in caso di problemi di rete durante la demo

## Pitch & presentazione

- [ ]  Preparare slide di apertura: le tre domande + dati 59% italiani / 1 su 3 giovani
- [ ]  Preparare slide architettura tecnica semplificata (per la giuria tecnica)
- [ ]  Preparare slide angolo Rheinmetall: information warfare, virality risk come minaccia strategica
- [ ]  Allenare transizione fluida da slide a demo live e ritorno
- [ ]  Preparare risposta a "come calcolate il Vulnerability Score?" (mostrare tabella breakdown)
- [ ]  Preparare risposta a "e se il modello allucina?" (mostrare che cita solo fonti reali trovate)