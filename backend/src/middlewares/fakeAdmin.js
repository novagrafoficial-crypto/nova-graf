const db = require('../../config/db'); // tu conexión

module.exports = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: "Usuario no identificado" });
    }

    const result = await db.query(
      "SELECT id, rol FROM usuarios WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    req.user = user;

    next();

  } catch (error) {
    console.error("❌ Error en fakeAdmin:", error);
   
  }
};