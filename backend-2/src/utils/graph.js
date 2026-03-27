function buildSourceGraph(versionsWithScores) {
  // Deduplicate by domain, keeping the entry with highest credibility score
  const domainMap = new Map();
  for (const v of versionsWithScores) {
    const existing = domainMap.get(v.domain);
    if (!existing || v.credibility.score > existing.credibility.score) {
      domainMap.set(v.domain, v);
    }
  }

  const domains = Array.from(domainMap.values());

  // Build nodes
  const nodes = domains.map((v, i) => {
    const node = {
      id: i + 1,
      label: v.domain,
      color: v.credibility.color,
      size: Math.round(v.credibility.score / 3 + 10),
      credibilityScore: v.credibility.score,
    };
    if (v.isSource) node.isSource = true;
    return node;
  });

  // Map domain → node id
  const domainToId = new Map(domains.map((v, i) => [v.domain, i + 1]));

  // Map domain → similarity for edge-building logic
  const domainToSimilarity = new Map(domains.map((v) => [v.domain, v.similarity]));

  // Find root (isSource node)
  const rootDomain = domains.find((v) => v.isSource)?.domain;
  const rootId = rootDomain ? domainToId.get(rootDomain) : nodes[0]?.id;

  // Build edges: each non-source node connects FROM the node with the closest
  // higher similarity TO itself, creating a propagation tree
  const edges = [];
  const nonSourceDomains = domains.filter((v) => !v.isSource);

  // Sort non-source nodes by similarity descending so we process high-sim first
  const sorted = [...nonSourceDomains].sort((a, b) => b.similarity - a.similarity);

  for (const v of sorted) {
    const toId = domainToId.get(v.domain);
    const vSim = domainToSimilarity.get(v.domain);

    // Find the already-processed node with the closest higher similarity
    // "already processed" includes the source node and nodes we've already added edges for
    const processedDomains = [
      ...(rootDomain ? [rootDomain] : []),
      ...sorted.slice(0, sorted.indexOf(v)).map((x) => x.domain),
    ];

    let bestFromId = rootId;
    let bestDiff = Infinity;

    for (const candidate of processedDomains) {
      const cSim = domainToSimilarity.get(candidate);
      if (cSim > vSim) {
        const diff = cSim - vSim;
        if (diff < bestDiff) {
          bestDiff = diff;
          bestFromId = domainToId.get(candidate);
        }
      }
    }

    // Fall back to root if no candidate with higher similarity was found
    if (bestFromId === undefined) bestFromId = rootId;

    edges.push({ from: bestFromId, to: toId, label: "republished by", arrows: "to" });
  }

  return { nodes, edges };
}

module.exports = { buildSourceGraph };

// Self-test — only runs when executed directly
if (require.main === module) {
  const mockVersions = [
    {
      title: "Breaking: Test news original source",
      url: "https://ansa.it/article/1",
      domain: "ansa.it",
      snippet: "Original reporting on the story.",
      similarity: 1.0,
      mutationScore: 0,
      isSource: true,
      credibility: { score: 92, level: "high", color: "#1D9E75" },
    },
    {
      title: "Test news republished",
      url: "https://corriere.it/article/1",
      domain: "corriere.it",
      snippet: "Republished version of the story.",
      similarity: 0.87,
      mutationScore: 4,
      isSource: false,
      credibility: { score: 80, level: "high", color: "#1D9E75" },
    },
    {
      title: "Sensationalized version",
      url: "https://tabloid.it/article/1",
      domain: "tabloid.it",
      snippet: "Heavily mutated spin on the story.",
      similarity: 0.62,
      mutationScore: 12,
      isSource: false,
      credibility: { score: 30, level: "low", color: "#E53E3E" },
    },
  ];

  const graph = buildSourceGraph(mockVersions);
  console.log("Graph result:");
  console.log(JSON.stringify(graph, null, 2));

  const expectedNodes = 3;
  const expectedEdges = 2;
  console.log(`\nNodes: ${graph.nodes.length} (expected ${expectedNodes}) — ${graph.nodes.length === expectedNodes ? "PASS" : "FAIL"}`);
  console.log(`Edges: ${graph.edges.length} (expected ${expectedEdges}) — ${graph.edges.length === expectedEdges ? "PASS" : "FAIL"}`);

  const sourceNode = graph.nodes.find((n) => n.isSource);
  console.log(`Source node present: ${sourceNode ? "PASS" : "FAIL"} (label: ${sourceNode?.label})`);
}
