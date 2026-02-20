const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTPEmail = async (toEmail, otp) => {
  const msg = {
    to: toEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Código de verificación de tu cuenta',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Activa tu cuenta</h2>
        <p>Usa el siguiente código OTP para verificar tu correo:</p>
        <h1 style="letter-spacing: 8px; color: #4f46e5;">${otp}</h1>
        <p>Este código expira en <strong>10 minutos</strong>.</p>
      </div>
    `,
  };
  await sgMail.send(msg);
};

module.exports = { sendOTPEmail };