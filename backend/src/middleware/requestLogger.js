const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    
    // Log para rutas admin
    if (req.originalUrl.includes('/admin')) {
      console.log('Admin request:', {
        path: req.originalUrl,
        method: req.method,
        status: res.statusCode,
        duration: `${duration}ms`,
        user: req.userId || 'no-auth',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

module.exports = requestLogger;