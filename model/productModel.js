const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true, trim: true },

    productCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    descriptionJSON: {
      type: Array,
      required: true,
    },

    descriptionHTML: {
      type: String,
      required: true,
    },
    // Price & Discount
    price: { type: Number, required: true, min: 0 },

    showPrice: { type: Boolean, default: true },

    discount: {
      type: {
        type: String,
        enum: ["none", "percentage", "fixed"],
        default: "none",
      },
      value: { type: Number, default: 0, min: 0 },
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: false },
    },

    // Product Status
    isPublished: { type: Boolean, default: true },

    // Images
    images: [
      {
        url: { type: String, required: true },
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // Specifications
    specifications: [
      {
        groupTitle: { type: String, required: true, trim: true },
        items: [
          {
            label: { type: String, required: true, trim: true },
            value: { type: String, required: true, trim: true },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
