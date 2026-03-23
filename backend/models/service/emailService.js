const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Asegúrate de poner tu API Key de SendGrid aquí.

const sendOTPEmail = async (toEmail, otp) => {
  const msg = {
    to: toEmail,
    from: 'novagraf.oficial@gmail.com', // Cambia a tu correo verificado de SendGrid
    subject: 'Código de Activación',
    text: `Tu código de activación es: ${otp}. Este código expirará en 10 minutos.`,
    html: `<p>Tu código de activación es: <strong>${otp}</strong></p><p>Este código expirará en 10 minutos.</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log('Correo enviado correctamente');
  } catch (error) {
    console.error('Error enviando el correo:', error);
    throw new Error('Error enviando el correo OTP');
  }
};

module.exports = { sendOTPEmail };