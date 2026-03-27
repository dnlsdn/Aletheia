require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend-2', port: PORT });
});

const mutationRouter = require('./routes/mutation');
app.use('/', mutationRouter);

app.listen(PORT, () => {
  console.log(`Backend 2 running on http://localhost:${PORT}`);
});
