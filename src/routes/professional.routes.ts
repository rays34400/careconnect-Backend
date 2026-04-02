import { Router } from "express";
import { getProfessionals } from "../controllers/professional.controller";
import { getProfessionalSuggestions } from "../controllers/professional.controller";
import { getProfessions } from "../controllers/professional.controller";
import { getSpecialties } from "../controllers/professional.controller";
import { getProfessionalById } from "../controllers/professional.controller";
const router = Router();

router.get("/", getProfessionals);
router.get("/suggestions", getProfessionalSuggestions);
router.get("/professions", getProfessions);
router.get("/specialties", getSpecialties);
router.get("/:id", getProfessionalById);

export default router;