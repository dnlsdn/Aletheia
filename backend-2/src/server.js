require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend-2', port: PORT });
});

// Main endpoint — Mutation tracking + source graph
// POST /mutation
// Body: { "text": "testo della notizia" }
app.post('/mutation', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing "text" field' });

  // TODO: implement mutation tracking + embeddings (Dev 2 prompts)
  res.status(501).json({ error: 'Not implemented yet' });
});

app.listen(PORT, () => {
  console.log(`Backend 2 running on http://localhost:${PORT}`);
});
