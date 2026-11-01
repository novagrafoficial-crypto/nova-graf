const jwt = require("jsonwebtoken");
const db = require("../../config/db");

/**
 * Verifica el token JWT y que siga vigente:
 * si el usuario cambió su contraseña DESPUÉS de emitir el token,
 * la sesión ya no es válida (cierre de sesión en todos los dispositivos).
 */
async function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Acceso no autorizado" });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }

  try {
    const result = await db.query(
      "SELECT password_changed_at FROM usuarios WHERE id_usuario = $1",
      [decoded.id_usuario]
    );
    const cambio = result.rows[0]?.password_changed_at;
    if (cambio && decoded.iat < Math.floor(new Date(cambio).getTime() / 1000)) {
      return res.status(401).json({
        error: "Sesión expirada",
        message: "Tu contraseña cambió. Inicia sesión de nuevo.",
      });
    }
  } catch (error) {
    // Si la columna aún no existe (migración pendiente) no se bloquea el acceso.
    console.error("verificarToken (password_changed_at):", error.message);
  }

  req.usuario = decoded;
  next();
}

module.exports = verificarToken;
