import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function fileFilter(_req: any, file: any, cb: any) {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase());
  if (ok) cb(null, true);
  else cb(new Error("Only image files are allowed"));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

// Chat attachments: photos (evidence, proof-of-ownership shots) or short
// voice notes recorded in the browser (webm/ogg/mp3 from MediaRecorder).
function chatFileFilter(_req: any, file: any, cb: any) {
  const allowedExt = /jpeg|jpg|png|webp|gif|webm|ogg|mp3|m4a|wav/;
  const allowedMime = /^image\/|^audio\//;
  const ok = allowedExt.test(path.extname(file.originalname).toLowerCase()) || allowedMime.test(file.mimetype);
  if (ok) cb(null, true);
  else cb(new Error("Only images or audio voice notes are allowed"));
}

export const chatUpload = multer({
  storage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});
