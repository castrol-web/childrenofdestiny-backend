import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const user = process.env.USER;
const pass = process.env.PASS;
const port = process.env.EMAIL_PORT;
const host = process.env.HOST;
const secure = Boolean(process.env.SECURE)

//creation of the transport object
export const transporter = nodemailer.createTransport({
    host,
    service: 'gmail',
    port,
    secure,
    auth: {
        user,
        pass,
    },
});

//mail options
export const mailOptions = {
    from: user,
    to: user,
};


