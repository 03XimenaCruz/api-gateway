const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite dev server
      'https://subastas-mora.netlify.app',
      'https://api-gateway-production-041c.up.railway.app',
      'https://auth-service-production-efff.up.railway.app',
      'https://auction-service-production-0633.up.railway.app',
      'https://bid-service-production.up.railway.app'
    ];
    
    // Permitir requests sin origin (ej: mobile apps, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origen no permitido: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
  optionsSuccessStatus: 200, // Para soportar navegadores legacy
  preflightContinue: false
};

// Crear el middleware
const corsMiddleware = cors(corsOptions);

// Middleware adicional para debugging
const debugCors = (req, res, next) => {
  console.log(`🌐 CORS: ${req.method} ${req.path} from ${req.get('origin') || 'no-origin'}`);
  
  // Para peticiones OPTIONS, loggear headers importantes
  if (req.method === 'OPTIONS') {
    console.log('🔍 OPTIONS request headers:', {
      origin: req.get('origin'),
      'access-control-request-method': req.get('access-control-request-method'),
      'access-control-request-headers': req.get('access-control-request-headers')
    });
  }
  
  next();
};

module.exports = [debugCors, corsMiddleware];
