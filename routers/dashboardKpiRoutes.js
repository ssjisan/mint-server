const express = require("express");
const router = express.Router();
const {getDashboardSummary 
} = require("../controller/dashboardKpiController.js");

// 1. Static route for total coverage — no ID needed
router.get("/summary", getDashboardSummary);

module.exports = router;
