// backend/src/middlewares/verificarAdmin.js
const db = require('../../config/db');

const verificarAdmin = async (req, res, next) => {
  try {
    let usuarioId = null;
    
    // Obtener ID del header X-User-Id
    if (req.headers['x-user-id']) {
      usuarioId = parseInt(req.headers['x-user-id']);
    } else if (req.session?.usuarioId) {
      usuarioId = req.session.usuarioId;
    } else if (req.user?.id_usuario) {
      usuarioId = req.user.id_usuario;
    }
    
    // 🔓 TEMPORAL: Si no hay usuario, permitir acceso para pruebas
    if (!usuarioId) {
      console.log('⚠️ Modo prueba: permitiendo acceso');
      return next();
    }
    
    // ✅ Usando el nombre correcto: id_usuario
    const query = `
      SELECT id_usuario, nombre, rol, activo 
      FROM usuarios 
      WHERE id_usuario = $1
    `;
    
    const result = await db.query(query, [usuarioId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }
    
    const usuario = result.rows[0];
    
    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({ 
        success: false, 
        error: 'Tu cuenta está desactivada. Contacta al administrador.' 
      });
    }
    
    // Verificar si tiene rol de administrador
    const rolAdmin = usuario.rol?.toLowerCase();
    const esAdmin = rolAdmin === 'admin' || 
                    rolAdmin === 'administrador' || 
                    rolAdmin === 'administrator';
    
    if (!esAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Acceso denegado. Se requiere rol de administrador.' 
      });
    }
    
    // Agregar usuario a la request
    req.usuario = usuario;
    next();
    
  } catch (error) {
    console.error('Error en verificarAdmin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al verificar permisos de administrador' 
    });
  }
};

module.exports = verificarAdmin;