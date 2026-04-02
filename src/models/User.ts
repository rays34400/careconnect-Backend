import { Schema, model, Document } from "mongoose";
import { Profession, PROFESSIONS } from "../constants/medicalFields";

/**
 * =========================
 * Interface TypeScript
 * =========================
 */
export interface IUser extends Document {
  nom: string;
  prenom: string;
  nomDeRue: string;
  numeroAdresse: number;
  codePostal: string;
  province: string;
  pays: string;
  dateDeNaissance: Date;
  telephone: string;
  email: string;
  password: string;
  sessionDuration: number;
  role: "patient" | "professional";
  bookingMode: "auto" | "manual"
  profession?: Profession;
  specialties?: string[];
  photo?: string | null;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * =========================
 * Schema Mongoose
 * =========================
 */
const UserSchema = new Schema<IUser>(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },

    prenom: {
      type: String,
      required: true,
      trim: true,
    },

    nomDeRue: {
      type: String,
      required: true,
      trim: true,
    },

    numeroAdresse: {
      type: Number,
      required: true,
    },

    codePostal: {
      type: String,
      required: true,
      trim: true,
    },

    province: {
      type: String,
      required: true,
      trim: true,
    },

    pays: {
      type: String,
      required: true,
      trim: true,
    },

    dateDeNaissance: {
      type: Date,
      required: true,
    },

    telephone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["patient", "professional"],
      required: true,
    },

    profession: {
      type: String,
      enum: PROFESSIONS,
    },

    specialties: {
      type: [String],
      default: [],
    }, 
    photo: {
      type: String,
      default: null,
    },
    sessionDuration: {
    type: Number,
    default: 30,
    },
    bookingMode: {
    type: String,
    enum: ["auto", "manual"],
    default: "auto",
    },
    isEmailVerified: {
  type: Boolean,
  default: false,
},

  emailVerificationToken: {
    type: String,
  },

  emailVerificationExpires: {
    type: Date,
  },
  },
  {
    timestamps: true,
  }
);

/**
 * =========================
 * Model
 * =========================
 */
const User = model<IUser>("User", UserSchema);

export default User;