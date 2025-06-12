const cors = require('cors');

// Configuración más robusta de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3005',
      'https://subastas-mora.netlify.app',
      'https://api-gateway-production-041c.up.railway.app',
      'https://auth-service-production-efff.up.railway.app',
      'https://auction-service-production-0633.up.railway.app',
      'https://bid-service-production.up.railway.app'
    ];

    // Permitir requests sin origin (como Postman, aplicaciones móviles, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Forwarded-For',
    'X-Forwarded-Proto',
    'X-Original-Host'
  ],
  credentials: true,
  // Importante: configurar preflight
  preflightContinue: false,
  optionsSuccessStatus: 200 // Para navegadores legacy
};

module.exports = cors(corsOptions);
