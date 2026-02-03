const express = require("express");
const router = express.Router();
const multer = require("multer");
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  clientDataHandler,
  getAllClients,
  getClientById,
  deleteClientById,
} = require("../controller/clientController.js");

// Memory storage for image uploads
const upload = require("../middlewares/upload.js");

router.post(
  "/client-handle",
  requiredSignIn,
  upload("clients").single("image"),
  clientDataHandler
);
router.get("/clients", getAllClients);
router.get("/client/:id", requiredSignIn, getClientById);
router.delete("/client-delete/:id", requiredSignIn, deleteClientById);

module.exports = router;
