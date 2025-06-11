const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://subastas-mora.netlify.app',
    'https://api-gateway-production-041c.up.railway.app', // Tu dominio del gateway
    'https://auth-service-production-efff.up.railway.app',
    'https://auction-service-production-0633.up.railway.app',
    'https://bid-service-production.up.railway.app',
    // Agrega aquí el dominio de tu frontend cuando lo tengas
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = cors(corsOptions);
