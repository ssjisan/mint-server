const Product = require("../model/productModel.js");
const PreOrder = require("../model/preOrderModel.js");
const { verifyCaptcha } = require("../helper/captchaStore");

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
