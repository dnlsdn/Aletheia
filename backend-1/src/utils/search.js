const axios = require('axios');

async function webSearch(query, numResults = 5) {
  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query, num: numResults, gl: 'it', hl: 'it' },
      {
        headers: {
          'X-API-Key': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const organic = response.data.organic || [];
    return organic.map(({ title, link, snippet }) => ({
      title: title || '',
      url: link || '',
      snippet: snippet || '',
    }));
  } catch (err) {
    console.error('[webSearch] error:', err.message);
    return [];
  }
}

module.exports = { webSearch };

if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
  webSearch('notizia falsa bufala italia').then((results) => {
    console.log(`[self-test] ${results.length} results:`);
    results.forEach((r, i) => console.log(`  ${i + 1}. ${r.title}\n     ${r.url}`));
  });
}
