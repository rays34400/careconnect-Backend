import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import Appointment from "../models/Appointment";
import Availability from "../models/Availability";
import User from "../models/User";
import {
  sendAppointmentEmail,
  appointmentTemplate,
} from "../utils/sendAppointmentEmail";

/* =====================================================
   HELPERS
===================================================== */

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const formatDateYYYYMMDD = (d: Date) => d.toISOString().split("T")[0];

/* =====================================================
   CREATE APPOINTMENT
===================================================== */

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Non authentifié" });

    const { professionalId, patientId, date, startTime, note } = req.body;

    if (!professionalId || !date || !startTime) {
      return res.status(400).json({ message: "Données manquantes" });
    }

    const professional = await User.findById(professionalId);
    if (!professional || professional.role !== "professional") {
      return res.status(404).json({ message: "Professionnel introuvable" });
    }

    // 🔎 Déterminer patient
    let finalPatientId: string;

    if (req.user.role === "patient") {
      finalPatientId = req.user._id.toString();
    } else if (req.user.role === "professional") {
      if (!patientId) {
        return res.status(400).json({ message: "patientId requis" });
      }

      const patient = await User.findById(patientId);
      if (!patient || patient.role !== "patient") {
        return res.status(404).json({ message: "Patient introuvable" });
      }

      finalPatientId = patient._id.toString();
    } else {
      return res.status(403).json({ message: "Rôle non autorisé" });
    }

    const duration = Number(professional.sessionDuration);

    const startMinutes = toMinutes(startTime);
    const endMinutes = startMinutes + duration;

    const endHour = Math.floor(endMinutes / 60).toString().padStart(2, "0");
    const endMinute = (endMinutes % 60).toString().padStart(2, "0");
    const endTime = `${endHour}:${endMinute}`;

    const selectedDate = new Date(`${date}T00:00:00`);
    if (selectedDate < new Date()) {
      return res.status(400).json({ message: "Impossible de réserver dans le passé" });
    }

    const dayOfWeek = selectedDate.getDay();

    // 🔎 Vérifier dispo
    const availability = await Availability.findOne({
      professional: professionalId,
      dayOfWeek,
      isActive: true,
    });

    if (!availability) {
      return res.status(400).json({ message: "Professionnel indisponible ce jour" });
    }

    // 🔎 Vérifier conflit (slot exact)
    const existingAppointment = await Appointment.findOne({
      professional: professionalId,
      date: selectedDate,
      startTime,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "Créneau déjà réservé" });
    }

    const status = professional.bookingMode === "auto" ? "confirmed" : "pending";

    const appointment = await Appointment.create({
      patient: finalPatientId,
      professional: professionalId,
      date: selectedDate,
      startTime,
      endTime,
      note,
      status,
    });

    // 📧 EMAILS (non bloquant)
    try {
      const patientUser = await User.findById(finalPatientId);

      if (patientUser) {
        await sendAppointmentEmail(
          patientUser.email,
          status === "confirmed" ? "Rendez-vous confirmé" : "Demande de rendez-vous",
          appointmentTemplate(
            status === "confirmed" ? "confirmed" : "created",
            `${patientUser.nom} ${patientUser.prenom}`,
            `${professional.nom} ${professional.prenom}`,
            date,
            startTime,
            endTime
          )
        );

        await sendAppointmentEmail(
          professional.email,
          status === "confirmed" ? "Nouveau rendez-vous confirmé" : "Nouvelle demande de rendez-vous",
          appointmentTemplate(
            status === "confirmed" ? "confirmed" : "created",
            `${patientUser.nom} ${patientUser.prenom}`,
            `${professional.nom} ${professional.prenom}`,
            date,
            startTime,
            endTime
          )
        );
      }
    } catch (e) {
      console.error("Erreur envoi email RDV:", e);
    }

    return res.status(201).json({ message: "Rendez-vous créé", appointment });
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

/* =====================================================
   GET PROFESSIONAL SLOTS
===================================================== */

export const getProfessionalSlotsForDate = async (
  req: Request<{ professionalId: string }, {}, {}, { date: string }>,
  res: Response
) => {
  try {
    const { professionalId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "La date est obligatoire (YYYY-MM-DD)" });
    }

    const professional = await User.findById(professionalId);
    if (!professional || professional.role !== "professional") {
      return res.status(404).json({ message: "Professionnel introuvable" });
    }

    const duration = Number(professional.sessionDuration);
    const selectedDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = selectedDate.getDay();

    const availabilities = await Availability.find({
      professional: professionalId,
      dayOfWeek,
      isActive: true,
    });

    if (!availabilities.length) return res.json({ slots: [] });

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      professional: professionalId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed"] },
    });

    const busySlots = appointments.map((a: any) => ({
      start: toMinutes(a.startTime),
      end: toMinutes(a.endTime),
    }));

    const slots: string[] = [];

    for (const av of availabilities) {
      const start = toMinutes(av.startTime);
      const end = toMinutes(av.endTime);

      for (let t = start; t + duration <= end; t += duration) {
        const slotStart = t;
        const slotEnd = t + duration;

        const isBusy = busySlots.some((b) => slotStart < b.end && b.start < slotEnd);

        if (!isBusy) {
          const hour = Math.floor(slotStart / 60).toString().padStart(2, "0");
          const minute = (slotStart % 60).toString().padStart(2, "0");
          slots.push(`${hour}:${minute}`);
        }
      }
    }

    return res.json({ date, duration, slots });
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

/* =====================================================
   GET MY APPOINTMENTS (patient OU pro)
===================================================== */

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const { timeframe, status, page = "1", limit = "10" } = req.query;

    const filter: any =
      req.user.role === "patient"
        ? { patient: req.user._id }
        : { professional: req.user._id };

    if (status && typeof status === "string") {
      filter.status = status;
    }

    if (timeframe && typeof timeframe === "string") {
      const now = new Date();

      if (timeframe === "upcoming") {
        filter.date = { $gte: now };
      }

      if (timeframe === "past") {
        filter.date = { $lt: now };
      }
    }

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("patient", "nom prenom email")
        .populate("professional", "nom prenom profession email")
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(limitNumber),

      Appointment.countDocuments(filter),
    ]);

    return res.json({
      data: appointments,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

/* =====================================================
   GET PENDING APPOINTMENTS (pro)
===================================================== */

export const getPendingAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "professional") {
      return res.status(403).json({ message: "Accès réservé aux professionnels" });
    }

    const appointments = await Appointment.find({
      professional: req.user._id,
      status: "pending",
    })
      .populate("patient", "nom prenom email")
      .sort({ date: 1 });

    return res.json(appointments);
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

/* =====================================================
   UPDATE APPOINTMENT STATUS (pro)
===================================================== */

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "professional") {
      return res.status(403).json({ message: "Accès réservé aux professionnels" });
    }

    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      professional: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous introuvable" });
    }

    appointment.status = status;
    await appointment.save();

// 📧 email patient (non bloquant)
try {
  const patientUser = await User.findById(appointment.patient);
  const professionalUser = await User.findById(appointment.professional);

  if (patientUser && professionalUser) {
    const dateStr = formatDateYYYYMMDD(new Date(appointment.date));

    let subject = "";
    let templateType: "created" | "confirmed" | "cancelled";

    if (status === "confirmed") {
      subject = "Rendez-vous confirmé";
      templateType = "confirmed";
    } else if (status === "cancelled") {
      subject = "Rendez-vous annulé";
      templateType = "cancelled";
    } else {
      subject = "Mise à jour du rendez-vous";
      templateType = "created";
    }

    await sendAppointmentEmail(
      patientUser.email,
      subject,
      appointmentTemplate(
        templateType,
        `${patientUser.nom} ${patientUser.prenom}`,
        `${professionalUser.nom} ${professionalUser.prenom}`,
        dateStr,
        appointment.startTime,
        appointment.endTime
      )
    );
  }
} catch (e) {
  console.error("Erreur email update status:", e);
}

    return res.json({ message: "Statut mis à jour", appointment });
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

/* =====================================================
   CANCEL APPOINTMENT (patient OU pro)
===================================================== */

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Non authentifié" });

    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous introuvable" });
    }

    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isProfessional =
      appointment.professional.toString() === req.user._id.toString();

    if (!isPatient && !isProfessional) {
      return res.status(403).json({ message: "Accès interdit" });
    }

    if (appointment.status === "cancelled") {
  return res.status(400).json({ message: "Rendez-vous déjà annulé" });
}

    appointment.status = "cancelled";
    await appointment.save();

    // 📧 email patient (non bloquant)
    try {
      const patientUser = await User.findById(appointment.patient);
      const professionalUser = await User.findById(appointment.professional);

      if (patientUser && professionalUser) {
        const dateStr = formatDateYYYYMMDD(new Date(appointment.date));

        await sendAppointmentEmail(
          patientUser.email,
          `Rendez-vous annulé par ${isPatient ? "le patient" : "le professionnel"}`,
          appointmentTemplate(
            "cancelled",
            `${patientUser.nom} ${patientUser.prenom}`,
            `${professionalUser.nom} ${professionalUser.prenom}`,
            dateStr,
            appointment.startTime,
            appointment.endTime
          )
        );
      }
    } catch (e) {
      console.error("Erreur email annulation:", e);
    }

    return res.json({ message: "Rendez-vous annulé", appointment });
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      $or: [
        { patient: req.user._id },
        { professional: req.user._id },
      ],
    })
      .populate("patient", "nom prenom email")
      .populate("professional", "nom prenom profession email");

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous introuvable" });
    }

    return res.json(appointment);
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};