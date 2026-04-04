// Vercel serverless function entrypoint
try {
  const app = require('../../backend/server');
  module.exports = app;
} catch (err) {
  console.error("VERCEL COLD START CRASH:", err);
  module.exports = (req, res) => {
    res.status(500).json({
      error: "Vercel Serverless Function completely failed to initialize the backend application.",
      message: err.message,
      stack: err.stack
    });
  };
}
