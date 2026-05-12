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
const RESELLERCLUB_DOMAINCHECK_BASE_URL = process.env.RESELLERCLUB_DOMAINCHECK_BASE_URL || 'https://domaincheck.httpapi.com/api';
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

function normalizeList(value) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : String(value).split(',');
  return values
    .flatMap((entry) => String(entry).split(','))
    .map((entry) => entry.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
}

function appendRepeatedParams(params, key, values) {
  values.forEach((value) => params.append(key, value));
}

function unique(values) {
  return [...new Set(values)];
}

function buildDomainCheckQuery(query) {
  const explicitTlds = query.tlds || query.tld;
  const requestedTlds = normalizeList(explicitTlds);
  const domainNames = [];
  const discoveredTlds = [];

  normalizeList(query['domain-name'] || query.domain || query.domains).forEach((domainName) => {
    const parts = domainName.split('.').filter(Boolean);
    const lastPart = parts.at(-1);

    if (parts.length > 1 && (!explicitTlds || requestedTlds.includes(lastPart))) {
      domainNames.push(parts.slice(0, -1).join('.'));
      if (!explicitTlds) discoveredTlds.push(lastPart);
      return;
    }

    domainNames.push(domainName);
  });

  return {
    domainNames: unique(domainNames),
    tlds: unique(requestedTlds.length > 0 ? requestedTlds : discoveredTlds.length > 0 ? discoveredTlds : ['com'])
  };
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
    endpoints: ['/health', '/api/domain/check', '/api/resellerclub/*']
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'resellerclub-proxy', time: new Date().toISOString() });
});

app.get('/api/domain/check', requireProxySecret, async (req, res) => {
  if (!assertResellerClubConfig(res)) return;

  const { domainNames, tlds } = buildDomainCheckQuery(req.query);

  if (domainNames.length === 0) {
    return res.status(400).json({
      error: 'missing_domain_name',
      message: 'Send domain-name, domain, or domains as a query parameter.'
    });
  }

  try {
    const params = new URLSearchParams({
      'auth-userid': RC_RESELLER_ID,
      'api-key': RC_API_KEY
    });
    appendRepeatedParams(params, 'domain-name', domainNames);
    appendRepeatedParams(params, 'tlds', tlds);

    const targetUrl = `${RESELLERCLUB_DOMAINCHECK_BASE_URL}/domains/available.json`;
    const response = await axios({
      method: 'GET',
      url: `${targetUrl}?${params.toString()}`,
      timeout: Number(process.env.UPSTREAM_TIMEOUT_MS || 20000)
    });

    return res.status(response.status).json({
      ok: true,
      query: { domainNames, tlds },
      results: response.data
    });
  } catch (error) {
    const status = error.response?.status || 502;
    return res.status(status).json({
      error: 'upstream_error',
      status,
      message: error.response?.data || error.message
    });
  }
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
