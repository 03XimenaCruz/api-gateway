const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 solicitudes por IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // En segundos
  },
  
  // ✅ Configuración específica para Railway/proxies
  standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  
  // ✅ Configurar key generator para proxies
  keyGenerator: (req) => {
    // Usar la IP real del cliente desde el proxy
    return req.ip || req.connection.remoteAddress;
  },
  
  // ✅ Configurar para desarrollo vs producción
  skip: (req) => {
    // En desarrollo, skipear rate limiting para localhost
    if (process.env.NODE_ENV !== 'production') {
      return req.ip === '127.0.0.1' || req.ip === '::1';
    }
    return false;
  },
  
  // ✅ Handler personalizado para debugging
  handler: (req, res) => {
    console.log(`🚫 Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      limit: req.rateLimit.limit,
      current: req.rateLimit.current,
      remaining: req.rateLimit.remaining
    });
  },
  
  // ✅ Configuración para evitar errores con proxies
  validate: {
    xForwardedForHeader: false, // Deshabilitar validación estricta
    trustProxy: true // Confiar en proxy settings
  }
});

module.exports = limiter;
