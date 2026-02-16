export const uploadEditorImage = (req, res) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:8000";
  const FOLDER = "temp";

  res.json({
    url: `${baseUrl}/mint-media-storage/temp/${req.file.filename}`,
    filename: req.file.filename,
  });
};
