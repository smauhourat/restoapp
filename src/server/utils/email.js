import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(destinatario, nombre, resetUrl) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'RestoApp <no-reply@restoapp.com>',
    to: destinatario,
    subject: 'Recuperación de contraseña — RestoApp',
    text:
      `Hola ${nombre},\n\n` +
      `Recibiste este email porque solicitaste restablecer tu contraseña.\n\n` +
      `Usá el siguiente enlace (válido por 1 hora):\n${resetUrl}\n\n` +
      `Si no lo solicitaste, ignorá este mensaje.\n`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#05636e">Recuperación de contraseña</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Recibiste este email porque solicitaste restablecer tu contraseña en RestoApp.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}"
             style="background:#05636e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Restablecer contraseña
          </a>
        </p>
        <p style="color:#666;font-size:13px">
          Este enlace expira en <strong>1 hora</strong>.<br>
          Si no solicitaste este cambio, ignorá este email.
        </p>
        <hr style="border:none;border-top:1px solid #eee">
        <p style="color:#999;font-size:12px">RestoApp</p>
      </div>`,
  });
}
