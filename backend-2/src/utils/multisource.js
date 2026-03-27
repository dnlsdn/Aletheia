const { webSearch } = require("./search");

async function fetchVersions(newsText) {
  const words = newsText
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, 10);

  const phrase = words.join(" ");
  const queryA = phrase;
  const queryB = "notizia " + phrase;
  const queryC = "dichiarazione " + phrase;

  const [resA, resB, resC] = await Promise.all([
    webSearch(queryA, 6),
    webSearch(queryB, 6),
    webSearch(queryC, 6),
  ]);

  const merged = [...resA, ...resB, ...resC];

  const seen = new Set();
  const deduped = [];
  for (const item of merged) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    deduped.push(item);
    if (deduped.length === 15) break;
  }

  return deduped.map((item) => {
    let domain = "";
    try {
      domain = new URL(item.url).hostname.replace(/^www\./, "");
    } catch {
      domain = item.url;
    }
    return { title: item.title, url: item.url, snippet: item.snippet, domain };
  });
}

module.exports = { fetchVersions };

if (require.main === module) {
  require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
  fetchVersions("Il governo ha approvato una nuova legge sull immigrazione").then(
    (versions) => {
      console.log(`Found ${versions.length} versions`);
      versions.forEach((v) => console.log(" -", v.domain));
    }
  );
}
