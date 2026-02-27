const express = require("express");
const router = express.Router();
const resourceController = require("../controller/resourceController.js");

router.post("/create-resource", resourceController.createResource);
router.get("/resource-list", resourceController.getResources);

module.exports = router;
