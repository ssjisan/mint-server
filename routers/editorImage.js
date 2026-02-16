const express = require("express");
const { uploadEditorImage } = require("../middlewares/uploadEditorImage");
const upload = require("../middlewares/upload");
const router = express.Router();

router.post("/editor-image", upload("temp").single("image"), uploadEditorImage);

module.exports = router;
