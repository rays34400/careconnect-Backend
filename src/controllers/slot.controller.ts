import { Request, Response } from "express";
import Availability from "../models/Availability";
import Appointment from "../models/Appointment";
import User from "../models/User";


export const getProfessionalSlotsForDate = async (
  req: Request,
  res: Response
) => {
  try {
    const { professionalId } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return res.status(400).json({
        message: "La date est obligatoire (YYYY-MM-DD)",
      });
    }

    const professional = await User.findById(professionalId);

    if (!professional || professional.role !== "professional") {
      return res.status(404).json({
        message: "Professionnel introuvable",
      });
    }

    const duration: number = Number(professional.sessionDuration);

    const selectedDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = selectedDate.getDay();

    const availabilities = await Availability.find({
      professional: professionalId,
      dayOfWeek,
      isActive: true,
    });

    if (!availabilities.length) {
      return res.json({ slots: [] });
    }

    // RDV existants
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      professional: professionalId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed"] },
    });

    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(":").map(Number);
      return h * 60 + m;
    };

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

        const isBusy = busySlots.some(
          (b) =>
            slotStart < b.end &&
            b.start < slotEnd
        );

        if (!isBusy) {
          const hour = Math.floor(slotStart / 60)
            .toString()
            .padStart(2, "0");
          const minute = (slotStart % 60)
            .toString()
            .padStart(2, "0");

          slots.push(`${hour}:${minute}`);
        }
      }
    }

    return res.json({
      date,
      duration,
      slots,
    });
  } catch {
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};