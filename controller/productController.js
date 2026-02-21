const Product = require("../model/productModel.js");
const slugify = require("slugify");
const mongoose = require("mongoose");

// ===============================
// GENERATE PRODUCT CODE (GAP SAFE)
// ===============================
const generateProductCode = async () => {
  const products = await Product.find().select("productCode");

  const numbers = products
    .map((p) => {
      if (!p.productCode) return null;
      const parts = p.productCode.split("-");
      return parseInt(parts[1], 10);
    })
    .filter((num) => !isNaN(num))
    .sort((a, b) => a - b);

  let nextNumber = 1;

  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] !== nextNumber) break;
    nextNumber++;
  }

  return `MINT-${String(nextNumber).padStart(5, "0")}`;
};

// ===============================
// CREATE / UPDATE PRODUCT BASIC
// ===============================
const productDataHandler = async (req, res) => {
  try {
    const {
      id,
      name,
      brand,
      category,
      descriptionJSON,
      descriptionHTML,
      isPublished,

      // PRICE
      price,
      showPrice,
      discount,
      specifications,
    } = req.body;

    // VALIDATION
    if (!name || !brand || !category || !descriptionJSON || !descriptionHTML) {
      return res.status(400).json({
        error: "Name, brand, category and description are required",
      });
    }

    if (price === undefined || price < 0) {
      return res.status(400).json({ error: "Valid price required" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(brand) ||
      !mongoose.Types.ObjectId.isValid(category)
    ) {
      return res.status(400).json({ error: "Invalid brand or category ID" });
    }

    const slug = slugify(name, { lower: true, strict: true });

    let parsedJSON;
    try {
      parsedJSON =
        typeof descriptionJSON === "string"
          ? JSON.parse(descriptionJSON)
          : descriptionJSON;
    } catch {
      return res.status(400).json({ error: "Invalid description JSON" });
    }
    let cleanSpecifications = [];

    if (Array.isArray(specifications)) {
      cleanSpecifications = specifications
        .filter(
          (group) => group.groupTitle && group.items && group.items.length > 0,
        )
        .map((group) => ({
          groupTitle: group.groupTitle.trim(),
          items: group.items
            .filter((item) => item.label && item.value)
            .map((item) => ({
              label: item.label.trim(),
              value: item.value.trim(),
            })),
        }));
    }
    // ---------------- UPDATE ----------------
    if (id) {
      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      product.name = name;
      product.slug = slug;
      product.brand = brand;
      product.category = category;
      product.descriptionJSON = parsedJSON;
      product.descriptionHTML = descriptionHTML;
      product.isPublished = isPublished;
      product.specifications = cleanSpecifications;

      product.price = price;
      product.showPrice = showPrice;
      product.discount = discount;

      await product.save();

      return res.status(200).json({
        message: "Product updated successfully",
        product,
      });
    }

    // ---------------- CREATE ----------------
    const productCode = await generateProductCode();

    const product = await Product.create({
      name,
      slug,
      productCode,
      brand,
      category,
      descriptionJSON: parsedJSON,
      descriptionHTML,
      isPublished,
      price,
      showPrice,
      discount,
      specifications: cleanSpecifications,
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Product save failed:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { productDataHandler };
