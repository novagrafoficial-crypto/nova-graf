// backend/src/middlewares/authAlexa.js
const ALEXA_API_KEY = process.env.ALEXA_API_KEY || 'ClaveSecretaParaAlexa123!';

const verificarAlexa = (req, res, next) => {
    const apiKey = req.headers['x-alexa-key'];
    
    if (!apiKey || apiKey !== ALEXA_API_KEY) {
        console.log('🔒 Acceso denegado a Alexa:', apiKey);
        return res.status(401).json({ 
            error: 'No autorizado. API Key inválida o faltante.',
            code: 'ALEXA_AUTH_FAILED'
        });
    }
    
    console.log('✅ Petición de Alexa autorizada');
    next();
};

module.exports = verificarAlexa;