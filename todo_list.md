## Setup iniziale — Tutto il team

- [ ]  Creare repo GitHub con struttura monorepo (frontend/, backend/, docs/)
- [ ]  Configurare variabili d'ambiente (.env): chiavi API **Regolo.ai**, Serper, **ElevenLabs**
- [x]  Definire stack definitivo: Next.js + Node.js (3 servizi separati — vedi gantt.md)
- [x]  Scegliere il motore di web search: Serper API (google.serper.dev — già scelto)
- [ ]  Configurare deployment veloce (Vercel per frontend, Railway/Render per backend)
- [ ]  **Registrarsi su Regolo.ai** (https://dashboard.regolo.ai) e generare API key — necessario per Dev 1 e Dev 2
- [ ]  **Registrarsi su ElevenLabs** e generare API key — necessario per Dev 3

## Dev 1 — Pipeline agenti & verdetto (LLM: Regolo.ai)

- [ ]  Implementare Agent Prosecutor via **Regolo.ai** (Llama-3.3-70B-Instruct): cerca fonti che smentiscono
- [ ]  Implementare Agent Defender via **Regolo.ai**: cerca fonti che confermano la notizia
- [ ]  Implementare Judge Agent via **Regolo.ai**: verdetto motivato con confidence score
- [ ]  Gestire orchestrazione parallela dei tre agenti (async/await, timeout handling)
- [ ]  Implementare classificazione 5 categorie: VERIFICATO / PARZIALMENTE VERO / INCONCLUDENTE / FUORVIANTE / FALSO
- [ ]  Endpoint POST /api/analyze che restituisce risultato strutturato (porta 3001)
- [ ]  Gestione errori: cosa fare se web search non trova nulla o le fonti sono irraggiungibili

## Dev 2 — Mutation tracking & Source Graph (embeddings: Regolo.ai)

- [ ]  Recuperare versioni multiple della notizia da fonti diverse con web search multi-query
- [ ]  Identificare la fonte primaria (più autorevole o più antica trovata)
- [ ]  Calcolare semantic similarity tramite **embeddings Regolo.ai** (più accurata di TF-IDF keyword)
- [ ]  Produrre Mutation Score: 0 = identico all'originale, 100 = completamente alterato
- [ ]  Costruire Source Credibility Graph: nodi = fonti, archi = "ha ripreso da"
- [ ]  Assegnare credibilità a ogni nodo (verde/giallo/rosso) basata su dominio
- [ ]  Esporre dati del grafo come JSON (nodes[], edges[]) per il frontend
- [ ]  Implementare Virality Risk Score: formula euristica su emotional loading + brevità + pattern fonti
- [ ]  Endpoint POST /mutation (porta 3002) che restituisce source graph + mutation score + virality risk

## Dev 3 — Frontend & Vulnerability Score (TTS: ElevenLabs)

- [ ]  Implementare Vulnerability Score con breakdown per categoria (urgency, tribal, emotional, cherry-pick, authority, no-sources)
- [ ]  Costruire pagina principale: input URL/testo + bottone analizza
- [ ]  Componente risultato: badge verdetto colorato + confidence score
- [ ]  Componente reasoning: sezione "Full debate" collassabile con testo completo Prosecutor/Defender e fonti linkate (→ Prompt 3 VerdictCard)
- [ ]  Componente Vulnerability Score: barra breakdown con etichette per ogni tecnica trovata
- [ ]  Componente Source Graph: visualizzazione interattiva vis-network (nodi colorati, archi)
- [ ]  Componente Mutation Timeline: curva discendente da fonte primaria alle versioni successive
- [ ]  Componente Virality Risk: numero grande + breakdown componenti
- [ ]  **VoiceVerdict**: pulsante "Ascolta il verdetto" che chiama **ElevenLabs** via API route Next.js — legge il summary in italiano con voce AI (eleven_multilingual_v2)
- [ ]  Loading state durante l'analisi con messaggi ciclici (già definiti in Prompt 8)
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
- [ ]  Preparare slide architettura tecnica semplificata (per la giuria tecnica) — includere loghi Regolo.ai ed ElevenLabs
- [ ]  Preparare slide angolo Rheinmetall: information warfare + **privacy-first con Regolo.ai EU-hosted**
- [ ]  Allenare transizione fluida da slide a demo live e ritorno
- [ ]  **Includere nel momento demo**: cliccare "Ascolta il verdetto" — la voce ElevenLabs legge il risultato in italiano (massimo impatto)
- [ ]  Preparare risposta a "come calcolate il Vulnerability Score?" (mostrare tabella breakdown)
- [ ]  Preparare risposta a "e se il modello allucina?" (mostrare che cita solo fonti reali trovate)
- [ ]  Preparare risposta a "perché Regolo.ai e non ChatGPT/Claude?" (zero data retention, EU-hosted, GDPR nativo)