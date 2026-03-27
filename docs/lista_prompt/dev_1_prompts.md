## Your role: Backend — Adversarial Agents & Verdict

You are building the core intelligence of Truth Engine: three AI agents that debate the truthfulness of a news article and produce a structured verdict.

**Your backend runs on port 3001.Dev 2's backend runs on port 3002.Dev 3 (frontend) will call your API at `POST /api/analyze`.**

> Paste each prompt into Google Antigravity. Review the implementation plan it generates before approving. Let it run. Test. Then move to the next prompt.
> 

---

## STEP 0 — Team sync (do this together, first 30 min)

Before writing a single line of code, the three of you must agree on the **JSON contract**: the exact format your endpoint returns, so Dev 3 can build the UI immediately with mock data without waiting for you.

**Share this with Dev 3 right now:**

```json
{
  "verdict": "VERIFIED | PARTIALLY_TRUE | INCONCLUSIVE | MISLEADING | FALSE",
  "confidence": 78,
  "summary": "Short explanation of the verdict in 2-3 sentences.",
  "prosecutor_argument": "Full text of the argument against the news article.",
  "defender_argument": "Full text of the argument supporting the news article.",
  "prosecutor_sources": [
    { "title": "Source title", "url": "https://...", "snippet": "Relevant excerpt" }
  ],
  "defender_sources": [
    { "title": "Source title", "url": "https://...", "snippet": "Relevant excerpt" }
  ],
  "prosecutor_points": ["key point 1", "key point 2"],
  "defender_points": ["key point 1", "key point 2"]
}
```

**Also tell Dev 2:** your backend will be reachable at `http://localhost:3001` and your analyze endpoint is `POST /api/analyze`.

Once everyone knows what to expect from each other, you can all work independently.

---

## Prompt 1 — Project setup

**Send when:** immediately after Step 0. No dependencies on anyone else.

```
=== PROJECT ===
Truth Engine — hackathon Codemotion Rome AI Tech Week 2026.
Create this project inside a NEW folder called backend1/ in the current repo root.
Do not create the project in the repo root itself — it must be inside backend1/.
===============

Create a Node.js backend project for a fact-checking system called Truth Engine.

Project structure:
- /src/agents/    (AI agents go here)
- /src/routes/    (API endpoints)
- /src/utils/     (shared utilities)
- /src/index.js   (entry point)

Install these dependencies: express, dotenv, axios, cors

Create a .env file with these fields (leave values empty for now):
REGOLO_API_KEY=
SERPER_API_KEY=
PORT=3001

Create a .gitignore file with these entries:
node_modules/
.env
.env.local
*.log

In src/index.js:
- Load dotenv at the very top
- Set up Express with CORS enabled for all origins
- Parse JSON request bodies
- Start the server on the PORT from .env (fallback: 3001)
- Add GET /health that returns: { status: "ok", service: "truth-engine-agents" }
- Log "Truth Engine agents backend running on port 3001" on startup
```

---

## ⛔ STOP — API Keys (fare prima di Prompt 2)

Prima di continuare, apri il file `.env` creato da Antigravity e inserisci le chiavi reali:

```
REGOLO_API_KEY=la_tua_chiave_da_dashboard.regolo.ai
SERPER_API_KEY=la_tua_chiave_da_serper.dev
PORT=3001
```

**Senza queste chiavi, Prompt 2 eseguirà web search che ritorna `[]` silenziosamente — tutto sembrerà funzionare ma gli agenti non avranno fonti e produrranno verdetti casuali.**

Aggiorna anche `STATUS.md` nella root con le chiavi disponibili (NON committare le chiavi nel repo — aggiorna solo la riga "Chi la fornisce").

---

## Prompt 2 — Web search utility

**Send when:** Prompt 1 is running and you can reach http://localhost:3001/health.

```
=== CONTEXT ===
Project: Truth Engine — backend 1 (adversarial agents & verdict)
Working directory: backend1/  |  Runtime: Node.js  |  Port: 3001
Already exists:
• src/index.js — Express server, GET /health returns {status:"ok"}, dotenv loaded, CORS enabled
• .env — has REGOLO_API_KEY and SERPER_API_KEY (already filled in)
• .gitignore — excludes node_modules/, .env
===============

In the existing Node.js project, create /src/utils/search.js.

Export one async function: webSearch(query, numResults = 5)

The function must:
1. POST to <https://google.serper.dev/search>
2. Headers: { "X-API-Key": process.env.SERPER_API_KEY, "Content-Type": "application/json" }
3. Body: { q: query, num: numResults, gl: "it", hl: "it" }
   (gl/hl = Italian geolocation and language, gives more relevant results for Italian news)
4. Return an array: [{ title, url, snippet }]
5. On any error: log it and return [] — never throw, the pipeline must keep running

At the bottom, add a self-test block that only runs when this file is executed directly
(use: if (require.main === module)):
- Run webSearch("notizia falsa bufala italia")
- Print results to console
- This verifies the Serper API key works before you move on
```

---

## Prompt 3 — Prosecutor and Defender agents

**Send when:** Prompt 2 is done and the self-test prints real results.

```
=== CONTEXT ===
Project: Truth Engine — backend 1 (adversarial agents & verdict)
Working directory: backend1/  |  Runtime: Node.js  |  Port: 3001
Already exists:
• src/index.js — Express server on port 3001
• src/utils/search.js — exports webSearch(query, numResults=5) → [{title, url, snippet}]
  Uses Serper API (POST https://google.serper.dev/search, header X-API-Key, gl:"it", hl:"it")
===============

In the existing project, create /src/agents/debate.js.

This module implements two opposing AI agents using the Regolo.ai API (OpenAI-compatible,
model: Llama-3.3-70B-Instruct). Regolo.ai is an EU-hosted, zero-data-retention LLM provider.

Regolo.ai API call structure:
- URL: https://api.regolo.ai/v1/chat/completions
- Method: POST
- Headers:
    "Authorization": "Bearer " + process.env.REGOLO_API_KEY
    "Content-Type": "application/json"
- Body:
    model: "Llama-3.3-70B-Instruct"
    max_tokens: 800
    messages: [
      { role: "system", content: (the agent's system prompt) },
      { role: "user", content: (the news + sources) }
    ]
- Response: the text is at response.choices[0].message.content

Implement and export two async functions:

1. runProsecutor(newsText, searchResults)
   searchResults is an array of { title, url, snippet }
   System prompt:
   "You are a skeptical investigative fact-checker. Your single goal is to build the strongest
   possible case that the following news article is false, misleading, or untrustworthy.
   Use only the provided search results as your evidence base — do not invent facts.
   Cite each source you use by its URL. Be specific: point to exact claims in the article
   that are contradicted by the sources. Respond entirely in Italian."
   User message: format newsText first, then list the search results clearly labeled
   Return: the text string from response.choices[0].message.content

2. runDefender(newsText, searchResults)
   Same structure, different system prompt:
   "You are a journalist whose job is to verify that news articles are accurate.
   Your single goal is to build the strongest possible case that the following news article
   is true, well-sourced, and trustworthy. Use only the provided search results as your
   evidence base — do not invent facts. Cite each source you use by its URL.
   Be specific: point to exact claims in the article that are confirmed by the sources.
   Respond entirely in Italian."
   Return: the text string from response.choices[0].message.content

On API error: return a string like "Agent error: [error message]" — never throw.
```

---

## Prompt 4 — Judge agent

**Send when:** Prompt 3 is done.

```
=== CONTEXT ===
Project: Truth Engine — backend 1 (adversarial agents & verdict)
Working directory: backend1/  |  Runtime: Node.js  |  Port: 3001
Already exists:
• src/utils/search.js — exports webSearch(query, numResults=5) → [{title, url, snippet}]
• src/agents/debate.js — exports:
    runProsecutor(newsText, searchResults) → string (Italian argument against the article)
    runDefender(newsText, searchResults) → string (Italian argument supporting the article)
  Both call POST https://api.regolo.ai/v1/chat/completions, header "Authorization: Bearer REGOLO_API_KEY",
  model "Llama-3.3-70B-Instruct", response at choices[0].message.content
===============

In the existing /src/agents/debate.js, add a third exported async function:

runJudge(newsText, prosecutorArgument, defenderArgument)

Call the Regolo.ai API (Llama-3.3-70B-Instruct) using the same structure as in Prompt 3
(URL: https://api.regolo.ai/v1/chat/completions, Bearer auth, response.choices[0].message.content)
with max_tokens: 700 and this system prompt:

"You are an impartial judge in a fact-checking debate. You have read a news article
and two opposing arguments: one claiming the article is false or misleading, one claiming
it is accurate and trustworthy. Your job is to weigh the evidence and deliver a final verdict.

You MUST respond with ONLY a valid JSON object. No text before it, no text after it,
no markdown formatting, no code blocks. Just the raw JSON.

Use this exact structure:
{
  \\"verdict\\": \\"VERIFIED\\",
  \\"confidence\\": 85,
  \\"summary\\": \\"2-3 sentence explanation of the verdict in Italian.\\",
  \\"prosecutor_points\\": [\\"strongest point from the prosecution\\", \\"second strongest point\\"],
  \\"defender_points\\": [\\"strongest point from the defense\\", \\"second strongest point\\"]
}

Verdict values and when to use them:
- VERIFIED: use only when confidence >= 80 and sources clearly confirm the article
- PARTIALLY_TRUE: article has real elements mixed with inaccuracies or missing context
- INCONCLUSIVE: genuine credible evidence exists on both sides — this is the honest answer when unsure
- MISLEADING: the article is technically not false but is framed to create a wrong impression
- FALSE: use only when confidence >= 75 and sources clearly contradict the article

The confidence score must reflect actual certainty: do not cluster everything between 55-70.
Use the full range."

User message: format all three inputs clearly with labels.

After receiving the response:
- Try to parse it as JSON
- If parsing fails, try extracting JSON from the string with a regex
- If that also fails, return this safe fallback:
  { verdict: "INCONCLUSIVE", confidence: 0, summary: "The judge could not produce a valid verdict. Please try again.", prosecutor_points: [], defender_points: [] }
```

---

## Prompt 5 — Main /analyze endpoint

**Send when:** Prompt 4 is done.
**⚠️ Message Dev 3 when this is working — it unblocks their real API integration.**

```
=== CONTEXT ===
Project: Truth Engine — backend 1 (adversarial agents & verdict)
Working directory: backend1/  |  Runtime: Node.js  |  Port: 3001
Already exists:
• src/utils/search.js — exports webSearch(query, numResults=5) → [{title, url, snippet}]
• src/agents/debate.js — exports:
    runProsecutor(newsText, searchResults) → string
    runDefender(newsText, searchResults) → string
    runJudge(newsText, prosecutorArg, defenderArg) → {verdict, confidence, summary, prosecutor_points, defender_points}
  All three call Regolo.ai (POST https://api.regolo.ai/v1/chat/completions, Bearer REGOLO_API_KEY,
  model "Llama-3.3-70B-Instruct", response at choices[0].message.content)
• src/index.js — Express server on port 3001, /health endpoint
===============

In the existing project, create /src/routes/analyze.js.

Implement POST /analyze — the main Truth Engine pipeline endpoint.

Request body: { "text": "the news article text" }

Step 1 — Validate input:
If text is missing or has fewer than 20 characters:
return 400: { error: "Please provide a news article with at least 20 characters." }

Step 2 — Sanitize input:
Strip any HTML tags from the text. Truncate to 3000 characters maximum.

Step 3 — Extract search query:
Take the first 12 words of the cleaned text as the base query.

Step 4 — Run two searches IN PARALLEL:
- Prosecution search: "smentita falsa bufala " + base query (6 results)
- Defense search: "confermato verificato fonte ufficiale " + base query (6 results)
Use Promise.all for true parallelism.

Step 5 — Run Prosecutor and Defender IN PARALLEL:
- runProsecutor(cleanedText, prosecutionResults)
- runDefender(cleanedText, defenseResults)
Use Promise.all again.

Step 6 — Run Judge (sequential, needs both arguments):
- runJudge(cleanedText, prosecutorArg, defenderArg)

Step 7 — Return this exact JSON:
{
  verdict: judgeResult.verdict,
  confidence: judgeResult.confidence,
  summary: judgeResult.summary,
  prosecutor_argument: prosecutorArg,
  defender_argument: defenderArg,
  prosecutor_sources: prosecutionResults,
  defender_sources: defenseResults,
  prosecutor_points: judgeResult.prosecutor_points,
  defender_points: judgeResult.defender_points
}

Step 8 — Global error handler:
Wrap everything in try/catch. On unhandled error return 500:
{ error: "Analysis failed. Please try again.", details: error.message }

Also add a GET /api/test endpoint (no authentication needed) that checks:
- REGOLO_API_KEY is set (not empty)
- SERPER_API_KEY is set (not empty)
- Makes one minimal Serper search ("test") and checks it returns results
Returns: { regolo: "ok"|"missing", serper: "ok"|"error", ready: true|false }
Use this before the demo to verify everything is working.

Register this router in src/index.js under the path /api.
```

---

## SYNC POINT after Prompt 5

When Prompt 5 is working:

1. Run `curl -X POST <http://localhost:3001/api/analyze> -H "Content-Type: application/json" -d '{"text": "Il governo italiano ha approvato una legge che obbliga tutti i cittadini a registrare i propri dispositivi elettronici entro 30 giorni pena una multa di 5000 euro."}'`
2. Copy the full JSON response
3. **Send it to Dev 3** — they need a real example to replace their mock data

---

## Prompt 6 — Stress test and tuning

**Send when:** Prompt 5 is done and Dev 3 confirmed integration works.

```
=== CONTEXT ===
Project: Truth Engine — backend 1 (adversarial agents & verdict)
Working directory: backend1/  |  Runtime: Node.js  |  Port: 3001
Already exists: full pipeline working. POST http://localhost:3001/api/analyze accepts {text} and returns
{verdict, confidence, summary, prosecutor_argument, defender_argument, prosecutor_sources,
defender_sources, prosecutor_points, defender_points}
===============

In the existing Truth Engine backend, create /src/scripts/runTests.js.

This script tests the full pipeline on 4 different news types to verify the agents are calibrated correctly.

Test cases (hardcode them in the script):
1. "BREAKING: Scienziati italiani hanno dimostrato che il 5G causa perdita di memoria a breve termine. Uno studio dell'Università di Palermo ha esaminato 12 persone e i risultati sono devastanti. Condividi subito prima che censurino questa notizia."
2. "Il Parlamento italiano ha approvato ieri la legge di bilancio con 312 voti favorevoli e 201 contrari. La manovra prevede un aumento del 3% delle pensioni minime a partire da gennaio."
3. "Secondo alcune fonti, il nuovo vaccino anti-influenzale stagionale potrebbe causare effetti collaterali neurologici in soggetti predisposti. I dati sono ancora in fase di analisi."
4. "Un famoso politico italiano ha dichiarato che 'l'immigrazione illegale è aumentata del 400% negli ultimi due anni'. I dati ufficiali del Ministero mostrano un incremento del 23%."

For each test case:
- Call POST <http://localhost:3001/api/analyze>
- Wait for the result (use sequential calls with await, not parallel — avoid rate limits)
- Print: TEST [number] | VERDICT: [verdict] | CONFIDENCE: [confidence]% | SUMMARY: [first 80 chars of summary]

At the end print a summary table of all 4 results.

Expected behavior:
- Test 1 should be FALSE or MISLEADING with high confidence
- Test 2 should be VERIFIED or PARTIALLY_TRUE
- Test 3 should be INCONCLUSIVE
- Test 4 should be MISLEADING or PARTIALLY_TRUE

If the results don't match expectations, review the judge prompt in /src/agents/debate.js
and make it more decisive. Common issue: the judge being too cautious and marking everything INCONCLUSIVE.
Fix: add to the judge prompt "Only use INCONCLUSIVE when you genuinely cannot decide after weighing all evidence."
```

---

## Prompt 7 — Final hardening

**Send when:** Prompt 6 tests pass. This is your last task.

```
=== CONTEXT ===
Project: Truth Engine — backend 1 (adversarial agents & verdict)
Working directory: backend1/  |  Runtime: Node.js  |  Port: 3001
Already exists: full pipeline working and stress-tested. src/routes/analyze.js handles POST /api/analyze.
The pipeline runs: 2 parallel Serper searches → runProsecutor + runDefender in parallel → runJudge → JSON response.
===============

In the existing Truth Engine backend, add these production-level protections to src/routes/analyze.js:

1. Request timeout: if the full pipeline takes more than 30 seconds, cancel it and return:
   { error: "Analysis timed out. The news article may be too complex. Please try again." }
   with status 408. Use Promise.race with a timeout promise.

2. Basic rate limiting: track request counts per IP in memory.
   If an IP sends more than 8 requests in 60 seconds, return 429:
   { error: "Too many requests. Please wait 60 seconds before trying again." }

3. Add request logging to console for every /api/analyze call:
   Format: [HH:MM:SS] ANALYZE | first 60 chars of text... | verdict: X | confidence: Y | Zms
   Calculate duration from start to end of the request.

4. Add CORS headers explicitly to allow requests from any localhost port
   (Dev 3's Next.js frontend runs on port 3000 by default).

Test the timeout by temporarily adding a 35-second sleep at the start of the pipeline,
verify you get the timeout error, then remove the sleep.
```