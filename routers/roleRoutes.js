const express = require("express");
const router = express.Router();
const roleController = require("../controller/roleController.js");
router.post("/create-role", roleController.createRole);
router.put("/:roleId/permissions", roleController.updateRolePermissions);

module.exports = router;
