const express = require('express');
const httpProxy = require('express-http-proxy');
const { AUTH_SERVICE_URL } = require('../config/env');

const router = express.Router();

// ✅ CORREGIDO: El path correcto para el auth service
router.use('/', httpProxy(AUTH_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    // Como el gateway ya maneja /api/auth, pasamos la ruta completa
    const path = `/api/auth${req.url}`;
    console.log(`🔄 Proxying AUTH: ${req.method} ${req.url} -> ${AUTH_SERVICE_URL}${path}`);
    return path;
  },
  
  // Configurar headers correctamente
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers = {
      ...srcReq.headers,
      'X-Forwarded-For': srcReq.ip,
      'X-Forwarded-Proto': srcReq.protocol
    };
    return proxyReqOpts;
  },

  // Manejar errores de proxy
  proxyErrorHandler: (err, res, next) => {
    console.error('❌ Auth Service Proxy Error:', err.message);
    if (res && !res.headersSent) {
      res.status(500).json({ 
        error: 'Error connecting to auth service',
        message: err.message 
      });
    }
  },

  // Configuración adicional
  changeOrigin: true,
  timeout: 30000,
  
  // Debug de respuestas
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    console.log(`📥 Auth service response: ${proxyRes.statusCode} for ${userReq.method} ${userReq.url}`);
    return proxyResData;
  }
}));

module.exports = router;
