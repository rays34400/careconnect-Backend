import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.middleware";
import Availability from "../models/Availability";
import User from "../models/User";

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/**
 * =========================
 * CREATE AVAILABILITIES
 * (1 ou plusieurs)
 * =========================
 */
export const createAvailabilities = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== "professional") {
      return res
        .status(403)
        .json({ message: "Accès réservé aux professionnels" });
    }

    const input = Array.isArray(req.body) ? req.body : [req.body];

    if (input.length === 0) {
      return res.status(400).json({ message: "Aucune disponibilité fournie" });
    }

    for (const item of input) {
      if (
        item.dayOfWeek === undefined ||
        !item.startTime ||
        !item.endTime
      ) {
        return res.status(400).json({
          message:
            "Chaque disponibilité doit contenir dayOfWeek, startTime et endTime",
        });
      }

      const newStart = toMinutes(item.startTime);
      const newEnd = toMinutes(item.endTime);

      if (newStart >= newEnd) {
        return res.status(400).json({
          message: "L'heure de fin doit être après l'heure de début",
        });
      }
    }

    const conflicts = [];

    for (const item of input) {
      const newStart = toMinutes(item.startTime);
      const newEnd = toMinutes(item.endTime);

      const existingAvailabilities = await Availability.find({
        professional: req.user._id as any,
        dayOfWeek: item.dayOfWeek,
      } as any);

      const hasConflict = existingAvailabilities.some((existing: any) => {
        const existingStart = toMinutes(existing.startTime);
        const existingEnd = toMinutes(existing.endTime);

        return newStart < existingEnd && existingStart < newEnd;
      });

      if (hasConflict) {
        conflicts.push(item);
      }
    }

    if (conflicts.length > 0) {
      return res.status(400).json({
        message:
          "Certaines disponibilités se chevauchent avec des disponibilités existantes",
        conflicts,
      });
    }

    const formatted = input.map((item: any) => ({
      professional: req.user!._id,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      isActive: true,
    }));

    const created = await Availability.insertMany(formatted);

    return res.status(201).json({
      message: "Disponibilités ajoutées avec succès",
      data: created,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

/**
 * =========================
 * GET MY AVAILABILITIES
 * =========================
 */
export const getMyAvailabilities = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== "professional") {
      return res
        .status(403)
        .json({ message: "Accès réservé aux professionnels" });
    }

    const availabilities = await Availability.find({
      professional: req.user._id as any,
    }).sort({ dayOfWeek: 1, startTime: 1 });

    return res.json(availabilities);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

/**
 * =========================
 * UPDATE AVAILABILITY
 * =========================
 */
export const updateAvailability = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== "professional") {
      return res
        .status(403)
        .json({ message: "Accès réservé aux professionnels" });
    }

    const rawId = req.params.id;

    if (!rawId || Array.isArray(rawId)) {
      return res.status(400).json({
        message: "Id de disponibilité invalide",
      });
    }

    const id = rawId;
    const { dayOfWeek, startTime, endTime, isActive } = req.body;

    const availability = await Availability.findById(id);

    if (!availability) {
      return res.status(404).json({
        message: "Disponibilité introuvable",
      });
    }

    if (
      availability.professional.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Vous ne pouvez modifier que vos propres disponibilités",
      });
    }

    const finalDayOfWeek =
      dayOfWeek !== undefined ? dayOfWeek : availability.dayOfWeek;

    const finalStartTime =
      startTime !== undefined ? startTime : availability.startTime;

    const finalEndTime =
      endTime !== undefined ? endTime : availability.endTime;

    const newStart = toMinutes(finalStartTime);
    const newEnd = toMinutes(finalEndTime);

    if (newStart >= newEnd) {
      return res.status(400).json({
        message: "L'heure de fin doit être après l'heure de début",
      });
    }

    const existingAvailabilities = await Availability.find({
      professional: req.user._id as any,
      dayOfWeek: finalDayOfWeek,
      _id: { $ne: new mongoose.Types.ObjectId(id) },
    } as any);

    const hasConflict = existingAvailabilities.some((existing: any) => {
      const existingStart = toMinutes(existing.startTime);
      const existingEnd = toMinutes(existing.endTime);

      return newStart < existingEnd && existingStart < newEnd;
    });

    if (hasConflict) {
      return res.status(400).json({
        message:
          "Cette disponibilité chevauche une autre disponibilité existante",
      });
    }

    if (dayOfWeek !== undefined) availability.dayOfWeek = dayOfWeek;
    if (startTime !== undefined) availability.startTime = startTime;
    if (endTime !== undefined) availability.endTime = endTime;
    if (isActive !== undefined) availability.isActive = isActive;

    await availability.save();

    return res.json({
      message: "Disponibilité mise à jour avec succès",
      data: availability,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

/**
 * =========================
 * DELETE AVAILABILITY
 * =========================
 */
export const deleteAvailability = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== "professional") {
      return res
        .status(403)
        .json({ message: "Accès réservé aux professionnels" });
    }

    const { id } = req.params;

    const availability = await Availability.findById(id);

    if (!availability) {
      return res.status(404).json({
        message: "Disponibilité introuvable",
      });
    }

    if (
      availability.professional.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Vous ne pouvez supprimer que vos propres disponibilités",
      });
    }

    await availability.deleteOne();

    return res.json({
      message: "Disponibilité supprimée avec succès",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};
