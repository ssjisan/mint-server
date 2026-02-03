const express = require("express");
const router = express.Router();
const {
  createZone,
  getZones,
  updateZone,
  deleteZone,
} = require("../controller/zoneController");

router.post("/zones", createZone);
router.get("/zones", getZones);
router.put("/zones/:id", updateZone);
router.delete("/zones/:id", deleteZone);

module.exports = router;
