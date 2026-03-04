const Product = require("../model/productModel.js");
const PreOrder = require("../model/preOrderModel.js");
const { verifyCaptcha } = require("../helper/captchaStore");

const mongoose = require("mongoose");

exports.createPreOrder = async (req, res) => {
  try {
    const {
      productId,
      name,
      phone,
      email,
      address,
      quantity = 1,
      captchaId,
      captchaAnswer,
      notes,
    } = req.body;

    // 1️⃣ Required Fields Check
    if (!productId || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Product, name and phone are required.",
      });
    }

    // 2️⃣ Captcha Validation
    if (!captchaId || !captchaAnswer) {
      return res.status(400).json({
        success: false,
        message: "Captcha is required.",
      });
    }

    const isCaptchaValid = verifyCaptcha(captchaId, captchaAnswer);

    if (!isCaptchaValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired captcha.",
      });
    }

    // 3️⃣ Find Product
    const product = await Product.findById(productId);

    if (!product || !product.isPublished) {
      return res.status(404).json({
        success: false,
        message: "Product not available.",
      });
    }

    // 4️⃣ Calculate Final Price (NEVER trust frontend price)
    let finalPrice = product.price;

    if (product.discount?.isActive) {
      if (product.discount.type === "percentage") {
        finalPrice =
          product.price - (product.price * product.discount.value) / 100;
      } else if (product.discount.type === "fixed") {
        finalPrice = product.price - product.discount.value;
      }
    }

    finalPrice = Math.max(0, Math.ceil(finalPrice)) * quantity;

    // 5️⃣ Create PreOrder
    const preOrder = await PreOrder.create({
      product: product._id,
      productSnapshot: {
        name: product.name,
        price: product.price,
        discount: {
          type: product.discount.type,
          value: product.discount.value,
        },
      },
      customer: {
        name,
        phone,
        email,
        address,
      },
      quantity,
      finalPrice,
      ipAddress: req.ip,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Pre-order submitted successfully.",
      preOrder,
    });
  } catch (error) {
    console.error("Create PreOrder Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

exports.getAllPreOrders = async (req, res) => {
  try {
    const {
      status,
      brand,
      category,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    /* ---------- Status Filter ---------- */
    if (status) {
      query.status = status;
    }

    /* ---------- Date Filter ---------- */
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    /* ---------- Product Filters ---------- */
    const productMatch = {};

    if (brand && mongoose.Types.ObjectId.isValid(brand)) {
      productMatch.brand = new mongoose.Types.ObjectId(brand);
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      productMatch.category = new mongoose.Types.ObjectId(category);
    }

    /* ---------- Fetch ---------- */
    const preOrders = await PreOrder.find(query)
      .populate({
        path: "product",
        match: productMatch, // 👈 filter by brand/category
        populate: [
          { path: "brand", select: "name" },
          { path: "category", select: "name" },
        ],
        select: "name price brand category images",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    /* ---------- Remove Null Products (if filter used) ---------- */
    const filtered = preOrders.filter((item) => item.product !== null);

    const total = await PreOrder.countDocuments(query);

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: filtered,
    });
  } catch (error) {
    console.error("Get PreOrders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
exports.updatePreOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    /* ---------- Validate ID ---------- */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pre-order ID.",
      });
    }

    /* ---------- Validate Status ---------- */
    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    /* ---------- Find PreOrder ---------- */
    const preOrder = await PreOrder.findById(id);

    if (!preOrder) {
      return res.status(404).json({
        success: false,
        message: "Pre-order not found.",
      });
    }

    /* ---------- Update Status & Remarks ---------- */
    preOrder.status = status;

    if (remarks !== undefined) {
      preOrder.remarks = remarks;
    }

    await preOrder.save();

    return res.status(200).json({
      success: true,
      message: "Pre-order status updated successfully.",
      data: preOrder,
    });
  } catch (error) {
    console.error("Update PreOrder Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};
