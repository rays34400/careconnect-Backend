import { Schema, model, Document, Types } from "mongoose";

/**
 * =========================
 * Interface TypeScript
 * =========================
 * Représente un créneau de disponibilité
 * d’un professionnel
 */
export interface IAvailability extends Document {
  professional: Types.ObjectId; // référence User (professional)

  dayOfWeek: number; // 0 = dimanche, 6 = samedi
  startTime: string; // "09:00"
  endTime: string;   // "12:00"

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * =========================
 * Schema Mongoose
 * =========================
 */
const AvailabilitySchema = new Schema<IAvailability>(
  {
    professional: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
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
const Availability = model<IAvailability>("Availability", AvailabilitySchema);

export default Availability;