const fs = require("fs");
const path = require("path");
const News = require("../model/successStoriesModel.js");

exports.createNews = async (req, res) => {
  try {
    const { title } = req.body;

    // Because multipart/form-data
    const contentJSON = JSON.parse(req.body.contentJSON || "[]");
    const contentHTML = req.body.contentHTML;
    const uploadedImages = JSON.parse(req.body.uploadedImages || "[]");

    if (!title || !contentJSON || !contentHTML) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const baseStoragePath = path.join(process.cwd(), "uploads");
    const newsBaseFolder = path.join(baseStoragePath, "success-stories");
    const tempFolder = path.join(baseStoragePath, "temp");

    // ✅ Handle Cover Photo (Saved directly by multer)
    let coverPhotoUrl = "";

    if (req.file) {
      coverPhotoUrl = `${process.env.BASE_URL}/mint-media-storage/success-stories/cover-photos/${req.file.filename}`;
    }

    // 1️⃣ Create DB record first (including cover)
    const news = await News.create({
      title,
      contentJSON,
      contentHTML,
      coverPhoto: coverPhotoUrl,
    });

    const newsId = news._id.toString();
    const newsFolder = path.join(newsBaseFolder, newsId);

    // 2️⃣ Ensure news folder exists
    if (!fs.existsSync(newsFolder)) {
      fs.mkdirSync(newsFolder, { recursive: true });
    }

    const imageUrls = extractImagePaths(contentHTML);
    let updatedHTML = contentHTML;
    let updatedJSON = JSON.parse(JSON.stringify(contentJSON));
    const movedFiles = [];

    // 3️⃣ Move editor images from temp → news/:id
    for (const url of imageUrls) {
      if (url.includes("/temp/")) {
        const filename = path.basename(url);
        const oldPath = path.join(tempFolder, filename);
        const newPath = path.join(newsFolder, filename);

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          movedFiles.push(filename);
          console.log(`MOVED: ${filename} → ${newsFolder}`);
        } else {
          console.error(`File not found in temp: ${oldPath}`);
        }

        // Update HTML URL
        const newUrl = `${process.env.BASE_URL}/mint-media-storage/success-stories/${newsId}/${filename}`;
        updatedHTML = updatedHTML.split(url).join(newUrl);
      }
    }

    // 4️⃣ Update JSON structure URLs
    const updateJsonImages = (nodes) => {
      for (let node of nodes) {
        if (node.type === "image" && node.url && node.url.includes("/temp/")) {
          const filename = path.basename(node.url);
          node.url = `${process.env.BASE_URL}/mint-media-storage/success-stories/${newsId}/${filename}`;
        }
        if (node.children) updateJsonImages(node.children);
      }
    };

    updateJsonImages(updatedJSON);

    // 5️⃣ Cleanup unused temp uploads
    for (const file of uploadedImages) {
      if (!movedFiles.includes(file)) {
        const filePath = path.join(tempFolder, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`CLEANED TEMP: ${file}`);
        }
      }
    }

    // 6️⃣ Save updated content
    news.contentHTML = updatedHTML;
    news.contentJSON = updatedJSON;
    await news.save();

    return res.status(201).json({
      message: "Article created successfully",
      news,
    });
  } catch (error) {
    console.error("News Creation Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Helper function
function extractImagePaths(html) {
  const regex = /src="([^"]+)"/g;
  const matches = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

exports.getAllNews = async (req, res) => {
  try {
    const newsList = await News.find()
      .sort({ createdAt: -1 })
      .select("-contentJSON"); // optional: exclude heavy JSON for list view

    return res.status(200).json(newsList);
  } catch (error) {
    console.error("Get All News Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    return res.status(200).json(news);
  } catch (error) {
    console.error("Get News By ID Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, contentJSON, contentHTML, uploadedImages = [] } = req.body;

    if (!title || !contentJSON || !contentHTML) {
      return res.status(400).json({ message: "All fields are required" });
    }
    console.log(req.body);

    const existingNews = await News.findById(id);
    if (!existingNews) {
      return res.status(404).json({ message: "News not found" });
    }

    const newsId = existingNews._id.toString();
    const baseStoragePath = path.join(process.cwd(), "uploads");
    const tempFolder = path.join(baseStoragePath, "temp");
    const newsFolder = path.join(baseStoragePath, "success-stories", newsId);
    const coverFolder = path.join(
      baseStoragePath,
      "success-stories",
      "cover-photos",
    );

    if (!fs.existsSync(newsFolder))
      fs.mkdirSync(newsFolder, { recursive: true });
    if (!fs.existsSync(coverFolder))
      fs.mkdirSync(coverFolder, { recursive: true });

    let updatedHTML = contentHTML;
    let updatedJSON = JSON.parse(JSON.stringify(contentJSON));
    const imageUrls = extractImagePaths(contentHTML);
    const movedFiles = [];

    // 🔹 1. Move new temp images
    for (const url of imageUrls) {
      if (url.includes("/temp/")) {
        const filename = path.basename(url);
        const oldPath = path.join(tempFolder, filename);
        const newPath = path.join(newsFolder, filename);

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          movedFiles.push(filename);
        }

        const newUrl = `${process.env.BASE_URL}/mint-media-storage/success-stories/${newsId}/${filename}`;
        updatedHTML = updatedHTML.split(url).join(newUrl);
      }
    }

    // 🔹 2. Update JSON image URLs
    const updateJsonImages = (nodes) => {
      for (let node of nodes) {
        if (node.type === "image" && node.url && node.url.includes("/temp/")) {
          const filename = path.basename(node.url);
          node.url = `${process.env.BASE_URL}/mint-media-storage/success-stories/${newsId}/${filename}`;
        }
        if (node.children) updateJsonImages(node.children);
      }
    };
    updateJsonImages(updatedJSON);

    // 🔹 3. Delete removed editor images from disk
    const existingImages = fs.existsSync(newsFolder)
      ? fs.readdirSync(newsFolder)
      : [];
    const currentImageFilenames = imageUrls.map((url) => path.basename(url));
    for (const file of existingImages) {
      if (!currentImageFilenames.includes(file)) {
        fs.unlinkSync(path.join(newsFolder, file));
      }
    }

    // 🔹 4. Cleanup unused temp uploads
    for (const file of uploadedImages) {
      if (!movedFiles.includes(file)) {
        const filePath = path.join(tempFolder, file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    // 🔹 5. Handle cover photo replacement
    if (req.file) {
      // Delete old cover if exists
      if (existingNews.coverPhoto) {
        const oldCoverFilename = path.basename(existingNews.coverPhoto);
        const oldCoverPath = path.join(coverFolder, oldCoverFilename);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
          console.log(`Deleted old cover: ${oldCoverFilename}`);
        }
      }

      // Save new cover URL
      existingNews.coverPhoto = `${process.env.BASE_URL}/mint-media-storage/success-stories/cover-photos/${req.file.filename}`;
    }

    // 🔹 6. Save final content
    existingNews.title = title;
    existingNews.contentHTML = updatedHTML;
    existingNews.contentJSON = updatedJSON;

    await existingNews.save();

    return res.status(200).json({
      message: "Article updated successfully",
      news: existingNews,
    });
  } catch (error) {
    console.error("News Update Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const existingNews = await News.findById(id);
    if (!existingNews) {
      return res.status(404).json({ message: "News not found" });
    }

    const newsId = existingNews._id.toString();

    const baseStoragePath = path.join(process.cwd(), "uploads");
    const newsFolder = path.join(baseStoragePath, "success-stories", newsId);
    const coverFolder = path.join(
      baseStoragePath,
      "success-stories",
      "cover-photos",
    );

    // 🔥 1️⃣ Delete editor images folder
    if (fs.existsSync(newsFolder)) {
      fs.rmSync(newsFolder, { recursive: true, force: true });
      console.log(`Deleted news folder: ${newsFolder}`);
    }

    // 🔥 2️⃣ Delete cover photo file
    if (existingNews.coverPhoto) {
      const coverFilename = path.basename(existingNews.coverPhoto);
      const coverPath = path.join(coverFolder, coverFilename);

      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
        console.log(`Deleted cover photo: ${coverFilename}`);
      }
    }

    // 🔥 3️⃣ Delete DB record
    await News.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Delete News Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
