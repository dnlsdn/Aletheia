export const mockAnalysis = {
  verdict: "MISLEADING",
  confidence: 74,
  summary: "The article contains a real underlying fact but frames it in a way designed to generate disproportionate fear. The sources found do not support the severity of the claims made in the headline.",
  prosecutor_argument: "The core claim about a government regulation is real, but the article significantly exaggerates its scope. Official sources show the regulation applies only to commercial devices, not personal ones. The framing 'obbliga tutti i cittadini' is factually inaccurate according to the Ministry press release dated January 2026.",
  defender_argument: "The regulation in question was indeed approved by Parliament and is legally binding. Multiple news outlets including ANSA and Corriere della Sera reported on it the same day. The article correctly identifies the penalty amount and the 30-day timeline.",
  prosecutor_sources: [
    { title: "Ministero chiarisce: la norma riguarda solo i dispositivi aziendali", url: "https://governo.it/comunicato-123", snippet: "Il Ministro ha precisato che le nuove disposizioni si applicano esclusivamente ai dispositivi utilizzati in ambito lavorativo..." },
    { title: "Bufala virale: nessun obbligo per i privati cittadini", url: "https://pagella-politica.it/analisi/456", snippet: "La notizia che circola sui social è fuorviante. La legge approvata ieri non prevede alcun registro per i dispositivi personali..." }
  ],
  defender_sources: [
    { title: "Approvata la legge sui dispositivi elettronici", url: "https://ansa.it/notizie/789", snippet: "Il parlamento ha approvato con 312 voti favorevoli la nuova normativa che prevede la registrazione obbligatoria..." },
    { title: "Dispositivi elettronici: ecco cosa cambia da gennaio", url: "https://corriere.it/economia/abc", snippet: "La multa prevista è di 5.000 euro per chi non ottempera all obbligo entro i 30 giorni stabiliti dalla normativa..." }
  ],
  prosecutor_points: ["Official Ministry statement contradicts the 'all citizens' framing", "Penalty scope is limited to commercial use, not personal devices"],
  defender_points: ["Parliamentary vote and approval date confirmed by multiple sources", "Penalty amount and 30-day timeline are factually accurate"]
}

export const mockMutation = {
  versions: [
    { title: "Approvata la legge sui dispositivi elettronici", url: "https://ansa.it/notizie/789", domain: "ansa.it", snippet: "Il parlamento ha approvato la nuova normativa che prevede la registrazione obbligatoria dei dispositivi elettronici aziendali.", similarity: 0.94, mutationScore: 6, isSource: true, credibility: { score: 92, level: "high", color: "#1D9E75" } },
    { title: "Nuova legge: registra i tuoi dispositivi o paghi 5000 euro", url: "https://blog-tech-italia.com/post-456", domain: "blog-tech-italia.com", snippet: "Una nuova legge approvata ieri obbliga tutti i cittadini italiani a registrare i propri dispositivi elettronici entro 30 giorni.", similarity: 0.71, mutationScore: 29, isSource: false, credibility: { score: 38, level: "low", color: "#E24B4A" } },
    { title: "SCANDALO: il governo ti spia attraverso i dispositivi", url: "https://verita-nascosta.net/articolo-789", domain: "verita-nascosta.net", snippet: "Il regime vuole sapere tutto di te. La nuova legge fascista obbliga TUTTI gli italiani a registrare OGNI dispositivo o pagare 5000 euro di multa.", similarity: 0.38, mutationScore: 62, isSource: false, credibility: { score: 12, level: "low", color: "#E24B4A" } },
    { title: "Dispositivi elettronici: cosa dice davvero la nuova normativa", url: "https://ilsole24ore.com/articolo-tecnologia", domain: "ilsole24ore.com", snippet: "La normativa chiarisce gli obblighi per le aziende. I privati cittadini non sono soggetti alle nuove disposizioni.", similarity: 0.58, mutationScore: 42, isSource: false, credibility: { score: 88, level: "high", color: "#1D9E75" } }
  ],
  graph: {
    nodes: [
      { id: 1, label: "ansa.it", color: "#1D9E75", size: 40, isSource: true },
      { id: 2, label: "blog-tech-italia.com", color: "#E24B4A", size: 22 },
      { id: 3, label: "verita-nascosta.net", color: "#E24B4A", size: 14 },
      { id: 4, label: "ilsole24ore.com", color: "#1D9E75", size: 39 }
    ],
    edges: [
      { from: 1, to: 2, arrows: "to" },
      { from: 2, to: 3, arrows: "to" },
      { from: 1, to: 4, arrows: "to" }
    ]
  },
  viralityRisk: {
    score: 68,
    label: "High risk — rapid spread likely before a debunk can contain it",
    breakdown: { shortMessage: 10, urgencyWords: 8, emotionalWords: 8, manyVersions: 20, lowCredibilitySources: 20 }
  }
}
