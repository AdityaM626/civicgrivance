/**
 * Lightweight Security Hardening Middleware
 * Sets standard HTTP Security Headers to prevent MIME-sniffing, clickjacking, XSS, and HSTS vulnerabilities.
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking via frame embedding
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS filter protection in modern browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Enforce HTTP Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Prevent Internet Explorer from executing downloads in site context
  res.setHeader('X-Download-Options', 'noopen');

  next();
};

module.exports = {
  securityHeaders
};
