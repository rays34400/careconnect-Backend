import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middlewares/auth.middleware";
import fs from "fs";
import path from "path";


export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const {
      nom,
      prenom,
      telephone,
      nomDeRue,
      numeroAdresse,
      codePostal,
      province,
      pays,
      dateDeNaissance,
      profession,
      specialties,
      sessionDuration,
      bookingMode
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // 🔐 Règles métier
    if (user.role === "patient") {
      if (profession || (specialties && specialties.length > 0)) {
        return res.status(400).json({
          message: "Un patient ne peut pas avoir de profession ou de spécialités",
        });
      }
    }

    if (user.role === "professional") {
      if (profession !== undefined) user.profession = profession;
      if (specialties !== undefined) user.specialties = specialties;
    }

    if (user.role === "professional" && bookingMode !== undefined) {
    user.bookingMode = bookingMode;
}
    if (user.role === "professional" && sessionDuration !== undefined) {
      user.sessionDuration = sessionDuration;
    }
    // ✏️ Champs communs
    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;
    if (telephone !== undefined) user.telephone = telephone;
    if (nomDeRue !== undefined) user.nomDeRue = nomDeRue;
    if (numeroAdresse !== undefined) user.numeroAdresse = numeroAdresse;
    if (codePostal !== undefined) user.codePostal = codePostal;
    if (province !== undefined) user.province = province;
    if (pays !== undefined) user.pays = pays;
    if (sessionDuration !== undefined) user.sessionDuration = sessionDuration;
    if (bookingMode !== undefined) user.bookingMode = bookingMode;
    if (dateDeNaissance !== undefined)
      user.dateDeNaissance = new Date(dateDeNaissance);

    await user.save();

    return res.json({
      message: "Profil mis à jour avec succès",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};


export const updateMyPhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier envoyé" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // (optionnel) supprimer l’ancienne photo si existante et locale
    if (user.photo && user.photo.startsWith("/uploads/profiles/")) {
      const oldPath = path.join(process.cwd(), user.photo);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // nouveau chemin public
    user.photo = `/uploads/profiles/${req.file.filename}`;
    await user.save();

    return res.json({
      message: "Photo mise à jour avec succès",
      photo: user.photo,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Erreur serveur",
    });
  }
};

