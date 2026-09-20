import "server-only";
import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
export async function sendAuthMail(to: string, subject: string, url: string) {
  if (
    process.env.MAIL_TRANSPORT === "file" &&
    process.env.NODE_ENV !== "production"
  ) {
    const folder = resolve(".local/mail");
    await mkdir(folder, { recursive: true, mode: 0o700 });
    await writeFile(
      resolve(folder, randomUUID() + ".json"),
      JSON.stringify({ to, subject, url }),
      { mode: 0o600 },
    );
    return;
  }
  if (
    process.env.MAIL_TRANSPORT !== "smtp" ||
    !process.env.SMTP_HOST ||
    !process.env.MAIL_FROM
  )
    throw new Error("Mail delivery is not configured");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: process.env.NODE_ENV === "production",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text: `${subject}\n\n${url}\n\nIf you did not request this, ignore this message.`,
  });
}
