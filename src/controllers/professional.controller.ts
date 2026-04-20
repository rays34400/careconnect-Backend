import { Request, Response } from "express";
import User from "../models/User";
import Availability from "../models/Availability";

export const getProfessionals = async (req: Request, res: Response) => {
  try {
    const {
      q,
      profession,
      specialty,
      page = "1",
      limit = "10",
    } = req.query;

    const filters: any = {
      role: "professional",
      isEmailVerified: true,
    };

    // 🔍 Recherche intelligente
    if (q) {
      const keywords = (q as string).trim().split(/\s+/);

      filters.$or = keywords.flatMap((word: string) => [
        { nom: { $regex: word, $options: "i" } },
        { prenom: { $regex: word, $options: "i" } },
        { profession: { $regex: word, $options: "i" } },
        { specialties: { $regex: word, $options: "i" } },
      ]);
    }

    // 🎯 Filtres
    if (profession) {
      filters.profession = profession;
    }

    if (specialty) {
      filters.specialties = specialty;
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const [data, total] = await Promise.all([
      User.find(filters)
        .select("-password -emailVerificationToken -emailVerificationExpires")
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      User.countDocuments(filters),
    ]);

    return res.json({
      data,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * =====================================================
 * GET /api/professionals/:id
 * Détail d’un professionnel
 * =====================================================
 */
export const getProfessionalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const professional = await User.findOne({
      _id: id,
      role: "professional",
      isEmailVerified: true,
    }).select("-password -emailVerificationToken -emailVerificationExpires");

    if (!professional) {
      return res.status(404).json({
        message: "Professionnel introuvable",
      });
    }

    return res.json(professional);
  } catch {
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

/**
 * =====================================================
 * GET /api/professionals/suggestions?q=
 * Suggestions autocomplete
 * =====================================================
 */
export const getProfessionalSuggestions = async (
  req: Request,
  res: Response
) => {
  try {
    const { q } = req.query;

    // 🛑 si vide → rien
    if (!q || typeof q !== "string" || !q.trim()) {
      return res.json([]);
    }

    // 🔍 découpe mots (ex: "dr ra")
    const keywords = q.trim().split(/\s+/);

    const suggestions = await User.find({
      role: "professional",
      isEmailVerified: true,
      $or: keywords.flatMap((word) => [
        { nom: { $regex: word, $options: "i" } },
        { prenom: { $regex: word, $options: "i" } },
        { profession: { $regex: word, $options: "i" } },
        { specialties: { $regex: word, $options: "i" } },
      ]),
    })
      .select("nom prenom profession specialties photo")
      .sort({ nom: 1, prenom: 1 })
      .limit(5);

    return res.json(suggestions);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

/**
 * =====================================================
 * GET /api/professions
 * Liste distincte des professions
 * =====================================================
 */
export const getProfessions = async (_req: Request, res: Response) => {
  try {
    const professions = await User.distinct("profession", {
      role: "professional",
      isEmailVerified: true,
      profession: { $ne: null },
    });

    const cleaned = professions
      .filter((item) => typeof item === "string" && item.trim() !== "")
      .sort((a, b) => a.localeCompare(b));

    return res.json(cleaned);
  } catch {
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

/**
 * =====================================================
 * GET /api/specialties
 * Liste distincte des spécialités
 * =====================================================
 */
export const getSpecialties = async (_req: Request, res: Response) => {
  try {
    const specialties = await User.distinct("specialties", {
      role: "professional",
      isEmailVerified: true,
    });

    const cleaned = specialties
      .filter((item) => typeof item === "string" && item.trim() !== "")
      .sort((a, b) => a.localeCompare(b));

    return res.json(cleaned);
  } catch {
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};


export const getProfessionalAvailabilities = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const professional = await User.findOne({
      _id: id,
      role: "professional",
      isEmailVerified: true,
    }).select("_id nom prenom profession");

    if (!professional) {
      return res.status(404).json({
        message: "Professionnel introuvable",
      });
    }

    const availabilities = await Availability.find({
      professional: id,
      isActive: true,
    })
      .select("dayOfWeek startTime endTime isActive")
      .sort({ dayOfWeek: 1, startTime: 1 });

    return res.json({
      professionalId: professional._id,
      availabilities,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};