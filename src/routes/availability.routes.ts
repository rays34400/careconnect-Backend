import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAvailabilities, getMyAvailabilities , updateAvailability , deleteAvailability} from "../controllers/availability.controller";

const router = Router();

router.post("/", authMiddleware, createAvailabilities);
router.get("/me", authMiddleware, getMyAvailabilities);
router.put("/:id", authMiddleware, updateAvailability);
router.delete("/:id", authMiddleware, deleteAvailability);
export default router;