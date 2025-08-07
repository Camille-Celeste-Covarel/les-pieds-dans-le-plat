import path from "node:path";
import type { Request } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const avatarStorage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    // Le chemin est maintenant fixe et pointe directement vers le dossier des avatars
    const destinationPath = path.join(__dirname, "..", "..", "uploads", "avatars");
    cb(null, destinationPath);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Le fichier envoyé n'est pas une image !"));
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

export default uploadAvatar;
