const ConnectionRequest = require("../model/requestConnectionModel.js");
const Area = require("../model/areaModel.js");
const Package = require("../model/packageModel.js");

const getDashboardSummary = async (req, res) => {
  try {
    const totalRequests = await ConnectionRequest.countDocuments();
    const totalAreas = await Area.countDocuments();
    const totalPackages = await Package.countDocuments();

    // Group by zone to find the one with the highest requests
    const topZoneAgg = await ConnectionRequest.aggregate([
      { $group: { _id: "$zone", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const topZone = topZoneAgg[0] || { _id: "N/A", count: 0 };

    return res.status(200).json({
      totalRequests,
      totalAreas,
      totalPackages,
      topZone: {
        zone: topZone._id,
        count: topZone.count
      }
    });
  } catch (error) {
    console.error("Error in getDashboardSummary:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { getDashboardSummary };
