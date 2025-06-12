const express = require('express');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const httpProxy = require('express-http-proxy');
const corsMiddleware = require('./middleware/cors');
const rateLimiter = require('./middleware/rateLimiter');
const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');

// Cargar variables de entorno
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ✅ CONFIGURAR TRUST PROXY PRIMERO (para Railway, Heroku, etc.)
app.set('trust proxy', true);

// ✅ CORS DEBE IR PRIMERO - ANTES DE TODO
// corsMiddleware ahora es un array [debugCors, corsMiddleware]
app.use(corsMiddleware);

// Luego los demás middlewares
app.use(express.json());
app.use(rateLimiter);
app.use(logger);

// Validar BID_SERVICE_URL para WebSocket
const BID_SERVICE_URL = process.env.BID_SERVICE_URL || 'http://192.168.1.181:3003';
const WS_TARGET = process.env.NODE_ENV === 'production' 
  ? 'wss://bid-service-production.up.railway.app' 
  : 'ws://localhost:3003';

console.log('📡 BID_SERVICE_URL:', BID_SERVICE_URL);
console.log('📡 WebSocket target:', WS_TARGET);

// WebSocket proxy para BID-SERVICE
const wsProxy = createProxyMiddleware({
  target: WS_TARGET,
  ws: true,
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('❌ WebSocket Proxy Error:', err);
    if (res && res.write) {
      res.status(500).json({ error: 'WebSocket proxy error' });
    }
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    console.log('🔄 WebSocket proxy request:', req.url);
  }
});

// Aplicar proxy WebSocket
app.use('/socket.io', wsProxy);
server.on('upgrade', wsProxy.upgrade);

// Rutas a microservicios
app.use('/api/auth', authRoutes);
app.use('/api', auctionRoutes);
app.use('/api/bids', bidRoutes);

// Ruta de prueba
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

// ✅ Ruta para probar CORS específicamente
app.get('/test-cors', (req, res) => {
  res.status(200).json({ 
    status: 'CORS OK',
    origin: req.get('origin'),
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// ✅ Ruta OPTIONS específica para auth (debugging)
app.options('/api/auth/*', (req, res) => {
  console.log('🔍 Manual OPTIONS handler for auth:', req.url);
  res.status(200).end();
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error en API Gateway:', {
    message: err.message,
    stack: err.stack?.split('\n')[0],
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // No enviar stack trace en producción
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'Something went wrong!',
    ...(isDev && { stack: err.stack })
  });
});

// 404 Handler
app.use('*', (req, res) => {
  console.log(`📍 404 - Ruta no encontrada: ${req.method} ${req.originalUrl} from ${req.ip}`);
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

server.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`📡 WebSocket proxy configured for BID-SERVICE at ${WS_TARGET}`);
});
