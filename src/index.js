const express = require('express');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
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

// Validar BID_SERVICE_URL para WebSocket
const BID_SERVICE_URL = process.env.BID_SERVICE_URL || 'http://192.168.1.181:3003';
const WS_TARGET = process.env.NODE_ENV === 'production' 
  ? 'wss://bid-service-production.up.railway.app' 
  : 'ws://localhost:3003';

console.log('📡 Environment:', process.env.NODE_ENV);
console.log('📡 BID_SERVICE_URL:', BID_SERVICE_URL);
console.log('📡 WebSocket target:', WS_TARGET);

// ⭐ IMPORTANTE: CORS debe ir ANTES que cualquier otra cosa
app.use(corsMiddleware);

// Middleware para parsear JSON
app.use(express.json());

// Middleware adicional
app.use(rateLimiter);
app.use(logger);

// ⭐ Manejar todas las peticiones OPTIONS globalmente
app.options('*', (req, res) => {
  console.log('🔄 Global OPTIONS handler for:', req.originalUrl);
  res.status(200).end();
});

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
app.use('/api', auctionRoutes); // Maneja /api/auctions y /api/categories
app.use('/api/bids', bidRoutes);

// Ruta de prueba
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      auction: process.env.AUCTION_SERVICE_URL,
      bid: process.env.BID_SERVICE_URL
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// 404 Handler
app.use('*', (req, res) => {
  console.log('❌ 404 for:', req.originalUrl);
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

server.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 WebSocket proxy configured for BID-SERVICE at ${WS_TARGET}`);
  console.log(`🌐 CORS configured for production`);
});
