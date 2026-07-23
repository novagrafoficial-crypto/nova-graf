// backend/src/middlewares/authAlexa.js
const ALEXA_API_KEY = process.env.ALEXA_API_KEY; 

if (!ALEXA_API_KEY) {
    console.log('⚠️ ALEXA_API_KEY no está configurada en las variables de entorno');
}

const verificarAlexa = (req, res, next) => {
    const apiKey = req.headers['x-alexa-key'];

    if (!ALEXA_API_KEY || !apiKey || apiKey !== ALEXA_API_KEY) {
        // No loguear el valor de apiKey: aunque sea un intento fallido,
        // no conviene dejar claves (ni parciales) en los logs.
        console.log('🔒 Acceso denegado a Alexa: API Key inválida o faltante');
        return res.status(401).json({
            error: 'No autorizado. API Key inválida o faltante.',
            code: 'ALEXA_AUTH_FAILED'
        });
    }

    console.log('✅ Petición de Alexa autorizada');
    next();
};

module.exports = verificarAlexa;