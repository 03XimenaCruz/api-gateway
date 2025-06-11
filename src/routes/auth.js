const express = require('express');
const httpProxy = require('express-http-proxy');
const { AUTH_SERVICE_URL } = require('../config/env');

const router = express.Router();

// ✅ CORREGIDO: Simplificar el proxy
router.use('/', httpProxy(AUTH_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    // El gateway ya maneja /api/auth, solo necesitamos agregar la ruta específica
    return `/api/auth${req.url}`;
  },
  proxyErrorHandler: (err, res, next) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Error connecting to auth service' });
  }
}));

module.exports = router;