const express = require("express");
const router = express.Router();

const {
  createUpdatePackage,
  listAllPackages,
  listResidentialPackages,
  listCorporatePackages,
  deletePackage,
  readPackage,
} = require("../controller/packageController.js");

/*
|--------------------------------------------------------------------------
| Package CRUD
|--------------------------------------------------------------------------
*/

// create or update
router.post("/package", createUpdatePackage);

// list all
router.get("/packages", listAllPackages);

// list by type
router.get("/packages/residential", listResidentialPackages);
router.get("/packages/corporate", listCorporatePackages);

// single read
router.get("/package/:packageId", readPackage);

// delete
router.delete("/package/:id", deletePackage);

module.exports = router;
