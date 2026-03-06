const rateLimit = require("express-rate-limit");

exports.connectionRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 2, // Only 2 requests allowed per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many attempts. Please try again after 10 minutes.",
    });
  },
});
