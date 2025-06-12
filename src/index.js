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

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

server.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`📡 WebSocket proxy configured for BID-SERVICE at ${WS_TARGET}`);
});
