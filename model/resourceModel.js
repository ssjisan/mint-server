const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true }, // e.g., 'user-management'
    path: { type: String }, // e.g., '/users' (Leave empty if it's a Group)
    icon: { type: String }, // FontAwesome or Material icon name
    isGroup: { type: Boolean, default: false },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      default: null,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Resource", ResourceSchema);
