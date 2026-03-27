## Your role: Backend — Mutation Tracking, Source Graph & Virality Risk

You are building the "how did this news spread and mutate?" side of Truth Engine.
Your backend finds multiple versions of the same news across different sources, measures
how much each version has drifted from the original, builds a visual graph of the sources,
and estimates how likely the article is to go viral before anyone can debunk it.

**Your backend runs on port 3002.Dev 1's backend runs on port 3001.Dev 3 (frontend) will call your API at `POST /mutation`.**

> Paste each prompt into Google Antigravity. Review the implementation plan it generates before approving. Let it run. Test. Then move to the next prompt.
> 

---

## STEP 0 — Team sync (do this together, first 30 min)

Before writing any code, the three of you must agree on the **JSON contract** that your `/mutation` endpoint returns, so Dev 3 can build the UI with mock data without waiting for you.

**Share this with Dev 3 right now:**

```json
{
  "versions": [
    {
      "title": "Article title",
      "url": "https://...",
      "domain": "ansa.it",
      "snippet": "Short excerpt from the article",
      "similarity": 0.94,
      "mutationScore": 6,
      "isSource": true,
      "credibility": {
        "score": 92,
        "level": "high",
        "color": "#1D9E75"
      }
    }
  ],
  "graph": {
    "nodes": [
      { "id": 1, "label": "ansa.it", "color": "#1D9E75", "size": 30, "credibilityScore": 92 }
    ],
    "edges": [
      { "from": 1, "to": 2, "label": "republished by" }
    ]
  },
  "viralityRisk": {
    "score": 65,
    "label": "High risk — rapid spread likely before a debunk can contain it",
    "breakdown": {
      "shortMessage": 20,
      "urgencyWords": 15,
      "emotionalWords": 10,
      "manyVersions": 20,
      "lowCredibilitySources": 0
    }
  }
}
```

**Also tell Dev 1:** your backend runs on port 3002 and your endpoint is `POST /mutation`.

Once everyone knows what to expect from each other, you can all work independently.

---

## Prompt 1 — Project setup

**Send when:** immediately after Step 0. No dependencies on anyone else.

```
Create a Node.js backend project for a news mutation tracking system called Truth Engine Mutation.

Project structure:
- /src/utils/     (all processing logic goes here)
- /src/routes/    (API endpoints)
- /src/index.js   (entry point)

Install these dependencies: express, dotenv, axios, cors

Create a .env file with these empty fields:
SERPER_API_KEY=
REGOLO_API_KEY=
PORT=3002

In src/index.js:
- Load dotenv at the very top
- Set up Express with CORS enabled for all origins
- Parse JSON request bodies
- Start the server on PORT from .env (fallback: 3002)
- Add GET /health that returns: { status: "ok", service: "truth-engine-mutation" }
- Log "Truth Engine mutation backend running on port 3002" on startup
```

---

## Prompt 2 — Multi-source fetcher

**Send when:** Prompt 1 is running and http://localhost:3002/health responds.

```
In the existing project, create /src/utils/search.js.

Export one async function: webSearch(query, numResults = 5)

The function must:
1. POST to <https://google.serper.dev/search>
2. Headers: { "X-API-Key": process.env.SERPER_API_KEY, "Content-Type": "application/json" }
3. Body: { q: query, num: numResults, gl: "it", hl: "it" }
4. Return array: [{ title, url, snippet }]
5. On any error: log it and return [] — never throw

Then create /src/utils/multisource.js.

Export one async function: fetchVersions(newsText)

This function finds multiple versions of the same news from different sources:
1. Extract the first 10 meaningful words from newsText (skip words shorter than 4 characters)
2. Build these 3 search queries using those words:
   - Query A: the words joined as a plain phrase
   - Query B: "notizia " + the phrase (finds news coverage)
   - Query C: "dichiarazione " + the phrase (finds official statements and quotes)
3. Run all 3 searches IN PARALLEL with Promise.all, 6 results each
4. Merge all results into a single array
5. Remove duplicates by URL (keep only the first occurrence of each URL)
6. Extract the domain from each URL (e.g. "ansa.it" from "<https://www.ansa.it/>...")
7. Return the deduplicated array: [{ title, url, snippet, domain }], max 15 items

At the bottom, add a self-test block (only runs when file is executed directly):
- Call fetchVersions("Il governo ha approvato una nuova legge sull immigrazione")
- Print the number of versions found and the list of domains
```

---

## Prompt 3 — Semantic similarity and Mutation Score (powered by Regolo.ai embeddings)

**Send when:** Prompt 2 is done and the self-test shows multiple results.

```
In the existing project, create /src/utils/similarity.js.

This module computes how semantically similar two texts are using REAL semantic embeddings
from Regolo.ai (EU-hosted, zero data retention). This is more accurate than keyword matching
because it captures meaning, not just word overlap.

Regolo.ai embeddings API:
- URL: https://api.regolo.ai/v1/embeddings
- Method: POST
- Headers: { "Authorization": "Bearer " + process.env.REGOLO_API_KEY, "Content-Type": "application/json" }
- Body: { "model": "text-embedding-3-small", "input": textToEmbed }
  NOTE: if "text-embedding-3-small" returns an error, check the available embedding models
  in the Regolo.ai dashboard and use the correct model name (commonly bge-m3 or similar).
- Response: data.data[0].embedding  (array of floats, the embedding vector)

Export two functions:

1. async getEmbedding(text)
   - Calls the Regolo.ai embeddings API with the given text
   - Returns the embedding array (array of floats)
   - On error: log it and return null

2. computeCosineSimilarity(vecA, vecB)
   - Pure math, no API call needed
   - dot_product = sum of (vecA[i] * vecB[i]) for all i
   - magnitude_A = sqrt(sum of vecA[i]^2)
   - magnitude_B = sqrt(sum of vecB[i]^2)
   - return dot_product / (magnitude_A * magnitude_B)
   - If either vector is null or empty: return 0

3. async computeSimilarity(text1, text2)
   - Calls getEmbedding on both texts IN PARALLEL using Promise.all
   - If either embedding fails (null), fall back to a simple word overlap ratio:
     count shared words / max(word count of text1, word count of text2)
   - Otherwise return computeCosineSimilarity(embedding1, embedding2)
   - This fallback ensures the pipeline never fails even if the embeddings API is down

Then create /src/utils/mutation.js.

Export one async function: computeMutationScores(originalText, versions)
- versions is an array of { title, url, snippet, domain }
- For each version, call computeSimilarity(originalText, version.snippet)
- IMPORTANT: run the similarity calls sequentially (not parallel) to avoid rate limiting
- Add to each version:
    similarity: the float (0-1)
    mutationScore: Math.round((1 - similarity) * 100)  (0 = identical, 100 = completely changed)
    isSource: false (will be set to true for the most similar one)
- Sort the versions by similarity descending (most similar first)
- Mark the first item (highest similarity) as isSource: true
- Return the sorted array with all new fields added

At the bottom of similarity.js, add a self-test (only runs when file is executed directly):
- Call computeSimilarity("Il governo ha approvato una legge", "Il parlamento ha approvato la norma")
- Call computeSimilarity("Il governo ha approvato una legge", "La pizza napoletana è ottima")
- Print both results — first should be > 0.7, second should be < 0.4
```

---

## Prompt 4 — Source Credibility assessment

**Send when:** Prompt 3 is done.

```
In the existing project, create /src/utils/credibility.js.

Export one function: assessCredibility(domain)

This function scores how trustworthy a news source is, based on its domain name.
Return: { score: 0-100, level: "high"|"medium"|"low", color: string }

Scoring rules:

HIGH credibility (score 80-95, level "high", color "#1D9E75"):
These domains are known reliable Italian and international outlets.
Check if the domain CONTAINS any of these strings:
ansa.it, corriere.it, repubblica.it, lastampa.it, sole24ore, ilsole24ore,
stampa.it, ilmessaggero.it, ilgiornale.it, tgcom24, mediaset, rai.it, raiplay,
bbc.com, reuters.com, apnews.com, afp.com, dw.com, lemonde.fr, theguardian.com,
nytimes.com, washingtonpost.com, economist.com, nature.com, science.org,
governo.it, quirinale.it, senato.it, camera.it, istat.it, eur-lex.europa.eu,
who.int, un.org, .edu, .gov

MEDIUM credibility (score 45-79, level "medium", color "#BA7517"):
- Domain has HTTPS (starts with https in the original URL, or you can check domain length > 5)
- Domain has no numbers in it
- Domain length is between 5 and 25 characters
- Does not match any high-credibility pattern

LOW credibility (score 0-44, level "low", color "#E24B4A"):
- Everything else: very short domains, domains with numbers, unknown patterns

Assign a specific score within each range based on how many positive signals the domain has.
For example, a .gov domain gets 95, ansa.it gets 92, a clean medium domain gets 55.
```

---

## Prompt 5 — Source Credibility Graph builder

**Send when:** Prompt 4 is done.

```
In the existing project, create /src/utils/graph.js.

Export one function: buildSourceGraph(versionsWithScores)
- Input: array of versions that already have similarity, mutationScore, isSource, and domain fields
- Each version must also have a credibility field added by assessCredibility

The function must build a vis-network compatible graph object.

Logic:
1. Create one node per unique domain
   node structure: { id: index+1, label: domain, color: credibility.color, size: credibilityScore/3 + 10 }
   (size formula gives nodes between 10 and 42 in size — proportional to credibility)

2. The node marked isSource: true gets an extra field: isSource: true

3. Build edges using this logic:
   - The isSource node is the root
   - Every other node gets an edge FROM the node with the closest higher similarity TO itself
   - This creates a tree structure showing how the news propagated
   - Edge structure: { from: nodeId, to: nodeId, label: "republished by", arrows: "to" }
   - If no clear propagation path exists, connect directly to the root

4. Return: { nodes: [...], edges: [...] }

Add a self-test at the bottom (only runs when file is executed directly):
- Build a mock versions array with 3 items (one isSource, two others with different domains)
- Call buildSourceGraph and print the result
- Verify it has the right number of nodes and edges
```

---

## Prompt 6 — Virality Risk Score

**Send when:** Prompt 5 is done.

```
In the existing project, create /src/utils/virality.js.

Export one function: computeViralityRisk(newsText, versionsWithScores)

This function estimates how quickly a news article could spread before being debunked.
It uses a transparent, rule-based scoring system (no AI, just heuristics).

Score components (total max = 100):

1. shortMessage (max 20 points):
   - Count words in newsText
   - < 30 words: 20 points (very short = very shareable)
   - 30-80 words: 10 points
   - > 80 words: 0 points

2. urgencyWords (max 20 points):
   - Check for these words (case-insensitive) in newsText:
     BREAKING, ESCLUSIVO, URGENTE, ATTENZIONE, SUBITO, ORA, ADESSO, IMMEDIATO,
     SHOCKING, INCREDIBILE, CLAMOROSO, CENSURA, CENSORATO, VIRALE
   - 4 points per word found, max 20

3. emotionalWords (max 20 points):
   - Check for: scandalo, vergogna, paura, pericolo, minaccia, catastrofe,
     terrore, orrore, disastro, morte, tragedia, allarme, emergenza, crisi
   - 4 points per word found, max 20

4. manyVersions (max 20 points):
   - Count versions found
   - >= 8 versions: 20 points (already spreading)
   - 4-7 versions: 10 points
   - < 4 versions: 0 points

5. lowCredibilitySources (max 20 points):
   - Count how many versions have credibility.level === "low"
   - >= 3 low-credibility sources: 20 points
   - 1-2 low-credibility sources: 10 points
   - 0 low-credibility sources: 0 points

Calculate total = sum of all components (0-100).

Build a label based on the score:
- 0-30: "Low risk — limited spread expected"
- 31-60: "Medium risk — could spread significantly within hours"
- 61-80: "High risk — rapid spread likely before a debunk can contain it"
- 81-100: "Critical risk — designed to go viral, extremely hard to debunk in time"

Return:
{
  score: total,
  label: label string,
  breakdown: { shortMessage, urgencyWords, emotionalWords, manyVersions, lowCredibilitySources }
}
```

---

## Prompt 7 — Main /mutation endpoint

**Send when:** Prompt 6 is done.
**⚠️ Message Dev 3 when this is working — it unblocks their real API integration.**

```
In the existing project, create /src/routes/mutation.js.

Implement POST /mutation — the main endpoint that orchestrates all mutation analysis.

Request body: { "text": "the news article text" }

Pipeline:
1. Validate: if text is missing or < 20 chars, return 400:
   { error: "Please provide a news article with at least 20 characters." }

2. Strip HTML tags from text. Truncate to 3000 characters.

3. Fetch multiple versions: fetchVersions(cleanedText)

4. Compute mutation scores: computeMutationScores(cleanedText, versions)
   This adds similarity, mutationScore, isSource to each version.

5. Assess credibility for each version:
   For each version, add a credibility field: assessCredibility(version.domain)

6. Build source graph: buildSourceGraph(versionsWithCredibility)

7. Compute virality risk: computeViralityRisk(cleanedText, versionsWithCredibility)

8. Return this exact structure:
{
  versions: versionsWithCredibility,
  graph: graphData,
  viralityRisk: viralityData
}

9. On unhandled error: return 500 with { error: "Mutation analysis failed.", details: error.message }

Also add GET /mutation/test that checks:
- SERPER_API_KEY is set
- Runs one test search ("test notizia")
Returns: { serper: "ok"|"error", ready: true|false }

Register this router in src/index.js.

Test with curl:
curl -X POST <http://localhost:3002/mutation> \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Il governo italiano ha approvato una nuova legge che obbliga tutti i cittadini a registrare i propri dispositivi elettronici entro 30 giorni pena una multa di 5000 euro."}'
```

---

## SYNC POINT after Prompt 7

When Prompt 7 is working:

1. Run the curl test and copy the full JSON response
2. **Send it to Dev 3** — they need a real example to replace their mock data
3. Also send the raw output to Dev 1 so they know your endpoint is live

---

## Prompt 8 — Final hardening

**Send when:** Prompt 7 is done and Dev 3 confirmed integration works.

```
In the existing Truth Engine mutation backend, add these robustness improvements:

1. Timeout: if the full pipeline takes more than 20 seconds, return 408:
   { error: "Mutation analysis timed out. Please try again." }
   Use Promise.race with a timeout promise.

2. Rate limiting: same IP can only make 8 requests per 60 seconds.
   Exceed: return 429 { error: "Too many requests. Please wait 60 seconds." }

3. Request logging:
   [HH:MM:SS] MUTATION | first 60 chars of text... | versions: N | virality: X | Zms

4. If fetchVersions returns fewer than 2 results, still proceed — just return what you have.
   Never fail because of sparse search results. The virality score will reflect the low version count.

5. Add CORS headers to allow requests from any localhost port.
```