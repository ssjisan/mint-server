const rateLimit = require("express-rate-limit");

exports.preOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Only 5 requests allowed per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many preorder attempts. Please try again after 10 minutes.",
    });
  },
});
