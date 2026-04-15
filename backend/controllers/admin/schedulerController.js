const path = require("path");
const fs   = require("fs");
const svc  = require("../../services/schedulerService");

// ─── Listar tareas ────────────────────────────────────────────────────────────
const listarTareas = (_req, res) => {
  res.json(svc.listarTareas());
};

// ─── Crear tarea ──────────────────────────────────────────────────────────────
const crearTarea = (req, res) => {
  try {
    const tarea = svc.crearTarea(req.body);
    res.status(201).json(tarea);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ─── Eliminar tarea ───────────────────────────────────────────────────────────
const eliminarTarea = (req, res) => {
  try {
    svc.eliminarTarea(req.params.id);
    res.json({ mensaje: "Tarea eliminada correctamente" });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// ─── Activar / desactivar tarea ───────────────────────────────────────────────
const toggleActiva = (req, res) => {
  try {
    const tarea = svc.toggleActiva(req.params.id);
    res.json(tarea);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// ─── Ejecutar tarea manualmente ───────────────────────────────────────────────
const ejecutarAhora = async (req, res) => {
  const tarea = svc.obtenerTarea(req.params.id);
  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
  

  try {
    const resultado = await svc.ejecutarTarea(tarea);
    console.log("RESULTADO COMPLETO:", JSON.stringify(resultado, null, 2));
    console.log("filePath existe?", resultado.filePath ? require("fs").existsSync(resultado.filePath) : "filePath es null");

    // Si generó archivo, descargarlo directamente
    if (resultado.resultado === "ok" && resultado.archivo) {
      const filePath = path.join(__dirname, "../../../backups", resultado.archivo);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Archivo generado no encontrado en disco" });
      }

      res.setHeader("Content-Disposition", `attachment; filename="${resultado.archivo}"`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

      return res.download(filePath, resultado.archivo, (err) => {
        if (!err && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Borra el archivo tras la descarga
        }
      });
    }

    // Sin archivo (ej: tabla vacía en CSV)
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Historial de ejecuciones ─────────────────────────────────────────────────
const listarHistorial = (_req, res) => {
  res.json(svc.listarHistorial());
};

module.exports = {
  listarTareas,
  crearTarea,
  eliminarTarea,
  toggleActiva,
  ejecutarAhora,
  listarHistorial,
};