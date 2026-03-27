## Your role: Frontend — UI, Vulnerability Score & Demo

You are building the face of Truth Engine: the web interface that takes a news article,
sends it to two backend services, and displays the full analysis in a clear, impactful way.

**Your Next.js app runs on port 3000.Dev 1's backend runs on port 3001** — you call it at `POST /api/analyze`**Dev 2's backend runs on port 3002** — you call it at `POST /mutation`

The key advantage you have: **you don't need to wait for Dev 1 or Dev 2 to start.**
You will build the entire UI first using mock data, then swap in the real API calls at the end.

> Paste each prompt into Google Antigravity. Review the implementation plan it generates before approving. Let it run. Test visually in the browser. Then move to the next prompt.
> 

---

## STEP 0 — Team sync (do this together, first 30 min)

Before writing any code, get the **JSON contracts** from Dev 1 and Dev 2.
These are the exact formats their APIs will return.

Dev 1 will give you the structure for `/api/analyze`.
Dev 2 will give you the structure for `/mutation`.

Copy them into a note — you will use them to build the mock data in Prompt 1.

Once you have the contracts, you can work completely independently until Prompt 7.

---

## Prompt 1 — Project setup with mock data

**Send when:** immediately after Step 0. No dependencies on Dev 1 or Dev 2.

```
Create a Next.js project with Tailwind CSS for a fact-checking web application called Truth Engine.

Also install these libraries:
- recharts (for the mutation timeline chart)
- vis-network (for the source credibility graph)

Create the file /src/lib/mockData.js with this exact content — this represents
what the real APIs will return. We will use this during development.

export const mockAnalysis = {
  verdict: "MISLEADING",
  confidence: 74,
  summary: "The article contains a real underlying fact but frames it in a way designed to generate disproportionate fear. The sources found do not support the severity of the claims made in the headline.",
  prosecutor_argument: "The core claim about a government regulation is real, but the article significantly exaggerates its scope. Official sources show the regulation applies only to commercial devices, not personal ones. The framing 'obbliga tutti i cittadini' is factually inaccurate according to the Ministry press release dated January 2026.",
  defender_argument: "The regulation in question was indeed approved by Parliament and is legally binding. Multiple news outlets including ANSA and Corriere della Sera reported on it the same day. The article correctly identifies the penalty amount and the 30-day timeline.",
  prosecutor_sources: [
    { title: "Ministero chiarisce: la norma riguarda solo i dispositivi aziendali", url: "<https://governo.it/comunicato-123>", snippet: "Il Ministro ha precisato che le nuove disposizioni si applicano esclusivamente ai dispositivi utilizzati in ambito lavorativo..." },
    { title: "Bufala virale: nessun obbligo per i privati cittadini", url: "<https://pagella-politica.it/analisi/456>", snippet: "La notizia che circola sui social è fuorviante. La legge approvata ieri non prevede alcun registro per i dispositivi personali..." }
  ],
  defender_sources: [
    { title: "Approvata la legge sui dispositivi elettronici", url: "<https://ansa.it/notizie/789>", snippet: "Il parlamento ha approvato con 312 voti favorevoli la nuova normativa che prevede la registrazione obbligatoria..." },
    { title: "Dispositivi elettronici: ecco cosa cambia da gennaio", url: "<https://corriere.it/economia/abc>", snippet: "La multa prevista è di 5.000 euro per chi non ottempera all obbligo entro i 30 giorni stabiliti dalla normativa..." }
  ],
  prosecutor_points: ["Official Ministry statement contradicts the 'all citizens' framing", "Penalty scope is limited to commercial use, not personal devices"],
  defender_points: ["Parliamentary vote and approval date confirmed by multiple sources", "Penalty amount and 30-day timeline are factually accurate"]
}

export const mockMutation = {
  versions: [
    { title: "Approvata la legge sui dispositivi elettronici", url: "<https://ansa.it/notizie/789>", domain: "ansa.it", snippet: "Il parlamento ha approvato la nuova normativa che prevede la registrazione obbligatoria dei dispositivi elettronici aziendali.", similarity: 0.94, mutationScore: 6, isSource: true, credibility: { score: 92, level: "high", color: "#1D9E75" } },
    { title: "Nuova legge: registra i tuoi dispositivi o paghi 5000 euro", url: "<https://blog-tech-italia.com/post-456>", domain: "blog-tech-italia.com", snippet: "Una nuova legge approvata ieri obbliga tutti i cittadini italiani a registrare i propri dispositivi elettronici entro 30 giorni.", similarity: 0.71, mutationScore: 29, isSource: false, credibility: { score: 38, level: "low", color: "#E24B4A" } },
    { title: "SCANDALO: il governo ti spia attraverso i dispositivi", url: "<https://verita-nascosta.net/articolo-789>", domain: "verita-nascosta.net", snippet: "Il regime vuole sapere tutto di te. La nuova legge fascista obbliga TUTTI gli italiani a registrare OGNI dispositivo o pagare 5000 euro di multa.", similarity: 0.38, mutationScore: 62, isSource: false, credibility: { score: 12, level: "low", color: "#E24B4A" } },
    { title: "Dispositivi elettronici: cosa dice davvero la nuova normativa", url: "<https://ilsole24ore.com/articolo-tecnologia>", snippet: "La normativa chiarisce gli obblighi per le aziende. I privati cittadini non sono soggetti alle nuove disposizioni.", similarity: 0.58, mutationScore: 42, isSource: false, credibility: { score: 88, level: "high", color: "#1D9E75" } }
  ],
  graph: {
    nodes: [
      { id: 1, label: "ansa.it", color: "#1D9E75", size: 40, isSource: true },
      { id: 2, label: "blog-tech-italia.com", color: "#E24B4A", size: 22 },
      { id: 3, label: "verita-nascosta.net", color: "#E24B4A", size: 14 },
      { id: 4, label: "ilsole24ore.com", color: "#1D9E75", size: 39 }
    ],
    edges: [
      { from: 1, to: 2, label: "republished by", arrows: "to" },
      { from: 2, to: 3, label: "republished by", arrows: "to" },
      { from: 1, to: 4, label: "republished by", arrows: "to" }
    ]
  },
  viralityRisk: {
    score: 68,
    label: "High risk — rapid spread likely before a debunk can contain it",
    breakdown: { shortMessage: 10, urgencyWords: 8, emotionalWords: 8, manyVersions: 20, lowCredibilitySources: 20, totalComponents: 5 }
  }
}
```

---

## Prompt 2 — Main page layout and input form

**Send when:** Prompt 1 is done.

```
In the existing Next.js project, replace the content of /src/app/page.js (or page.tsx).

Build the main page of Truth Engine with this layout:

Header (full width, dark background):
- Logo text: "Truth Engine" in large bold font
- Subtitle: "Advanced disinformation analysis"
- A small label top-right: "Codemotion Rome AI Tech Week 2026"

Main content area (centered, max-width 800px, padding on both sides):

1. Input section:
   - Label: "Paste a news article or claim to analyze"
   - Large textarea (at least 6 rows) with placeholder:
     "Paste the full text of the news article here..."
   - Below the textarea: a prominent "Analyze" button
   - Character counter below the textarea: "X / 3000 characters"

2. Results section (hidden until analysis is triggered):
   Show a simple loading message "Analyzing..." while processing.
   When done, show the components that will be built in later prompts.
   For now, just import mockAnalysis and mockMutation from /src/lib/mockData.js
   and set them as the result when the button is clicked (no real API call yet).

State management:
- newsText: the textarea value
- isLoading: boolean
- analysisResult: null or the mockAnalysis object
- mutationResult: null or the mockMutation object

On button click:
- Set isLoading to true
- Wait 1500ms (simulating API call)
- Set both results from mockData
- Set isLoading to false

Style with Tailwind. Make it clean and readable. Dark header, white content area.
Font sizes should be large enough to read comfortably from a projector (minimum 16px body text).
```

---

## Prompt 3 — Verdict component

**Send when:** Prompt 2 is done and you can see the mock results appear on click.

```
In the existing Next.js project, create /src/components/VerdictCard.js.

This component receives: { verdict, confidence, summary, prosecutorPoints, defenderPoints }

Display:

1. Verdict badge — a large pill/badge showing the verdict text.
   Color mapping:
   - VERIFIED → background #1D9E75, white text
   - PARTIALLY_TRUE → background #BA7517, white text
   - INCONCLUSIVE → background #888780, white text
   - MISLEADING → background #D85A30, white text
   - FALSE → background #E24B4A, white text
   Display the verdict text in a human-readable way:
   PARTIALLY_TRUE → "Partially True", MISLEADING → "Misleading", etc.

2. Confidence bar:
   Label: "Confidence: X%"
   A progress bar that fills based on the confidence value (0-100)
   Color the bar green if confidence > 70, yellow if 40-70, red if < 40

3. Summary text:
   The summary in a highlighted box (light gray background)
   Label above: "Verdict explanation"

4. Two-column section titled "Key arguments":
   Left column — "Against" — list of prosecutor_points, each with a red dot
   Right column — "In favor" — list of defender_points, each with a green dot

Add this component to the main page, shown as the first thing after the input form
when results are available.
```

---

## Prompt 4 — Vulnerability Score component

**Send when:** Prompt 3 is done and looks good in the browser.

```
In the existing Next.js project, create /src/components/VulnerabilityScore.js.

This component does NOT receive data from the API — it computes the score itself
from the raw news text. Receive: { newsText }

Computing the score from the text (do this inside the component):

urgencyFraming (max 25):
- Words to find (case-insensitive): BREAKING, ESCLUSIVO, URGENTE, ATTENZIONE,
  SUBITO, ORA, ADESSO, IMMEDIATO, SHOCKING, CLAMOROSO, VIRALE, CENSURA
- 5 points per word found, max 25

tribalLanguage (max 20):
- Words: noi, loro, nemici, traditori, regime, dittatura, bugiardi,
  complotto, svegliatevi, pecore, ignoranti, servi
- 5 points per word found, max 20

emotionalLoading (max 20):
- Words: scandalo, vergogna, paura, pericolo, minaccia, catastrofe, terrore,
  orrore, disastro, tragedia, allarme, emergenza, crisi, devastante
- 4 points per word found, max 20

cherryPicking (max 15):
- Look for patterns: "secondo alcuni", "alcune fonti", "si dice che",
  "pare che", "sembrerebbe", "fonti anonime", "non confermato"
- 5 points per pattern found, max 15

falseAuthority (max 10):
- Look for: "esperti confermano", "scienziati dicono", "studi dimostrano"
  WITHOUT a named institution after them
- Simple heuristic: find these phrases, then check if the next 5 words contain
  a proper noun (word starting with capital letter). If not: +5 points. Max 10.

noSourcesCited (max 10):
- If the text contains NO URLs (no "http" or "www") AND no phrases like
  "secondo [Source]" or "fonte:" → add 10 points

total = sum of all components

Display:
1. Large score number: "X / 100" with a subtitle "Vulnerability Score"
   Color: green if < 30, orange if 30-60, red if > 60
   Below the number: a short explanation of what this score means

2. Breakdown table — one row per component:
   | Component | Points | Max | Visual bar |
   Each row has a small filled bar proportional to (points/max)
   Human-readable labels:
   - urgencyFraming → "Urgency framing"
   - tribalLanguage → "Tribal language (us vs them)"
   - emotionalLoading → "Emotional loading"
   - cherryPicking → "Cherry-picking / vague sourcing"
   - falseAuthority → "False authority appeal"
   - noSourcesCited → "No sources cited"

3. Below the table, a one-line note:
   "A high score does not mean the article is false — it means it is written
   to bypass critical thinking, regardless of the underlying facts."

Add this component to the main page, shown after the VerdictCard.
```

---

## Prompt 5 — Mutation Timeline chart

**Send when:** Prompt 4 is done.

```
In the existing Next.js project, create /src/components/MutationTimeline.js.

This component receives: { versions }
versions is an array of objects with: domain, similarity, mutationScore, isSource, credibility

Use recharts to build a line chart showing how the news mutated across sources.

Chart setup:
- Width: 100% of container
- Height: 280px
- X axis: source index (1, 2, 3...) with custom tick labels showing the domain name
  (truncate domain to 18 characters if longer)
- Y axis: similarity value from 0 to 1, labeled "Similarity to original"
  Add a dashed reference line at y=0.7 labeled "Distortion threshold"
- The line connects all versions sorted by similarity descending
- Each dot on the line:
  - If isSource: green fill (#1D9E75), larger size (radius 8)
  - If similarity >= 0.7: yellow fill (#BA7517), radius 6
  - If similarity < 0.7: red fill (#E24B4A), radius 6
- Tooltip: on hover show domain, similarity (as percentage), mutationScore

Above the chart, show:
- Title: "Mutation Timeline"
- Subtitle: "How the article changed across sources"

Below the chart, show a small legend:
- Green dot = primary source
- Yellow dot = minor drift (< 30% mutation)
- Red dot = significant distortion (> 30% mutation)

If versions has fewer than 2 items, show a message:
"Not enough source versions found to build a timeline."

Add this component to the main page after VulnerabilityScore.
```

---

## Prompt 6 — Source Credibility Graph

**Send when:** Prompt 5 is done.

```
In the existing Next.js project, create /src/components/SourceGraph.js.

This component receives: { graph }
graph is an object with: nodes (array) and edges (array)

Use the vis-network library to render an interactive network graph.

IMPORTANT: vis-network requires a DOM element reference and cannot be used server-side.
Use React's useRef and useEffect hooks. Add 'use client' at the top of the file.

Setup:
1. Create a div ref with useRef
2. In useEffect (runs after mount), initialize vis-network:
   - Container: the div ref
   - Data: { nodes: new DataSet(graph.nodes), edges: new DataSet(graph.edges) }
   - Options:
     layout: { hierarchical: { direction: "UD", sortMethod: "directed", levelSeparation: 100 } }
     edges: { arrows: { to: { enabled: true, scaleFactor: 0.8 } }, color: { color: "#888780" }, font: { size: 11 } }
     nodes: { shape: "dot", font: { size: 13, face: "sans-serif" } }
     physics: { enabled: false }
     interaction: { hover: true, tooltipDelay: 100 }
3. The container div must have an explicit height: 320px

Add a title above the graph: "Source Credibility Graph"
Add a subtitle: "How the article spread across sources (size = credibility)"

Add a legend below the graph (three colored dots with labels):
- Green (#1D9E75): High credibility source
- Orange (#BA7517): Medium credibility source
- Red (#E24B4A): Low credibility source

If graph.nodes has fewer than 2 items, show:
"Not enough sources found to build a graph."

Add this component to the main page after MutationTimeline.
```

---

## Prompt 7 — Virality Risk component

**Send when:** Prompt 6 is done.

```
In the existing Next.js project, create /src/components/ViralityRisk.js.

This component receives: { viralityRisk }
viralityRisk has: score (0-100), label (string), breakdown (object)

Display:

1. Large score display:
   - The number "X" in very large font (48px or bigger)
   - "/100" in smaller muted font next to it
   - Label "Virality Risk Score" above
   - Color the score number based on value:
     < 30: green (#1D9E75)
     30-60: orange (#D85A30)
     > 60: red (#E24B4A)

2. Risk label: the full label string in slightly larger text below the score

3. Explanation sentence (always show this):
   "This score estimates how quickly this article would spread before an effective
   debunk could contain it. A high score does not mean the article is false —
   it means it is structurally optimized for sharing."

4. Breakdown section titled "Why this score":
   Show each component from the breakdown object:
   - shortMessage → "Short and shareable"
   - urgencyWords → "Contains urgency triggers"
   - emotionalWords → "Emotionally loaded language"
   - manyVersions → "Already spreading across sources"
   - lowCredibilitySources → "Amplified by low-credibility sources"
   For each: show the label, the points value, and a small filled bar

Add this component to the main page after SourceGraph.
This should be the last component in the results section.
```

---

## SYNC POINT — Wait for Dev 1 and Dev 2

At this point your UI is complete and looks great with mock data.
**Now wait for Dev 1 to message you that `/api/analyze` is live.And wait for Dev 2 to message you that `/mutation` is live.**

When you get both confirmations, ask them to send you one real example response each.
Update your mockData.js with the real examples to make sure formats match exactly.
Then move to Prompt 8.

---

## Prompt 8 — Real API integration

**Send when:** Dev 1 AND Dev 2 have both confirmed their backends are running.

```
In the existing Next.js project, replace the mock data logic in /src/app/page.js
with real API calls to the two backends.

When the Analyze button is clicked:

1. Validate: if the textarea is empty or has fewer than 20 characters,
   show a red error message below the textarea: "Please enter a longer text to analyze."
   Do not proceed with the API call.

2. Set isLoading to true, clear any previous results.

3. Make two API calls IN PARALLEL using Promise.all:
   - Call A: POST to <http://localhost:3001/api/analyze>
     body: { text: newsText }
   - Call B: POST to <http://localhost:3002/mutation>
     body: { text: newsText }

4. When both resolve:
   - Set analysisResult to the response from Call A
   - Set mutationResult to the response from Call B
   - Set isLoading to false
   - Scroll smoothly to the results section

5. If either call fails (network error or non-200 response):
   - Set isLoading to false
   - Show a red error banner: "Analysis failed. Please check your connection and try again."
   - Log the error to console for debugging

6. The VulnerabilityScore component already computes its score from the newsText directly,
   so it does not need any API data — it will just work.

Loading state: instead of a plain "Analyzing..." text, show a series of status messages
that cycle every 2 seconds:
- "Searching for sources..."
- "Running adversarial debate between agents..."
- "Evaluating judge verdict..."
- "Building source credibility graph..."
- "Computing virality risk..."
This makes the wait feel alive and shows the jury what's happening behind the scenes.
```

---

## Prompt 9 — Demo polish

**Send when:** Prompt 8 is done and the real API calls work end to end.

```
In the existing Next.js project, make these final improvements for the demo presentation:

1. Add a "Demo cases" section above the main input area.
   Show three buttons labeled:
   - "Case 1: False with high mutation"
   - "Case 2: True but manipulative"
   - "Case 3: Inconclusive"
   Clicking each button pre-fills the textarea with a prepared news article text.
   The texts to pre-fill:

   Case 1: "BREAKING: Scienziati italiani hanno dimostrato che il 5G causa perdita di memoria a breve termine. Uno studio rivoluzionario dell'Università di Palermo ha esaminato 12 persone e i risultati sono devastanti. Il governo vuole censurare questa notizia. Condividi subito prima che sparisca."

   Case 2: "Il Parlamento italiano ha approvato ieri la legge di bilancio con 312 voti favorevoli e 201 contrari. La manovra prevede un aumento del 3% delle pensioni minime. I pensionati dovranno però pagare più tasse sui risparmi. La sinistra ha già annunciato ricorso alla Corte Costituzionale."

   Case 3: "Secondo alcune fonti mediche, il nuovo vaccino anti-influenzale stagionale potrebbe causare effetti collaterali neurologici in soggetti geneticamente predisposti. I dati sono ancora in fase di analisi e la comunità scientifica è divisa. Le autorità sanitarie invitano alla calma."

2. Add a results download button that appears after an analysis is complete.
   The button text: "Export full report (JSON)"
   On click: create a JSON file with all the analysis results and trigger a download.
   Filename: truth-engine-report-[timestamp].json

3. Ensure all font sizes are at least 15px. Check on a 1280px wide window that everything
   is readable without zooming.

4. Add a thin colored border on the left side of each results card matching the verdict color
   (green for VERIFIED, red for FALSE, etc.) so the verdict is instantly visible
   even when the card is partially off-screen.

5. Add a simple footer: "Truth Engine — Codemotion Rome AI Tech Week 2026 | Hackathon"
```