const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Para activar la cuenta (registro)
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

// Para recuperar la contraseña
const sendRecoveryEmail = async (toEmail, otp) => {
  const msg = {
    to: toEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Recuperación de contraseña - NovaGraf',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b;">Recupera tu contraseña</h2>
        <p style="color: #64748b;">Usa el siguiente código para restablecer tu contraseña:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 2.5rem; font-weight: bold; letter-spacing: 12px; color: #4f46e5;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 0.85rem;">Este código expira en <strong>10 minutos</strong>. Si no solicitaste esto, ignora este correo.</p>
      </div>
    `,
  };
  await sgMail.send(msg);
};

module.exports = { sendOTPEmail, sendRecoveryEmail };