// Vercel Serverless Function entry point for backend
const app = require('../server.js');

module.exports = (req, res) => {
  // If Vercel rewrite altered req.url to /api/index, restore the original requested path
  const originalPath = req.headers['x-matched-path'] || req.headers['x-invoke-path'] || req.headers['x-forwarded-uri'];
  if (originalPath && (req.url === '/api/index' || req.url === '/api' || req.url.startsWith('/api/index?'))) {
    const queryIdx = req.url.indexOf('?');
    const queryString = queryIdx !== -1 ? req.url.substring(queryIdx) : '';
    req.url = originalPath + queryString;
  }
  return app(req, res);
};
