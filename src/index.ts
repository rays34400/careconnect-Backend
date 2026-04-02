import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import photoRoutes from "./routes/user.routes";
import path from "path";
import availabilityRoutes from "./routes/availability.routes";
import appointmentRoutes from "./routes/appointment.routes";
import professionalRoutes from "./routes/professional.routes";


// Charger les variables d'environnement (.env)
dotenv.config();

// Initialisation de l'application Express
const app: Application = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Route de test
app.get("/", (req: Request, res: Response) => {
  res.send("CareConnect API is running 🚀");
});
app.use("/api/auth", authRoutes);
app.use("/api/users", photoRoutes);
app.use("/api/availabilities", availabilityRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/professionals", professionalRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// Port du serveur
const PORT = process.env.PORT || 3000;
connectDB();
// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});