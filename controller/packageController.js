const Package = require("../model/packageModel.js");

/*
|--------------------------------------------------------------------------
| Create or Update Package
|--------------------------------------------------------------------------
*/
const createUpdatePackage = async (req, res) => {
  try {
    const { id, packageName, price, speedMbps, type, items } = req.body;

    /* ---------------- VALIDATION ---------------- */

    if (!packageName?.trim()) {
      return res.status(400).json({ error: "Package name is required" });
    }

    if (price == null) {
      return res.status(400).json({ error: "Price is required" });
    }

    if (speedMbps == null) {
      return res.status(400).json({ error: "Speed (Mbps) is required" });
    }

    if (!["corporate", "residential"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Type must be corporate or residential" });
    }

    if (items && !Array.isArray(items)) {
      return res.status(400).json({ error: "Items must be an array" });
    }

    const payload = {
      packageName: packageName.trim(),
      price,
      speedMbps,
      type,
      items: items || [],
    };

    /* ---------------- UPDATE ---------------- */
    if (id) {
      const updated = await Package.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      });

      if (!updated) {
        return res.status(404).json({ error: "Package not found" });
      }

      return res.status(200).json({
        message: "Package updated successfully",
        package: updated,
      });
    }

    /* ---------------- CREATE ---------------- */
    const newPackage = await Package.create(payload);

    res.status(201).json({
      message: "Package created successfully",
      package: newPackage,
    });
  } catch (error) {
    console.error("Package create/update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/*
|--------------------------------------------------------------------------
| List All Packages
|--------------------------------------------------------------------------
*/
const listAllPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: 1 });
    res.json({ packages });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/*
|--------------------------------------------------------------------------
| Residential Packages
|--------------------------------------------------------------------------
*/
const listResidentialPackages = async (req, res) => {
  try {
    const packages = await Package.find({ type: "residential" }).sort({
      createdAt: 1,
    });

    res.json({ packages });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/*
|--------------------------------------------------------------------------
| Corporate Packages
|--------------------------------------------------------------------------
*/
const listCorporatePackages = async (req, res) => {
  try {
    const packages = await Package.find({ type: "corporate" }).sort({
      createdAt: 1,
    });

    res.json({ packages });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/*
|--------------------------------------------------------------------------
| Read Single Package
|--------------------------------------------------------------------------
*/
const readPackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    const pkg = await Package.findById(packageId);

    if (!pkg) return res.status(404).json({ error: "Package not found" });

    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/*
|--------------------------------------------------------------------------
| Delete Package
|--------------------------------------------------------------------------
*/
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Package.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error while deleting package" });
  }
};

module.exports = {
  createUpdatePackage,
  listAllPackages,
  listResidentialPackages,
  listCorporatePackages,
  deletePackage,
  readPackage,
};
