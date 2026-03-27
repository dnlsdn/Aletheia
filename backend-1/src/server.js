require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend-1', port: PORT });
});

// Main endpoint — Prosecutor vs Defender vs Judge
// POST /api/analyze
// Body: { "text": "testo della notizia" }
app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing "text" field' });

  // TODO: implement adversarial agents pipeline (Dev 1 prompts)
  res.status(501).json({ error: 'Not implemented yet' });
});

app.listen(PORT, () => {
  console.log(`Backend 1 running on http://localhost:${PORT}`);
});
