const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage(); // ✅ Memory para buffer (não salva em disco)

const fileFilter = (req, file, cb) => {
  if (
    file.originalname.toLowerCase().endsWith(".csv") &&
    (file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos CSV são permitidos"), false);
  }
};

const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Arquivo muito grande (máx. 10MB)",
      });
    }
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Erro no upload do arquivo",
    });
  }
  next();
};

module.exports = { upload, handleMulterError };