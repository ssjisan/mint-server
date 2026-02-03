const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");

// Route Imports
const webMessage = require("./helper/webMessage.js");
const authRoutes = require("./routers/authRoutes.js");
const areaRoutes = require("./routers/areaRoutes.js");
const zoneRoutes = require("./routers/zoneRoutes.js");
const packageRoutes = require("./routers/packageRoutes.js");
const requestConnectionRoutes = require("./routers/requestConnectionRoutes.js");
const dashboardKpiRoutes = require("./routers/dashboardKpiRoutes.js");
const clientRoutes = require("./routers/clientRoutes.js");
dotenv.config();

const storagePath = process.env.STORAGE_PATH || path.join(__dirname, "uploads");

const app = express();
const port = process.env.PORT || 5001;

// 📦 Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 🔧 Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// 🛣️ Routers
app.use(authRoutes);
app.use(areaRoutes);
app.use(zoneRoutes);
app.use(packageRoutes);
app.use(requestConnectionRoutes);
app.use(dashboardKpiRoutes);
app.use(clientRoutes);
app.use("/file-storage", express.static(storagePath));
// 🔗 Root route
// Basic Route
app.get("/", (req, res) => {
  res.send(webMessage);
});

// 🚀 Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
