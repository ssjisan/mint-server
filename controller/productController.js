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
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);
    // 1. Convert FormData strings back to proper types
    const data = { ...req.body };

    if (data.price) data.price = Number(data.price);
    if (data.isPublished) data.isPublished = data.isPublished === "true";
    if (data.showPrice) data.showPrice = data.showPrice === "true";

    // Parse JSON strings back to Arrays/Objects
    const parseIfString = (val) =>
      typeof val === "string" ? JSON.parse(val) : val;

    const descriptionJSON = parseIfString(data.descriptionJSON);
    const shortDescriptionJSON = parseIfString(data.shortDescriptionJSON);
    const specifications = parseIfString(data.specifications);
    const discount = parseIfString(data.discount);
    const imageMetadata = parseIfString(data.imageMetadata);

    const { id, name, brand, category, descriptionHTML, shortDescriptionHTML } =
      data;

    // 2. Standard Validations
    if (
      !name ||
      !brand ||
      !category ||
      !descriptionHTML ||
      !shortDescriptionHTML
    ) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    // 3. Paths & Folder Setup
    const slug = slugify(name, { lower: true, strict: true });
    const baseStoragePath =
      process.env.STORAGE_PATH || path.join(process.cwd(), "uploads");
    const productFolder = path.join(baseStoragePath, "products", slug);
    const thumbnailFolder = path.join(productFolder, "thumbnails");
    const tempFolder = path.join(baseStoragePath, "temp");

    if (!fs.existsSync(thumbnailFolder)) {
      fs.mkdirSync(thumbnailFolder, { recursive: true });
    }

    // 4. Handle Gallery Thumbnails (req.files)
    const newFiles = req.files || [];
    let finalProductImages = [];
    let fileCounter = 0;

    // Map metadata to the actual files uploaded
    if (imageMetadata) {
      imageMetadata.forEach((meta) => {
        if (meta.isNew) {
          const file = newFiles[fileCounter];
          if (file) {
            const ext = path.extname(file.originalname);
            const filename = `thumb-${Date.now()}-${fileCounter}${ext}`;
            const targetPath = path.join(thumbnailFolder, filename);

            fs.renameSync(file.path, targetPath);

            finalProductImages.push({
              url: `${process.env.BASE_URL}/mint-media-storage/products/${slug}/thumbnails/${filename}`,
              alt: name,
              isPrimary: meta.isPrimary || false,
            });
            fileCounter++;
          }
        } else {
          // Keep existing image
          finalProductImages.push(meta);
        }
      });
    }

    // 5. Enforce Limit of 5
    if (finalProductImages.length > 5) {
      return res.status(400).json({ error: "Maximum 5 images allowed" });
    }

    // 6. Editor Image Handling (Moving from /temp to /{slug})
    let updatedHTML = descriptionHTML;
    let updatedShortHTML = shortDescriptionHTML;
    const imageUrls = [
      ...extractImagePaths(descriptionHTML),
      ...extractImagePaths(shortDescriptionHTML),
    ];

    imageUrls.forEach((url) => {
      if (url.includes("/temp/")) {
        const filename = path.basename(url);
        if (fs.existsSync(path.join(tempFolder, filename))) {
          fs.renameSync(
            path.join(tempFolder, filename),
            path.join(productFolder, filename),
          );
          const newUrl = `${process.env.BASE_URL}/mint-media-storage/products/${slug}/${filename}`;
          updatedHTML = updatedHTML.split(url).join(newUrl);
          updatedShortHTML = updatedShortHTML.split(url).join(newUrl);
        }
      }
    });

    // 7. Save to Database
    let product;
    if (id) {
      product = await Product.findById(id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      // Logic to delete removed files from VPS disk
      (product.images || []).forEach((oldImg) => {
        if (!finalProductImages.some((n) => n.url === oldImg.url)) {
          const oldFile = path.join(thumbnailFolder, path.basename(oldImg.url));
          if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        }
      });

      Object.assign(product, {
        name,
        slug,
        brand,
        category,
        price: data.price,
        isPublished: data.isPublished,
        showPrice: data.showPrice,
        discount,
        specifications,
        descriptionHTML: updatedHTML,
        descriptionJSON,
        shortDescriptionHTML: updatedShortHTML,
        shortDescriptionJSON,
        images: finalProductImages,
      });
    } else {
      product = new Product({
        name,
        slug,
        productCode: await generateProductCode(),
        brand,
        category,
        price: data.price,
        isPublished: data.isPublished,
        showPrice: data.showPrice,
        discount,
        specifications,
        descriptionHTML: updatedHTML,
        descriptionJSON,
        shortDescriptionHTML: updatedShortHTML,
        shortDescriptionJSON,
        images: finalProductImages,
      });
    }

    await product.save();
    res
      .status(id ? 200 : 201)
      .json({ message: "Product saved successfully", product });
  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
