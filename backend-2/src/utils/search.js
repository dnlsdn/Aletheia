const axios = require("axios");

async function webSearch(query, numResults = 5) {
  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      { q: query, num: numResults, gl: "it", hl: "it" },
      {
        headers: {
          "X-API-Key": process.env.SERPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const organic = response.data.organic || [];
    return organic.map((item) => ({
      title: item.title || "",
      url: item.link || "",
      snippet: item.snippet || "",
    }));
  } catch (err) {
    console.error("[webSearch] error:", err.message);
    return [];
  }
}

module.exports = { webSearch };
