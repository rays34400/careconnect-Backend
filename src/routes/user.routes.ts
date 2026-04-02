import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadProfilePhoto } from "../middlewares/uploadProfilePhoto.middleware";
import { updateMyPhoto, updateMyProfile } from "../controllers/user.controller";
import { getMyProfile } from "../controllers/auth.controller";
const router = Router();
router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.put(
  "/me/photo",
  authMiddleware,
  uploadProfilePhoto.single("photo"),
  updateMyPhoto
);

export default router;