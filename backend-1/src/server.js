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

const analyzeRouter = require('./routes/analyze');
app.use('/api', analyzeRouter);

app.listen(PORT, () => {
  console.log(`Backend 1 running on http://localhost:${PORT}`);
});
