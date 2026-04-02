import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { hashPassword, comparePassword } from "../utils/password";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendEmail";
import { AuthRequest } from "../middlewares/auth.middleware";
/**
 * =========================
 * REGISTER
 * =========================
 */
export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      role,
      profession,
      specialties,
      nom,
      prenom,
      telephone,
      nomDeRue,
      numeroAdresse,
      codePostal,
      province,
      pays,
      dateDeNaissance,
    } = req.body;

    // 🔐 Validation rôle
    if (role === "professional") {
      if (!profession) {
        return res.status(400).json({
          message: "La profession est obligatoire pour un professionnel",
        });
      }

      if (!specialties || specialties.length === 0) {
        return res.status(400).json({
          message: "Au moins une spécialité est obligatoire pour un professionnel",
        });
      }
    }

    if (role === "patient") {
      if (profession || (specialties && specialties.length > 0)) {
        return res.status(400).json({
          message: "Un patient ne doit pas avoir de profession ou de spécialités",
        });
      }
    }

    // Vérifier si email existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // 🔑 Hash du mot de passe
    const hashedPassword = await hashPassword(password);

    // 🔐 Génération token email
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 heure

    // 👤 Création user
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      profession,
      specialties,
      nom,
      prenom,
      telephone,
      nomDeRue,
      numeroAdresse,
      codePostal,
      province,
      pays,
      dateDeNaissance,

      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    });

    // 📧 Envoi email (non bloquant)
    try {
      await sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
    }

    return res.status(201).json({
      message: "Utilisateur créé avec succès. Veuillez vérifier votre email.",
      userId: user._id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error });
  }
};

/**
 * =========================
 * LOGIN
 * =========================
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Récupérer user + password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // 🚫 Bloquer si email non vérifié
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Veuillez vérifier votre email avant de vous connecter",
      });
    }

    // Comparer les mots de passe
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // ✅ Générer JWT (CORRIGÉ)
    const token = jwt.sign(
      {
        userId: user._id, // ✅ au lieu de id
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Connexion réussie",
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error });
  }
};

/**
 * =========================
 * VERIFY EMAIL
 * =========================
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Lien invalide ou expiré" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return res.json({ message: "Email vérifié avec succès 🎉" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};


export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};