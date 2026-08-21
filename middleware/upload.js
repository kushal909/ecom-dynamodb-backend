import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    console.log("FILE:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".jfif",
      ".bmp",
      ".tiff",
      ".svg",
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (
      file.mimetype.startsWith("image/") ||
      allowedExtensions.includes(extension)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});