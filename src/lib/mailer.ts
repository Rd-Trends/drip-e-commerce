import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: 'smtp.zeptomail.com',
  port: 587,
  pool: true,
  maxConnections: 5,
  auth: {
    user: 'emailapikey',
    pass: process.env.ZEPTOMAIL_API_KEY || '',
  },
})
