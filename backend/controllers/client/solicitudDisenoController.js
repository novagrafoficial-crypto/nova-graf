// backend/src/controllers/solicitudDisenoController.js
const SolicitudDisenoModel = require('../../models/client/solicitudDisenoModel');

// ========== CLIENTE ==========
exports.crearSolicitud = async (req, res) => {
  try {

    const usuario_id = req.usuario.id_usuario;
    const { variante_id, descripcion_cliente, archivos_referencia } = req.body;

    if (!descripcion_cliente || descripcion_cliente.trim() === '') {
      return res.status(400).json({ error: 'La descripción es obligatoria' });
    }

    const nueva = await SolicitudDisenoModel.crear(
      usuario_id,
      variante_id || null,
      descripcion_cliente,
      archivos_referencia || []
    );
    res.status(201).json({ message: 'Solicitud creada', solicitud: nueva });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la solicitud' });
  }
};

exports.misSolicitudes = async (req, res) => {
  try {
    // CAMBIO: usar id_usuario en lugar de id
    const usuario_id = req.usuario.id_usuario;
    const solicitudes = await SolicitudDisenoModel.obtenerPorUsuario(usuario_id);
    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tus solicitudes' });
  }
};

exports.aprobarPropuesta = async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ Se agrega costo_diseno al destructuring
    const { propuesta_id, variante_id, precio_base_variante, costo_diseno } = req.body;

    if (!propuesta_id || !variante_id || precio_base_variante === undefined || costo_diseno === undefined) {
      return res.status(400).json({ 
        error: 'Faltan datos: propuesta_id, variante_id, precio_base_variante, costo_diseno' 
      });
    }

    // ✅ Orden correcto según el modelo: (solicitud_id, propuesta_id, costo_diseno, variante_id, precio_base_variante)
    const producto = await SolicitudDisenoModel.aprobarPropuesta(
      id, propuesta_id, costo_diseno, variante_id, precio_base_variante
    );
    res.json({ message: 'Propuesta aprobada, producto agregado al carrito', producto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al aprobar propuesta' });
  }
};

// ========== ADMIN ==========
exports.getSolicitudesPendientes = async (req, res) => {
  try {
    const solicitudes = await SolicitudDisenoModel.obtenerPendientes();
    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener solicitudes pendientes' });
  }
};

exports.subirPropuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const { imagen_url, descripcion } = req.body;
    if (!imagen_url) {
      return res.status(400).json({ error: 'La URL de la imagen es obligatoria' });
    }
    const propuesta = await SolicitudDisenoModel.agregarPropuesta(id, imagen_url, descripcion || '');
    res.status(201).json({ message: 'Propuesta agregada', propuesta });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir propuesta' });
  }
};

exports.asignarCosto = async (req, res) => {
  try {
    const { id } = req.params;
    const { costo } = req.body;
    if (costo === undefined || isNaN(costo)) {
      return res.status(400).json({ error: 'Costo inválido' });
    }
    await SolicitudDisenoModel.asignarCostoDiseno(id, costo);
    res.json({ message: 'Costo asignado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al asignar costo' });
  }
};

exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    if (!estado) {
      return res.status(400).json({ error: 'El estado es requerido' });
    }
    await SolicitudDisenoModel.actualizarEstado(id, estado, observaciones);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};