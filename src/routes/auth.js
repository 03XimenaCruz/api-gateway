const express = require('express');
const httpProxy = require('express-http-proxy');
const { AUTH_SERVICE_URL } = require('../config/env');

const router = express.Router();

// Middleware para manejar OPTIONS requests específicamente
router.options('*', (req, res) => {
  console.log('🔄 OPTIONS request received for:', req.originalUrl);
  res.status(200).end();
});

// Configuración del proxy con mejor manejo de errores
router.use('/', httpProxy(AUTH_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    const path = `/api/auth${req.url}`;
    console.log(`🔄 Proxying AUTH request: ${req.method} ${req.originalUrl} -> ${AUTH_SERVICE_URL}${path}`);
    return path;
  },
  
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    // Asegurar que se pasen todos los headers necesarios
    proxyReqOpts.headers = {
      ...srcReq.headers,
      'X-Forwarded-For': srcReq.ip,
      'X-Forwarded-Proto': srcReq.protocol
    };
    return proxyReqOpts;
  },

  proxyErrorHandler: (err, res, next) => {
    console.error('❌ AUTH Service Proxy Error:', err.message);
    if (res && !res.headersSent) {
      res.status(500).json({ 
        error: 'Error connecting to auth service',
        message: err.message 
      });
    }
  },

  // Configuraciones importantes
  timeout: 30000,
  changeOrigin: true,
  preserveHeaderKeyCase: true
}));

module.exports = router;
