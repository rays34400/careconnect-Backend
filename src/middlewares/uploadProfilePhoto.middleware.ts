import multer from "multer";
import path from "path";
import fs from "fs";

const profilesDir = path.join(process.cwd(), "uploads", "profiles");

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req: any, file, cb) => {
    // On force un nom unique basé sur userId + timestamp
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext || ".jpg";
    cb(null, `${req.user._id}-${Date.now()}${safeExt}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Format invalide. Utilise JPG, PNG ou WEBP."));
  }
  cb(null, true);
};

export const uploadProfilePhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});