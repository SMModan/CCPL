import nodemailer from "nodemailer";

export function enquiryInbox() {
  return process.env.ENQUIRY_TO || "info@comprehensivecleaning.au";
}

export async function sendMail({ to, subject, text }) {
  const host = process.env.SMTP_HOST;
  if (!host || !to) return { sent: false };
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" }
      : undefined,
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
  return { sent: true };
}
