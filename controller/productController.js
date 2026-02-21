const Product = require("../model/productModel.js");
const slugify = require("slugify");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
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
// EXTRACT IMAGE URLS FROM HTML
// ===============================
const extractImagePaths = (html) => {
  const regex = /src="([^"]+)"/g;
  const matches = [];
  let match;

  while ((match = regex.exec(html))) {
    matches.push(match[1]);
  }

  return matches;
};

const extractProductImageFilenames = (html, slug) => {
  const urls = extractImagePaths(html);

  return urls
    .filter((url) => url.includes(`/products/${slug}/`))
    .map((url) => path.basename(url));
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
      price,
      showPrice,
      discount,
      specifications,
    } = req.body;

    // ================= VALIDATION =================
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

    // ================= SLUG =================
    const slug = slugify(name, { lower: true, strict: true });

    // ================= SAFE JSON PARSE =================
    let parsedJSON;
    try {
      parsedJSON =
        typeof descriptionJSON === "string"
          ? JSON.parse(descriptionJSON)
          : descriptionJSON;
    } catch {
      return res.status(400).json({ error: "Invalid description JSON" });
    }

    // ================= CLEAN SPECIFICATIONS =================
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

    // ================= EDITOR IMAGE HANDLING =================
    const baseStoragePath =
      process.env.STORAGE_PATH || path.join(process.cwd(), "uploads");

    const tempFolder = path.join(baseStoragePath, "temp");
    const productBaseFolder = path.join(baseStoragePath, "products");
    const productFolder = path.join(productBaseFolder, slug);

    if (!fs.existsSync(productFolder)) {
      fs.mkdirSync(productFolder, { recursive: true });
    }

    let updatedHTML = descriptionHTML;
    let updatedJSON = parsedJSON;

    const imageUrls = extractImagePaths(descriptionHTML);
    const movedFiles = [];

    for (const url of imageUrls) {
      if (url.includes("/temp/")) {
        const filename = path.basename(url);

        const oldPath = path.join(tempFolder, filename);
        const newPath = path.join(productFolder, filename);

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          movedFiles.push(filename);
        }

        const newUrl = `${process.env.BASE_URL}/mint-media-storage/products/${slug}/${filename}`;
        updatedHTML = updatedHTML.split(url).join(newUrl);
      }
    }

    const updateJsonImages = (nodes) => {
      for (let node of nodes) {
        if (node.type === "image" && node.url?.includes("/temp/")) {
          const filename = path.basename(node.url);

          node.url = `${process.env.BASE_URL}/mint-media-storage/products/${slug}/${filename}`;
        }

        if (node.children) updateJsonImages(node.children);
      }
    };

    updateJsonImages(updatedJSON);

    // ================= UPDATE =================
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      const oldSlug = product.slug;
      const oldFolder = path.join(productBaseFolder, oldSlug);

      // 🔥 STEP 1: Get old image filenames from DB
      const oldImages = extractProductImageFilenames(
        product.descriptionHTML,
        oldSlug,
      );

      // 🔥 STEP 2: Get new image filenames from updated HTML
      const newImages = extractProductImageFilenames(updatedHTML, slug);

      // 🔥 STEP 3: Find removed images
      const removedImages = oldImages.filter(
        (filename) => !newImages.includes(filename),
      );

      // 🔥 STEP 4: Delete removed files
      for (const filename of removedImages) {
        const filePath = path.join(oldFolder, filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      product.name = name;
      product.slug = slug;
      product.brand = brand;
      product.category = category;
      product.descriptionJSON = updatedJSON;
      product.descriptionHTML = updatedHTML;
      product.isPublished = isPublished;
      product.price = price;
      product.showPrice = showPrice;
      product.discount = discount;
      product.specifications = cleanSpecifications;

      await product.save();

      return res.status(200).json({
        message: "Product updated successfully",
        product,
      });
    }

    // ================= CREATE =================
    const productCode = await generateProductCode();

    const product = await Product.create({
      name,
      slug,
      productCode,
      brand,
      category,
      descriptionJSON: updatedJSON,
      descriptionHTML: updatedHTML,
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

const getAllProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();

    const products = await Product.find()
      .populate("brand", "name")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      total,
      page,
      limit,
      products,
    });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findById(id)
      .populate("brand", "name")
      .populate("category", "name");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Get single product error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ===============================
// DELETE PRODUCT
// ===============================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // ================= REMOVE PRODUCT IMAGE FOLDER =================
    const baseStoragePath =
      process.env.STORAGE_PATH || path.join(process.cwd(), "uploads");

    const productFolder = path.join(baseStoragePath, "products", product.slug);

    if (fs.existsSync(productFolder)) {
      fs.rmSync(productFolder, { recursive: true, force: true });
      console.log("Product folder removed:", productFolder);
    }

    // ================= DELETE PRODUCT FROM DB =================
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  productDataHandler,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
};
