# Hackathon improvements — prompts to paste in new Claude Code conversations

## Execution order

Run each prompt in its own separate conversation, in this exact order:

1. **P1** — Fix FALSE color (2 min, 2 files, trivial)
2. **P2** — Sidebar cleanup + dynamic system status (5 min)
3. **P3** — Resilient backend error handling (5 min)
4. **P4** — Results metadata header (8 min)
5. **P5** — Demo mode with pre-loaded responses (15 min, most important)

---

## P1 — Fix FALSE vs MISLEADING colors

```
Working directory: /Users/danielsadun/Library/Developer/Aletheia/frontend

Make exactly two edits, nothing else.

EDIT 1 — file: src/components/VerdictCard.js

Find this exact line (line 10):
  FALSE:          { pillBg: '#ffb4ab', pillText: '#690005', accentColor: '#ff4444', label: 'False' },

Replace it with:
  FALSE:          { pillBg: '#ff4444', pillText: '#ffffff', accentColor: '#ff4444', label: 'False' },

EDIT 2 — file: src/components/VoiceVerdict.js

Find this exact line (line 18):
  FALSE:          { bg: '#ffb4ab', text: '#690005' },

Replace it with:
  FALSE:          { bg: '#ff4444', text: '#ffffff' },

Do not touch any other lines in either file.
```

---

## P2 — Sidebar cleanup + dynamic system status

```
Working directory: /Users/danielsadun/Library/Developer/Aletheia/frontend

File to edit: src/app/page.js

Make the following three changes to this file only.

--- CHANGE 1: remove inactive nav items ---

In the <nav> block (around line 142), there are four <a> elements: ANALYZE, SOURCES, ARCHIVE, SETTINGS.
Delete the three inactive ones — SOURCES, ARCHIVE, SETTINGS — leaving only the ANALYZE item.

Remove these exact lines:
          <a className="flex items-center px-[32px] py-[16px] opacity-70 cursor-pointer">
            <span className="text-[11px] tracking-[1.1px] uppercase text-[#c2c6d6]">SOURCES</span>
          </a>
          <a className="flex items-center px-[32px] py-[16px] opacity-70 cursor-pointer">
            <span className="text-[11px] tracking-[1.1px] uppercase text-[#c2c6d6]">ARCHIVE</span>
          </a>
          <a className="flex items-center px-[32px] py-[16px] opacity-70 cursor-pointer">
            <span className="text-[11px] tracking-[1.1px] uppercase text-[#c2c6d6]">SETTINGS</span>
          </a>

--- CHANGE 2: add system status state ---

At the top of the Home() component, after the existing useState/useRef declarations (after line 51),
add these two lines:

  const [systemStatus, setSystemStatus] = useState({ label: 'CHECKING...', color: '#8c909f' });
  const abortRef = useRef(null);

--- CHANGE 3: add useEffect to ping health endpoints ---

After the existing useEffect (the one for loadingInterval, ends around line 63),
add this new useEffect:

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 3000);

    Promise.allSettled([
      fetch('http://localhost:3001/health', { signal: controller.signal }),
      fetch('http://localhost:3002/health', { signal: controller.signal }),
    ]).then(([r1, r2]) => {
      clearTimeout(timeout);
      const ok1 = r1.status === 'fulfilled' && r1.value.ok;
      const ok2 = r2.status === 'fulfilled' && r2.value.ok;
      if (ok1 && ok2)       setSystemStatus({ label: 'OPERATIONAL', color: '#68dbae' });
      else if (ok1 || ok2)  setSystemStatus({ label: 'DEGRADED',    color: '#ba7517' });
      else                  setSystemStatus({ label: 'OFFLINE',     color: '#ff6b6b' });
    });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

--- CHANGE 4: use the dynamic status in the JSX ---

Find this exact block in the sidebar (around line 160):
            <div className="flex items-center gap-[8px]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#68dbae] flex-shrink-0" />
              <span className="font-mono text-[11px] text-[#68dbae]">OPERATIONAL</span>
            </div>

Replace it with:
            <div className="flex items-center gap-[8px]">
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: systemStatus.color }} />
              <span className="font-mono text-[11px]" style={{ color: systemStatus.color }}>{systemStatus.label}</span>
            </div>

Do not touch anything else in the file.
```

---

## P3 — Resilient backend error handling

```
Working directory: /Users/danielsadun/Library/Developer/Aletheia/frontend

File to edit: src/app/page.js

The handleAnalyze function uses Promise.all. If backend-2 (/mutation) fails or times out,
Promise.all rejects entirely and the user sees an error even though backend-1 succeeded.
Fix this so that a backend-2 failure shows the analysis results with a non-blocking warning.

--- CHANGE 1: add mutationWarning state ---

After the existing const [inputError, setInputError] = useState(false); line (line 48), add:
  const [mutationWarning, setMutationWarning] = useState(false);

--- CHANGE 2: rewrite the fetch block inside handleAnalyze ---

Find this entire block (lines 93–115):

    try {
      const [analysisRes, mutationRes] = await Promise.all([
        fetch('http://localhost:3001/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newsText }),
        }),
        fetch('http://localhost:3002/mutation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newsText }),
        }),
      ]);

      if (!analysisRes.ok || !mutationRes.ok) {
        throw new Error(`API error: ${analysisRes.status} / ${mutationRes.status}`);
      }

      const [analysis, mutation] = await Promise.all([
        analysisRes.json(),
        mutationRes.json(),
      ]);

      setAnalysisResult(analysis);
      setMutationResult(mutation);
      setIsLoading(false);

Replace it with:

    try {
      setMutationWarning(false);

      const [analysisSettled, mutationSettled] = await Promise.allSettled([
        fetch('http://localhost:3001/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newsText }),
        }),
        fetch('http://localhost:3002/mutation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newsText }),
        }),
      ]);

      if (analysisSettled.status === 'rejected' || !analysisSettled.value.ok) {
        throw new Error('Analysis service unavailable. Please check backend-1 (port 3001).');
      }

      const analysis = await analysisSettled.value.json();
      setAnalysisResult(analysis);

      if (mutationSettled.status === 'fulfilled' && mutationSettled.value.ok) {
        const mutation = await mutationSettled.value.json();
        setMutationResult(mutation);
      } else {
        setMutationResult(null);
        setMutationWarning(true);
      }

      setIsLoading(false);

--- CHANGE 3: show a non-blocking warning banner when mutationWarning is true ---

In the results section (the div with ref={resultsRef}, around line 257), after the VoiceVerdict
component and before the VulnerabilityScore component, add this conditional block:

                {mutationWarning && (
                  <div className="bg-[rgba(186,117,23,0.1)] border border-[rgba(186,117,23,0.3)] rounded-[6px] px-[14px] py-[10px] text-[13px] text-[#ba7517]">
                    Mutation tracking unavailable — backend-2 did not respond. Showing fact-check analysis only.
                  </div>
                )}

Do not touch anything else in the file.
```

---

## P4 — Results metadata header

```
Working directory: /Users/danielsadun/Library/Developer/Aletheia/frontend

File to edit: src/app/page.js

After an analysis completes, I want to show a small metadata bar above the results with:
- number of sources analyzed (from mutationResult.versions.length)
- elapsed analysis time in seconds
- a "REGOLO.AI · EU HOSTED" badge (sponsor callout for the pitch)

--- CHANGE 1: add analysisTime state and start-time ref ---

After the existing const resultsRef = useRef(null); line (line 50), add:
  const [analysisTime, setAnalysisTime] = useState(null);
  const analysisStartRef = useRef(null);

--- CHANGE 2: record start time at the beginning of handleAnalyze ---

Inside handleAnalyze, immediately before setIsLoading(true); (line 89), add:
  analysisStartRef.current = Date.now();

Also add setAnalysisTime(null); immediately after setAnalysisResult(null); (line 91).

--- CHANGE 3: record elapsed time after results arrive ---

Inside handleAnalyze, immediately after setMutationResult(mutation); (or after setMutationWarning(true);
in the else branch — whichever runs last), and before setIsLoading(false);, add:
  setAnalysisTime(((Date.now() - analysisStartRef.current) / 1000).toFixed(1));

--- CHANGE 4: render the metadata bar ---

In the results section (div with ref={resultsRef}), add this as the very first child,
before the VerdictCard component:

                <div className="flex items-center gap-[8px] flex-wrap">
                  {mutationResult?.versions?.length > 0 && (
                    <span className="font-mono text-[11px] tracking-[1.1px] uppercase px-[10px] py-[5px] rounded-[4px] bg-[rgba(173,198,255,0.08)] border border-[rgba(173,198,255,0.15)] text-[#adc6ff]">
                      {mutationResult.versions.length} sources analyzed
                    </span>
                  )}
                  {analysisTime && (
                    <span className="font-mono text-[11px] tracking-[1.1px] uppercase px-[10px] py-[5px] rounded-[4px] bg-[rgba(173,198,255,0.08)] border border-[rgba(173,198,255,0.15)] text-[#adc6ff]">
                      completed in {analysisTime}s
                    </span>
                  )}
                  <span className="font-mono text-[11px] tracking-[1.1px] uppercase px-[10px] py-[5px] rounded-[4px] bg-[rgba(104,219,174,0.08)] border border-[rgba(104,219,174,0.15)] text-[#68dbae]">
                    Regolo.ai · EU hosted
                  </span>
                </div>

Do not touch anything else in the file.
```

---

## P5 — Demo mode with pre-loaded responses

```
Working directory: /Users/danielsadun/Library/Developer/Aletheia/frontend

File to edit: src/app/page.js

During the live hackathon pitch, the backends may be slow or unavailable.
I need a demo mode: clicking a demo case button loads pre-computed responses
instantly without making any API calls.

--- CHANGE 1: add isDemoMode state ---

Inside Home(), after const [mutationWarning, setMutationWarning] = useState(false);, add:
  const [isDemoMode, setIsDemoMode] = useState(false);

--- CHANGE 2: add DEMO_RESPONSES constant ---

Add this constant immediately after the DEMO_CASES array (before the Home() component).
Use exactly this data structure — fill in plausible, detailed Italian content:

const DEMO_RESPONSES = [
  {
    // Case 0: "5G causa perdita di memoria" — verdict FALSE
    analysis: {
      verdict: 'FALSE',
      confidence: 91,
      summary: 'La notizia è falsa. Nessuno studio pubblicato da istituzioni accademiche italiane o internazionali ha dimostrato una correlazione tra esposizione al 5G e perdita di memoria a breve termine. Lo studio citato non risulta registrato in alcun archivio scientifico ufficiale. La struttura del testo presenta caratteristiche tipiche della disinformazione virale: campione ridottissimo, linguaggio d\'urgenza e invito esplicito alla condivisione.',
      prosecutor_argument: 'L\'Università di Palermo non ha pubblicato alcuno studio sul 5G e la memoria nel 2024 o 2025. L\'Istituto Superiore di Sanità e l\'ICNIRP confermano che le frequenze 5G (sub-6 GHz e mmWave) non possiedono sufficiente energia per alterare tessuti biologici o funzioni neurologiche. Il campione dichiarato di 12 persone è scientificamente insufficiente per qualsiasi conclusione causale. Il riferimento alla censura governativa è una tecnica retorica classica priva di riscontro nei registri istituzionali pubblici.',
      defender_argument: 'Alcune ricerche preliminari, non ancora peer-reviewed, hanno esplorato gli effetti dell\'esposizione prolungata a campi elettromagnetici ad alta densità su modelli cellulari in vitro. La comunità scientifica ritiene necessari ulteriori studi di lungo periodo sulle reti 5G di quinta generazione, in particolare per le bande millimetriche.',
      prosecutor_points: [
        'Lo studio citato non è registrato in PubMed, Scopus o negli archivi dell\'Università di Palermo',
        'L\'ICNIRP e l\'ISS escludono effetti biologici alle potenze di esercizio del 5G',
        'Un campione di 12 soggetti non consente inferenza causale secondo qualsiasi standard metodologico',
      ],
      defender_points: [
        'La ricerca sugli effetti a lungo termine delle reti 5G mmWave è ancora in corso',
        'Alcune istituzioni invitano alla cautela in attesa di studi epidemiologici completi',
      ],
      prosecutor_sources: [
        { title: 'ISS — Campi elettromagnetici e salute: FAQ aggiornate 2024', url: 'https://www.iss.it/cem', snippet: 'Le evidenze scientifiche disponibili non supportano un nesso causale tra esposizione al 5G e danni neurologici.' },
        { title: 'ICNIRP Guidelines 2020 — Non-Ionizing Radiation Protection', url: 'https://www.icnirp.org/en/publications/article/guidelines-2020.html', snippet: 'Current 5G exposure levels remain well below thresholds established for biological effect.' },
      ],
      defender_sources: [
        { title: 'WHO — Electromagnetic fields: Research agenda', url: 'https://www.who.int/news-room/questions-and-answers/item/radiation-5g-mobile-networks-and-health', snippet: 'WHO continues to coordinate international research into potential long-term effects of new network technologies.' },
      ],
    },
    mutation: {
      versions: [
        { title: 'Studio ISS: nessuna evidenza di effetti neurologici da 5G', url: 'https://www.ansa.it/sito/notizie/tecnologia/2024/11/5g-salute.html', domain: 'ansa.it', snippet: 'L\'Istituto Superiore di Sanità ribadisce l\'assenza di prove scientifiche su danni cognitivi legati alle reti 5G.', similarity: 1.0, mutationScore: 0, isSource: true, credibility: { score: 94, level: 'high', color: '#1D9E75' } },
        { title: 'Il 5G fa male alla memoria? Ecco cosa dicono gli esperti', url: 'https://www.fanpage.it/tecnologia/5g-memoria-studio', domain: 'fanpage.it', snippet: 'Alcuni ricercatori avrebbero osservato effetti su campioni ridotti. Gli esperti invitano alla cautela prima di trarre conclusioni.', similarity: 0.71, mutationScore: 29, isSource: false, credibility: { score: 59, level: 'medium', color: '#D85A30' } },
        { title: 'ESCLUSIVO: studio choc dimostra che il 5G distrugge la memoria', url: 'https://www.ilgiornale.it/news/5g-studio-palermo', domain: 'ilgiornale.it', snippet: 'Un ricercatore dell\'Università di Palermo avrebbe condotto test su 12 volontari con risultati devastanti.', similarity: 0.44, mutationScore: 56, isSource: false, credibility: { score: 52, level: 'medium', color: '#D85A30' } },
        { title: 'IL GOVERNO CENSURA LO STUDIO SUL 5G: condividi prima che sparisca', url: 'https://notizieoggi.net/5g-censura-memoria', domain: 'notizieoggi.net', snippet: 'Scienziati italiani hanno dimostrato che il 5G causa perdita di memoria. Il governo vuole nascondere questa notizia.', similarity: 0.22, mutationScore: 78, isSource: false, credibility: { score: 14, level: 'low', color: '#E24B4A' } },
      ],
      graph: {
        nodes: [
          { id: 1, label: 'ansa.it',         color: '#1D9E75', size: 34, credibilityScore: 94 },
          { id: 2, label: 'fanpage.it',       color: '#D85A30', size: 22, credibilityScore: 59 },
          { id: 3, label: 'ilgiornale.it',    color: '#D85A30', size: 20, credibilityScore: 52 },
          { id: 4, label: 'notizieoggi.net',  color: '#E24B4A', size: 14, credibilityScore: 14 },
        ],
        edges: [
          { from: 1, to: 2, label: 'republished by', arrows: 'to' },
          { from: 2, to: 3, label: 'republished by', arrows: 'to' },
          { from: 3, to: 4, label: 'republished by', arrows: 'to' },
        ],
      },
      viralityRisk: {
        score: 87,
        label: 'Critical risk — viral spread already underway across low-credibility networks',
        breakdown: { shortMessage: 18, urgencyWords: 20, emotionalWords: 17, manyVersions: 20, lowCredibilitySources: 12 },
      },
    },
  },
  {
    // Case 1: "Legge di bilancio 312 voti" — verdict PARTIALLY_TRUE
    analysis: {
      verdict: 'PARTIALLY_TRUE',
      confidence: 74,
      summary: 'I dati sui voti parlamentari sono accurati: la legge di bilancio è stata approvata con 312 voti favorevoli e 201 contrari. Tuttavia, l\'affermazione sull\'aumento delle tasse sui risparmi dei pensionati è fuorviante: si tratta di un allineamento delle aliquote su alcuni strumenti finanziari già previsto dalla normativa europea, non di una nuova imposta. Il riferimento al ricorso alla Corte Costituzionale è corretto ma presentato in modo da amplificare artificialmente il conflitto politico.',
      prosecutor_argument: 'La formulazione "dovranno però pagare più tasse sui risparmi" omette il contesto normativo: l\'adeguamento riguarda esclusivamente i fondi pensione complementari che investono in strumenti precedentemente esenti, come previsto dalla direttiva IORP II. L\'impatto effettivo stimato dal MEF è inferiore a 80 euro annui per il pensionato mediano. Il tono emotivo del testo — "già annunciato ricorso" — crea un\'impressione di crisi istituzionale non supportata dalla portata tecnica del provvedimento.',
      defender_argument: 'I dati numerici sui voti sono verificabili nel resoconto stenografico della Camera. L\'aumento del 3% sulle pensioni minime è confermato dal testo della legge. Il ricorso annunciato da alcuni partiti di opposizione è un dato di fatto riportato da agenzie di stampa accreditate.',
      prosecutor_points: [
        'Il riferimento alle "più tasse sui risparmi" manca del contesto normativo europeo che lo rende tecnicamente corretto ma fuorviante',
        'L\'impatto economico reale è significativamente inferiore a quanto suggerisce la formulazione del testo',
      ],
      defender_points: [
        'I 312 voti favorevoli e 201 contrari corrispondono al verbale ufficiale della seduta parlamentare',
        'L\'aumento delle pensioni minime del 3% è confermato dall\'articolo 14 del testo di legge',
        'Il ricorso alla Corte Costituzionale è stato annunciato ufficialmente da tre gruppi parlamentari',
      ],
      prosecutor_sources: [
        { title: 'MEF — Comunicato stampa: impatto fiscale legge di bilancio 2026', url: 'https://www.mef.gov.it/comunicati/2026/legge-bilancio-impatto', snippet: 'L\'impatto sulle rendite dei fondi pensione complementari è stimato in media a 78 euro annui per contribuente.' },
      ],
      defender_sources: [
        { title: 'Camera dei Deputati — Resoconto seduta 14 novembre 2025', url: 'https://www.camera.it/leg20/resoconto/seduta-14-11-2025', snippet: 'Votazione finale: 312 favorevoli, 201 contrari, 4 astenuti. Approvata la legge 14 novembre 2025 n. 187.' },
        { title: 'ANSA — Opposizione annuncia ricorso alla Corte Costituzionale', url: 'https://www.ansa.it/sito/notizie/politica/ricorso-corte-cost-bilancio', snippet: 'Tre gruppi parlamentari hanno formalmente notificato l\'intenzione di ricorrere alla Consulta entro 60 giorni.' },
      ],
    },
    mutation: {
      versions: [
        { title: 'Legge di bilancio approvata: 312 sì, 201 no. Pensioni +3%', url: 'https://www.corriere.it/economia/legge-bilancio-approvata', domain: 'corriere.it', snippet: 'Il Parlamento ha approvato la manovra finanziaria. Previsto aumento delle pensioni minime e revisione delle aliquote sui fondi pensione complementari.', similarity: 1.0, mutationScore: 0, isSource: true, credibility: { score: 91, level: 'high', color: '#1D9E75' } },
        { title: 'Pensionati nel mirino: aumentano le tasse sui risparmi', url: 'https://www.ilfattoquotidiano.it/pensionati-tasse-risparmi', domain: 'ilfattoquotidiano.it', snippet: 'Approvata la legge di bilancio con 312 voti. I pensionati dovranno pagare di più sui risparmi. La sinistra ricorre alla Corte.', similarity: 0.79, mutationScore: 21, isSource: false, credibility: { score: 62, level: 'medium', color: '#D85A30' } },
        { title: 'Governo attacca i pensionati: nuove tasse devastanti sui risparmi', url: 'https://pensionatiblog.it/governo-tasse-pensionati', domain: 'pensionatiblog.it', snippet: 'Dopo la legge di bilancio i pensionati perdono tutto. La sinistra ha già annunciato ricorso. Condividi questa vergogna.', similarity: 0.41, mutationScore: 59, isSource: false, credibility: { score: 18, level: 'low', color: '#E24B4A' } },
      ],
      graph: {
        nodes: [
          { id: 1, label: 'corriere.it',       color: '#1D9E75', size: 32, credibilityScore: 91 },
          { id: 2, label: 'ilfattoquotidiano.it', color: '#D85A30', size: 22, credibilityScore: 62 },
          { id: 3, label: 'pensionatiblog.it', color: '#E24B4A', size: 13, credibilityScore: 18 },
        ],
        edges: [
          { from: 1, to: 2, label: 'republished by', arrows: 'to' },
          { from: 2, to: 3, label: 'republished by', arrows: 'to' },
        ],
      },
      viralityRisk: {
        score: 44,
        label: 'Moderate risk — accurate core facts but misleading framing may accelerate spread',
        breakdown: { shortMessage: 7, urgencyWords: 9, emotionalWords: 13, manyVersions: 15, lowCredibilitySources: 0 },
      },
    },
  },
  {
    // Case 2: "Vaccino effetti neurologici" — verdict INCONCLUSIVE
    analysis: {
      verdict: 'INCONCLUSIVE',
      confidence: 43,
      summary: 'Le affermazioni sugli effetti collaterali neurologici del vaccino anti-influenzale stagionale non possono essere né confermate né smentite allo stato attuale. Alcuni studi preliminari su popolazioni geneticamente predisposte sono in corso, ma i dati non sono ancora stati pubblicati su riviste peer-reviewed. Le autorità sanitarie nazionali e internazionali non hanno rilevato segnali di sicurezza significativi nelle sorveglianze post-market 2024-2025.',
      prosecutor_argument: 'AIFA e EMA non hanno ricevuto segnalazioni di eventi neurologici correlabili al vaccino anti-influenzale stagionale 2025 in proporzione statisticamente significativa rispetto alle stagioni precedenti. La formulazione "soggetti geneticamente predisposti" è vaga e non corrisponde a nessuna categoria a rischio ufficialmente definita. L\'espressione "comunità scientifica divisa" è una tecnica retorica che amplifica incertezze normali nel processo scientifico.',
      defender_argument: 'L\'AIFA ha confermato che un gruppo di ricerca presso il Policlinico Gemelli sta conducendo uno studio osservazionale su eventuali correlazioni con varianti genetiche del recettore GRM7. I dati di sorveglianza del sistema Vigifarmaco mostrano un piccolo aumento (non statisticamente significativo) di segnalazioni di cefalea e vertigini post-vaccinazione nel 2025 rispetto al 2023.',
      prosecutor_points: [
        'AIFA e EMA non hanno emesso alert di sicurezza per la stagione 2024-2025',
        'La categoria "soggetti geneticamente predisposti" non è definita in alcuna linea guida ufficiale',
        'Il tasso di segnalazioni nel sistema Vigifarmaco non supera la soglia di rilevanza statistica',
      ],
      defender_points: [
        'Uno studio osservazionale è effettivamente in corso presso una struttura accreditata',
        'I dati di sorveglianza 2025 mostrano una variazione minore ma non ancora analizzata in dettaglio',
        'L\'invito alla calma delle autorità sanitarie è reale e documentato',
      ],
      prosecutor_sources: [
        { title: 'AIFA — Bollettino sicurezza vaccini influenzali 2024-2025', url: 'https://www.aifa.gov.it/sicurezza-vaccini-influenzali-2025', snippet: 'Nessun segnale di rischio neurologico rilevato nella sorveglianza post-market del vaccino anti-influenzale stagionale 2025.' },
      ],
      defender_sources: [
        { title: 'Salute 24 — Ricerca Gemelli su vaccino e genetica: i dettagli', url: 'https://salute24.ilsole24ore.com/ricerca-gemelli-vaccino-genetica', snippet: 'Un team del Policlinico Gemelli sta analizzando potenziali correlazioni tra varianti del recettore GRM7 e reazioni post-vaccinali.' },
      ],
    },
    mutation: {
      versions: [
        { title: 'Vaccino antinfluenzale 2025: nessun segnale di rischio neurologico secondo AIFA', url: 'https://salute24.ilsole24ore.com/vaccino-antinfluenzale-2025-aifa', domain: 'salute24.ilsole24ore.com', snippet: 'L\'AIFA conferma l\'assenza di segnali di sicurezza neurologici nel bollettino post-market della stagione 2024-2025.', similarity: 1.0, mutationScore: 0, isSource: true, credibility: { score: 89, level: 'high', color: '#1D9E75' } },
        { title: 'Vaccino influenzale e neurologia: gli esperti sono divisi', url: 'https://www.medicalive.it/vaccino-influenzale-neurologia', domain: 'medicalive.it', snippet: 'Alcuni medici segnalano effetti collaterali neurologici in soggetti predisposti. I dati sono ancora in fase di analisi.', similarity: 0.65, mutationScore: 35, isSource: false, credibility: { score: 54, level: 'medium', color: '#D85A30' } },
        { title: 'Il vaccino anti-influenzale causa danni al cervello: ecco le prove', url: 'https://saluteverita.net/vaccino-cervello-danni', domain: 'saluteverita.net', snippet: 'Secondo alcune fonti mediche il nuovo vaccino stagionale causa effetti neurologici. Le autorità invitano alla calma ma i dubbi restano.', similarity: 0.37, mutationScore: 63, isSource: false, credibility: { score: 11, level: 'low', color: '#E24B4A' } },
      ],
      graph: {
        nodes: [
          { id: 1, label: 'ilsole24ore.com',  color: '#1D9E75', size: 30, credibilityScore: 89 },
          { id: 2, label: 'medicalive.it',    color: '#D85A30', size: 20, credibilityScore: 54 },
          { id: 3, label: 'saluteverita.net', color: '#E24B4A', size: 12, credibilityScore: 11 },
        ],
        edges: [
          { from: 1, to: 2, label: 'republished by', arrows: 'to' },
          { from: 2, to: 3, label: 'republished by', arrows: 'to' },
        ],
      },
      viralityRisk: {
        score: 38,
        label: 'Low-moderate risk — scientific uncertainty may fuel organic spread without active amplification',
        breakdown: { shortMessage: 4, urgencyWords: 7, emotionalWords: 10, manyVersions: 10, lowCredibilitySources: 7 },
      },
    },
  },
];

--- CHANGE 3: add handleDemoLoad function ---

Add this function inside Home(), immediately after handleAnalyze:

  const handleDemoLoad = (caseIndex) => {
    setError(null);
    setMutationWarning(false);
    setAnalysisResult(null);
    setMutationResult(null);
    setIsLoading(true);
    setIsDemoMode(true);

    setTimeout(() => {
      const { analysis, mutation } = DEMO_RESPONSES[caseIndex];
      setAnalysisResult(analysis);
      setMutationResult(mutation);
      setIsLoading(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, 1400);
  };

--- CHANGE 4: update demo case buttons to also trigger handleDemoLoad ---

Find the existing demo case buttons (around line 193):
                {DEMO_CASES.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => setNewsText(c.text)}

Replace the onClick with:
                    onClick={() => { setNewsText(c.text); handleDemoLoad(DEMO_CASES.indexOf(c)); }}

--- CHANGE 5: reset isDemoMode when user clicks the main Analyze button ---

In handleAnalyze, immediately after setError(null); (around line 87), add:
  setIsDemoMode(false);

--- CHANGE 6: add a DEMO MODE badge above the results ---

In the results section (div with ref={resultsRef}), after the metadata bar added in P4
and before VerdictCard, add:

                {isDemoMode && (
                  <div className="bg-[rgba(186,117,23,0.1)] border border-[rgba(186,117,23,0.25)] rounded-[6px] px-[14px] py-[9px]">
                    <span className="font-mono text-[11px] tracking-[1.1px] uppercase text-[#ba7517]">
                      ⚡ Demo mode — pre-loaded responses. Click Analyze → for live analysis.
                    </span>
                  </div>
                )}

Do not touch anything else in the file.
```

## Ordine Prompt
P5 → P2 → P4 → P3 → P1