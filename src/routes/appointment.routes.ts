import { Router } from "express";
import {
  createAppointment,
  getProfessionalSlotsForDate,
  getMyAppointments,
  getPendingAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentById
} from "../controllers/appointment.controller";

import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * =========================
 * 📅 Créneaux disponibles
 * =========================
 * Accessible publiquement (ou protégé si tu veux)
 */
router.get(
  "/professional/:professionalId/slots",
  getProfessionalSlotsForDate
);

/**
 * =========================
 * ➕ Créer rendez-vous
 * =========================
 */
router.post(
  "/",
  authMiddleware,
  createAppointment
);

/**
 * =========================
 * 📋 Voir MES rendez-vous
 * =========================
 */
router.get(
  "/me",
  authMiddleware,
  getMyAppointments
);

/**
 * =========================
 * ⏳ Voir rendez-vous en attente (pro)
 * =========================
 */
router.get(
  "/pending",
  authMiddleware,
  getPendingAppointments
);

/**
 * =========================
 * 🔄 Modifier statut (pro)
 * =========================
 */
router.patch(
  "/:appointmentId/status",
  authMiddleware,
  updateAppointmentStatus
);

/**
 * =========================
 * ❌ Annuler rendez-vous
 * =========================
 */
router.patch(
  "/:appointmentId/cancel",
  authMiddleware,
  cancelAppointment
);
/**
 * =========================
 * recuperer via id
 * =========================
 */

router.get("/:appointmentId", authMiddleware, getAppointmentById);
export default router;