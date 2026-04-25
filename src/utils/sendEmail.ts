import nodemailer from "nodemailer";

export const sendVerificationEmail = async (
  to: string,
  token: string
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationUrl = `https://careconnect-frontend-three.vercel.app/verify-email/${token}`;
  await transporter.sendMail({
    from: `"CareConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Vérification de votre email",
    html: `
      <p>Bienvenue sur CareConnect 👋</p>
      <p>Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
      <a href="${verificationUrl}">Vérifier mon email</a>
      <p>Ce lien expire dans 1 heure.</p>
    `,
  });
};




export const appointmentTemplate = (
  type: "created" | "confirmed" | "cancelled",
  patientName: string,
  professionalName: string,
  date: string,
  startTime: string,
  endTime: string
) => {
  let title = "";
  let color = "#2196f3";

  if (type === "confirmed") {
    title = "Rendez-vous confirmé";
    color = "#4CAF50";
  }

  if (type === "cancelled") {
    title = "Rendez-vous annulé";
    color = "#F44336";
  }

  if (type === "created") {
    title = "Nouvelle demande de rendez-vous";
  }

  return `
    <div style="font-family: Arial; padding:20px">
      <h2 style="color:${color}">${title}</h2>
      <p><strong>Date :</strong> ${date}</p>
      <p><strong>Heure :</strong> ${startTime} - ${endTime}</p>
      <p><strong>Patient :</strong> ${patientName}</p>
      <p><strong>Professionnel :</strong> ${professionalName}</p>
      <hr />
      <p style="font-size:12px;color:gray">
        CareConnect - Plateforme de rendez-vous médicaux
      </p>
    </div>
  `;
};