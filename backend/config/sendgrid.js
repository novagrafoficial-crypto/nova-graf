const axios = require('axios');

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

// Colores oficiales de Nova Graf
const COLORES = {
  oscuro: '#0A2B2C',
  primario: '#1A6163',
  acento: '#35BA99',
  fondo: '#DBDBD3',
  suave: '#E6F2EF',
  texto: '#4B5F60',
  blanco: '#FFFFFF',
};

const sendEmail = async ({ to, subject, htmlContent }) => {
  try {
    await axios.post(
      BREVO_URL,
      {
        sender: {
          name: process.env.BREVO_FROM_NAME || 'Nova Graf',
          email: process.env.BREVO_FROM_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      }
    );
  } catch (error) {
    // Muestra el motivo real de Brevo sin imprimir la API key
    console.error('Error de Brevo:', error.response?.status, error.response?.data || error.message);
    throw new Error('No se pudo enviar el correo');
  }
};

// Diseño común con tablas y estilos en línea para que se vea bien en Gmail y Outlook
const plantillaCodigo = ({ titulo, mensaje, otp, minutos, notaFinal }) => `
<div style="margin:0; padding:0; background-color:${COLORES.fondo};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORES.fondo};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; background-color:${COLORES.blanco}; border-radius:12px; overflow:hidden; font-family:Arial, Helvetica, sans-serif;">
          <tr>
            <td align="center" style="background-color:${COLORES.primario}; border-bottom:4px solid ${COLORES.acento}; padding:26px 24px;">
              <span style="color:${COLORES.blanco}; font-size:26px; font-weight:bold; letter-spacing:1px;">Nova Graf</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <h1 style="margin:0 0 12px 0; color:${COLORES.oscuro}; font-size:22px; line-height:28px;">${titulo}</h1>
              <p style="margin:0; color:${COLORES.texto}; font-size:15px; line-height:23px;">${mensaje}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:${COLORES.suave}; border:1px solid ${COLORES.acento}; border-radius:10px; padding:20px 8px;">
                    <span style="color:${COLORES.primario}; font-size:34px; font-weight:bold; letter-spacing:8px;">${otp}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 30px 32px;">
              <p style="margin:0; color:${COLORES.texto}; font-size:13px; line-height:20px;">Este código expira en <strong style="color:${COLORES.oscuro};">${minutos} minutos</strong>. ${notaFinal}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:${COLORES.oscuro}; padding:16px 24px;">
              <span style="color:${COLORES.blanco}; font-size:12px;">Nova Graf · Correo automático, por favor no respondas.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;

// Para activar la cuenta (registro)
const sendOTPEmail = async (toEmail, otp) => {
  await sendEmail({
    to: toEmail,
    subject: 'Código de verificación de tu cuenta',
    htmlContent: plantillaCodigo({
      titulo: 'Activa tu cuenta',
      mensaje: 'Te damos la bienvenida a Nova Graf. Usa el siguiente código para verificar tu correo:',
      otp,
      minutos: 2,
      notaFinal: 'Si no creaste esta cuenta, ignora este correo.',
    }),
  });
};

// Para recuperar la contraseña
const sendRecoveryEmail = async (toEmail, otp) => {
  await sendEmail({
    to: toEmail,
    subject: 'Recuperación de contraseña - NovaGraf',
    htmlContent: plantillaCodigo({
      titulo: 'Recupera tu contraseña',
      mensaje: 'Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:',
      otp,
      minutos: 5,
      notaFinal: 'Si no solicitaste esto, ignora este correo y tu contraseña seguirá igual.',
    }),
  });
};

module.exports = { sendOTPEmail, sendRecoveryEmail };
