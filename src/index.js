require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PROXY_SECRET = process.env.PROXY_SECRET || '';
const RESELLERCLUB_BASE_URL = process.env.RESELLERCLUB_BASE_URL || 'https://httpapi.com/api';
const RC_RESELLER_ID = process.env.RC_RESELLER_ID || '';
const RC_API_KEY = process.env.RC_API_KEY || '';

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, max: Number(process.env.RATE_LIMIT_PER_MINUTE || 60) }));

function requireProxySecret(req, res, next) {
  if (!PROXY_SECRET) {
    return res.status(500).json({ error: 'server_not_configured', message: 'PROXY_SECRET is missing.' });
  }

  const provided = req.header('x-proxy-secret');
  if (provided !== PROXY_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  return next();
}

function assertResellerClubConfig(res) {
  if (!RC_RESELLER_ID || !RC_API_KEY) {
    res.status(500).json({ error: 'server_not_configured', message: 'RC_RESELLER_ID or RC_API_KEY is missing.' });
    return false;
  }
  return true;
}

app.get('/', (req, res) => {
  res.json({
    service: 'AtlasX Media ResellerClub Proxy',
    company: 'Altura Holdings LLC',
    status: 'online',
    endpoints: ['/health', '/api/resellerclub/*']
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'resellerclub-proxy', time: new Date().toISOString() });
});

app.all('/api/resellerclub/*', requireProxySecret, async (req, res) => {
  if (!assertResellerClubConfig(res)) return;

  try {
    const endpoint = req.params[0];
    const targetUrl = `${RESELLERCLUB_BASE_URL}/${endpoint}`;
    const params = {
      ...(req.query || {}),
      'auth-userid': RC_RESELLER_ID,
      'api-key': RC_API_KEY
    };

    const response = await axios({
      method: req.method,
      url: targetUrl,
      params,
      data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
      timeout: Number(process.env.UPSTREAM_TIMEOUT_MS || 20000)
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({
      error: 'upstream_error',
      status,
      message: error.response?.data || error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AtlasX Media ResellerClub proxy listening on port ${PORT}`);
});
