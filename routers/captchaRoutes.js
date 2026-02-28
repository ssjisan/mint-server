const express = require("express");
const router = express.Router();
const { createCaptcha } = require("../helper/captchaStore");

router.get("/captcha", (req, res) => {
  const captcha = createCaptcha();

  res.json({
    success: true,
    captcha,
  });
});

module.exports = router;
