import nodemailer from "nodemailer";

const user = process.env.MAILTRAP_USER;
const pass = process.env.MAILTRAP_PASSWORD;

export const mailtrap = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user,
    pass,
  },
});
