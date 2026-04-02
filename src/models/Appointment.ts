import { Schema, model, Document, Types } from "mongoose";

/**
 * =========================
 * Interface TypeScript
 * =========================
 * Représente un rendez-vous entre
 * un patient et un professionnel
 */
export interface IAppointment extends Document {
  patient: Types.ObjectId;        // User (patient)
  professional: Types.ObjectId;   // User (professional)

  date: Date;                     // date du rendez-vous
  startTime: string;              // "09:00"
  endTime: string;                // "09:30"

  status: "pending" | "confirmed" | "cancelled";

  note?: string;                  // message du patient (optionnel)

  createdAt: Date;
  updatedAt: Date;
}

/**
 * =========================
 * Schema Mongoose
 * =========================
 */
const AppointmentSchema = new Schema<IAppointment>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    professional: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
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

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);


const Appointment = model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;