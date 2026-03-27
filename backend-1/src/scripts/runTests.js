const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/analyze';

const TEST_CASES = [
  {
    number: 1,
    text: "BREAKING: Scienziati italiani hanno dimostrato che il 5G causa perdita di memoria a breve termine. Uno studio dell'Università di Palermo ha esaminato 12 persone e i risultati sono devastanti. Condividi subito prima che censurino questa notizia.",
    expected: ['FALSE', 'MISLEADING'],
  },
  {
    number: 2,
    text: "Il Parlamento italiano ha approvato ieri la legge di bilancio con 312 voti favorevoli e 201 contrari. La manovra prevede un aumento del 3% delle pensioni minime a partire da gennaio.",
    expected: ['VERIFIED', 'PARTIALLY_TRUE'],
  },
  {
    number: 3,
    text: "Secondo alcune fonti, il nuovo vaccino anti-influenzale stagionale potrebbe causare effetti collaterali neurologici in soggetti predisposti. I dati sono ancora in fase di analisi.",
    expected: ['INCONCLUSIVE'],
  },
  {
    number: 4,
    text: "Un famoso politico italiano ha dichiarato che 'l'immigrazione illegale è aumentata del 400% negli ultimi due anni'. I dati ufficiali del Ministero mostrano un incremento del 23%.",
    expected: ['MISLEADING', 'PARTIALLY_TRUE'],
  },
];

async function runTest(testCase) {
  console.log(`\nRunning TEST ${testCase.number}...`);
  try {
    const response = await axios.post(BASE_URL, { text: testCase.text }, {
      timeout: 120000,
    });
    const { verdict, confidence, summary } = response.data;
    const shortSummary = summary ? summary.slice(0, 80) : '(no summary)';
    const passed = testCase.expected.includes(verdict);
    console.log(
      `TEST ${testCase.number} | VERDICT: ${verdict} | CONFIDENCE: ${confidence}% | SUMMARY: ${shortSummary}`
    );
    return { number: testCase.number, verdict, confidence, summary: shortSummary, passed, expected: testCase.expected };
  } catch (err) {
    const msg = err.response ? JSON.stringify(err.response.data) : (err.code || err.message);
    console.error(`TEST ${testCase.number} FAILED (request error): ${msg}`);
    return { number: testCase.number, verdict: 'ERROR', confidence: 0, summary: msg, passed: false, expected: testCase.expected };
  }
}

async function main() {
  console.log('=== Truth Engine — Pipeline Calibration Tests ===\n');
  console.log('Running 4 sequential tests (sequential to avoid rate limits)...');

  const results = [];
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);
  }

  console.log('\n\n=== SUMMARY TABLE ===\n');
  console.log('TEST | VERDICT          | CONF | PASS | EXPECTED');
  console.log('-----|------------------|------|------|-----------------------------');
  for (const r of results) {
    const testNum = String(r.number).padEnd(4);
    const verdict = r.verdict.padEnd(16);
    const conf = String(r.confidence).padStart(3) + '%';
    const pass = r.passed ? 'PASS' : 'FAIL';
    const expected = r.expected.join(' / ');
    console.log(`${testNum} | ${verdict} | ${conf} | ${pass} | ${expected}`);
  }

  const passed = results.filter(r => r.passed).length;
  console.log(`\nResult: ${passed}/4 tests matched expected verdict.`);

  if (passed < 4) {
    console.log('\nCalibration issues detected. Review /src/agents/debate.js — judge prompt.');
    console.log('Common fix: ensure judge is not defaulting to INCONCLUSIVE for clear-cut cases.');
    process.exit(1);
  } else {
    console.log('\nAll tests passed. Agents are calibrated correctly.');
  }
}

main();
