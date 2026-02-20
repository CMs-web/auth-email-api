require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');

const sendRoute = require('./routes/send');
const keysRoute = require('./routes/keys');

const app = express();
app.use(express.json({ limit: '1mb' }));

// Trust Render's proxy
app.set('trust proxy', 1);

// --- Global rate limiter: 100 req/min per IP ---
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Max 100/min per IP.' }
});
app.use(globalLimiter);

// --- Stricter limiter for key generation ---
const keyGenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many key generation requests.' }
});

// --- Health check (Render uses this) ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/v1/send', sendRoute);
app.use('/internal/keys', keyGenLimiter, keysRoute);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});