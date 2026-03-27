> **Hackathon:** Codemotion Rome AI Tech Week — 28/29 Marzo 2026
**Challenge:** Truth Engine – combattere la disinformazione (proposta da Rheinmetall)
**Team:** 3 sviluppatori
> 

---

## Il problema reale

Il fact-checking tradizionale risponde a una domanda sbagliata: **"è vero?"**

Questa domanda, da sola, è quasi inutile. Le persone non credono alle fake news perché non hanno accesso alla verità — le credono perché le vedono **diffuse, ripetute, condivise da chi si fidano**, e perché certi testi sono costruiti appositamente per **abbassare la guardia critica** del lettore prima ancora che il cervello razionale possa intervenire.

Il risultato è che tutti i sistemi di fact-checking esistenti — da Snopes a Pagella Politica — funzionano come un dizionario: cercano se la notizia è già stata smentita da qualcuno. Se non lo è, non sanno rispondere. E non spiegano mai **perché quella notizia è credibile anche quando è falsa**.

---

## La nostra risposta: tre domande invece di una

Truth Engine non è un fact-checker. È un sistema che risponde a **tre domande insieme**, che nessuno strumento esistente affronta simultaneamente:

### Domanda 1 — È vero?

La risposta classica, ma affrontata in modo non classico: invece di un singolo modello che decide, usiamo **due agenti in conflitto** — uno che cerca attivamente prove che la notizia sia falsa, uno che cerca prove che sia vera. Il verdetto emerge dal dibattito tra i due, non da una classificazione unilaterale. Questo simula il metodo scientifico reale e produce un risultato molto più affidabile e trasparente.

### Domanda 2 — Come si è trasformata?

Le fake news raramente nascono false. Spesso partono da un fatto reale e vengono **progressivamente distorte** nel passaggio da una fonte all'altra: un titolo viene cambiato, un dato viene aggiunto senza verificarlo, il contesto viene rimosso. Il nostro sistema recupera versioni multiple della stessa notizia da fonti diverse e misura **quanto il testo si è allontanato dall'originale** nella catena di propagazione. Questa è la feature più originale del progetto: trasforma una notizia da oggetto statico a **fenomeno dinamico con una storia**.

### Domanda 3 — Perché ci crediamo?

Anche sapere che una notizia è falsa spesso non basta per smettere di crederci — o per non condividerla. Il testo di molte notizie false è costruito per sfruttare meccanismi cognitivi precisi: l'urgenza, la paura, l'identità di gruppo, l'autorità percepita. Il nostro sistema analizza il testo originale e identifica **quali tecniche di manipolazione psicologica vengono usate e perché funzionano** su quel tipo di lettore.

---

## Perché è originale

### Rispetto al fatto-checking classico

I sistemi esistenti (Snopes, Pagella Politica, [FactCheck.org](http://factcheck.org/)) sono **database di smentite**: cercano se qualcuno ha già verificato quella notizia. Non ragionano, non analizzano testi nuovi in modo autonomo, e soprattutto non spiegano il meccanismo della manipolazione.

### Rispetto agli altri team di questo hackathon

La maggior parte dei team farà la cosa ovvia: inserisci una notizia → un LLM la analizza → output vero/falso. È la soluzione più immediata e anche la più generica. Non aggiunge nulla a ciò che già esiste.

Truth Engine si differenzia su quattro assi che gli altri ignoreranno:

**Asse temporale.** La notizia non è un oggetto — è un processo. Mostrare come cambia nel tempo è qualcosa che nessun sistema di fact-checking fa oggi, e che richiede una pipeline specifica (recupero multi-fonte, confronto semantico, visualizzazione della deriva). È tecnicamente non banale e visivamente molto impattante nella demo.

**Asse psicologico.** Spiegare *perché* una notizia manipola è più utile che dire se è falsa. Un testo può essere tecnicamente vero ma costruito per generare paura irrazionale. Questo angolo cambia completamente la natura dello strumento: da "rilevatore di falsità" a "educatore al pensiero critico". È anche il punto più pertinente con il contesto della challenge ("un giovane su tre non sa riconoscere una notizia affidabile").

**Asse avversariale.** Il dibattito tra due agenti in conflitto è metodologicamente più solido di un singolo LLM che decide da solo. Riduce l'allucinazione perché ogni affermazione deve resistere all'attacco dell'agente opposto. Il reasoning è visibile, motivato, e difendibile davanti alla giuria.

**Asse strategico.** Un quarto modulo valuta il **rischio di viralità** della notizia — quanto è costruita per diffondersi prima che qualcuno possa smentirla. Questo è il linguaggio che Rheinmetall capisce: non basta sapere se una notizia è falsa, bisogna sapere quanto velocemente può fare danno.

---

## Come funziona — in parole semplici

L'utente incolla una notizia o un URL. Il sistema fa girare in parallelo cinque analisi:

**Il dibattito avversariale.** Due agenti AI cercano fonti reali su internet: uno cerca tutto ciò che smentisce la notizia, l'altro cerca tutto ciò che la conferma. Non inventano nulla — cercano e citano fonti reali. Un terzo agente (il "giudice") legge il dibattito e produce un verdetto motivato con un livello di confidenza. Il reasoning completo è visibile e consultabile.

**Il tracciamento della mutazione.** Il sistema recupera come la stessa notizia viene riportata da fonti diverse in questo momento. Confronta matematicamente quanto ogni versione si è allontanata dalla fonte primaria identificata. Il risultato è una timeline visuale: si vede esattamente su quale fonte la notizia ha iniziato a distorcersi, e di quanto.

**Il rilevamento dei bias psicologici con Vulnerability Score.** Il sistema analizza il testo originale e identifica le tecniche retoriche usate per manipolare, producendo un breakdown esplicito per categoria:

| Tecnica | Score parziale |
| --- | --- |
| Urgency framing | +25 |
| Linguaggio tribale (noi vs loro) | +20 |
| Emotional loading | +20 |
| Cherry picking di dati | +15 |
| Appello falso all'autorità | +10 |
| Assenza di fonti citate | +10 |
| **Vulnerability Score totale** | **es. 85/100** |

Un testo con score 85/100 può anche riportare fatti reali, ma usa così tante tecniche di manipolazione che il lettore medio non sarà in grado di valutarla razionalmente. Il breakdown rende il numero difendibile e comprensibile alla giuria.

**Il Source Credibility Graph.** Una visualizzazione a grafo delle fonti che riportano la notizia: ogni nodo è una fonte (colorata per credibilità stimata), ogni arco indica "ha ripreso da". In 5 secondi si vede se una notizia proviene da una fonte autorevole citata da molte altre, o da un sito anonimo amplificato artificialmente.

**Il Virality Risk Score.** Un modulo che stima quanto velocemente la notizia potrebbe diffondersi prima di essere smentita, basandosi su: carica emotiva del testo, semplicità del messaggio, e pattern di fonti noti per amplificare contenuti non verificati. Non richiede dati social in tempo reale — è un modello euristico trasparente. Esempio di output: *"Virality Risk: 78/100 — se questa notizia fosse falsa, in 4-6 ore raggiungerebbe una diffusione critica prima che la smentita possa contenerla."*

---

## Il verdetto finale

Il sistema non si limita a dire "vero" o "falso". Produce cinque categorie:

- **VERIFICATO** — le prove a favore sono solide e le fonti affidabili
- **PARZIALMENTE VERO** — contiene elementi reali ma anche distorsioni
- **INCONCLUDENTE** — le prove sono genuine su entrambi i lati, non è possibile decidere
- **FUORVIANTE** — tecnicamente non falso ma costruito per creare un'impressione sbagliata
- **FALSO** — le prove contrarie sono prevalenti e le fonti affidabili

La categoria **FUORVIANTE** è quella che distingue davvero il sistema: riconosce che una notizia può essere vera nei fatti ma manipolativa nella forma. Nessun sistema di fact-checking classico fa questa distinzione.

Un sistema che sa dire "non lo so" (INCONCLUDENTE) è più affidabile di uno che risponde sempre con certezza — e lo dimostra alla giuria.

---

## La feature più impattante nella demo

La **Mutation Timeline + Source Credibility Graph** è il momento più forte del pitch.

In 30 secondi puoi mostrare: questa notizia è partita da un articolo su un sito con redazione identificabile (nodo verde, grande). È stata ripresa da un blog anonimo che ha aggiunto un dato non verificato (nodo giallo). Il giorno successivo un sito politico ha cambiato il titolo (nodo rosso). Il grafo mostra visivamente il momento esatto in cui la rete di fonti è diventata inaffidabile.

La curva di mutazione e il grafo insieme sono immediatamente comprensibili da chiunque — non serve spiegare nulla. E dimostrano qualcosa che nessun verdetto vero/falso può dimostrare: **il momento esatto in cui una notizia ha smesso di essere giornalismo**.

---

## Divisione del lavoro (3 sviluppatori)

| Dev | Responsabilità |
| --- | --- |
| **Dev 1** | Pipeline backend: orchestrazione agenti, web search multi-fonte, aggregazione e deduplication risultati, verdetto 5 categorie |
| **Dev 2** | Semantic diff tra versioni, Source Credibility Graph (vis.js/D3), Mutation Score, Virality Risk Score |
| **Dev 3** | Frontend demo, Vulnerability Score con breakdown, pitch deck e coordinamento presentazione |

---

## Perché questo è rilevante per Rheinmetall

Rheinmetall è un'azienda della difesa. Nel contesto della difesa, la disinformazione non è solo un problema sociale — è una **minaccia strategica**. Le operazioni di information warfare, la manipolazione dell'opinione pubblica in contesti di conflitto, la diffusione di notizie false su sistemi d'arma o decisioni politiche: tutto questo richiede strumenti che vadano oltre il semplice vero/falso.

Un sistema che traccia la propagazione e la mutazione delle notizie, che identifica le tecniche di manipolazione usate, che stima il rischio di viralità prima che il danno sia fatto, e che produce un'analisi strutturata e motivata è molto più utile in contesti di intelligence e analisi strategica rispetto a un semplice classificatore binario.

Questo angolo va esplicitato nel pitch: Truth Engine non è uno strumento per i cittadini curiosi — è infrastruttura per chi ha il compito di proteggere l'integrità dell'informazione in contesti critici.

---

## Tagline per il pitch

> *"Non ti diciamo solo se è falso. Ti diciamo come è nata, come si è diffusa, e perché sei costruito per crederci."*
> 

---

## Struttura del pitch (2 minuti)

**0:00 → 0:20 — Il problema**
"Il 59% degli italiani considera la disinformazione un problema grave. Un giovane su tre non sa riconoscere una notizia affidabile. Il fact-checking classico risponde alla domanda sbagliata — e quando risponde, è già troppo tardi."

**0:20 → 0:40 — La nostra risposta**
"Truth Engine non è un fact-checker. È un sistema che risponde a tre domande: è vero? come si è trasformata? e perché sei costruito per crederci?"

**0:40 → 1:20 — Demo live**
Incolla una notizia reale — trovata questa mattina, mai vista prima. Mostra il verdetto motivato con il reasoning degli agenti. Mostra il Source Credibility Graph. Mostra il Vulnerability Score con breakdown. Mostra la curva di mutazione.

**1:20 → 1:40 — Il momento clou**
"Questa notizia ha un Virality Risk Score di 78/100. Se fosse falsa, in 4 ore avrebbe già raggiunto una diffusione critica — prima che qualsiasi smentita potesse contenerla. Questo grafo mostra esattamente il momento in cui ha smesso di essere giornalismo." (indicare il punto sul grafo)

**1:40 → 2:00 — Chiusura**
"Non stiamo costruendo un rilevatore di fake news. Stiamo costruendo uno strumento per capire come funziona la manipolazione dell'informazione — e per intercettarla prima che faccia danno. Questo è utile per chiunque: cittadini, giornalisti, istituzioni, e chi ha il compito di proteggere l'integrità dell'informazione in contesti critici."

---

## Tre casi da preparare per la demo

Prepara questi tre scenari prima del pitch — coprono angoli diversi e dimostrano la profondità del sistema:

**Caso 1 — Falso con alta mutazione**
Una notizia italiana recente che ha circolato distorta. La Mutation Timeline e il Source Credibility Graph mostreranno il percorso di degradazione in modo visivamente immediato.

**Caso 2 — Vero ma manipolativo**
Una notizia vera ma con Vulnerability Score alto e Virality Risk alto. Il momento più originale della demo: "È vero, ma guarda come è scritto per farti arrabbiare — e guarda quanto velocemente si è diffuso." Dimostra che il sistema va oltre il semplice vero/falso.

**Caso 3 — Inconcludente**
Una notizia su cui le prove sono genuine da entrambi i lati. Dimostra onestà intellettuale del sistema: non forza un verdetto quando i dati non lo permettono. Un sistema che sa dire "non lo so" è più affidabile di uno che risponde sempre con certezza.

**Nota operativa:** almeno uno dei tre casi deve essere una notizia trovata live sabato mattina e analizzata durante la notte — non preparata in anticipo. La giuria lo percepisce, e dimostra che il sistema funziona su input reali che non hai mai visto prima.

---

*Documento di concept — Truth Engine / Hackathon Codemotion Rome AI Tech Week 2026*