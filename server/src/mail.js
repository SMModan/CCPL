import nodemailer from "nodemailer";

export function enquiryInbox() {
  return process.env.ENQUIRY_TO || "info@comprehensivecleaning.au";
}

export async function sendMail({ to, subject, text, html, replyTo }) {
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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    replyTo: replyTo || undefined,
    subject,
    text,
    html: html || undefined,
  });
  return { sent: true };
}
