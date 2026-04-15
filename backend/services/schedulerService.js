const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const { Parser } = require("json2csv");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const pgDumpPath = `"C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe"`;
const backupDir = path.join(__dirname, "../../../backups");

// ─── Persistencia JSON ────────────────────────────────────────────────────────
const dataDir = path.join(__dirname, "../../../data");
const TAREAS_FILE = path.join(dataDir, "tareas.json");
const HISTORIAL_FILE = path.join(dataDir, "historial.json");

const asegurarDirectorio = () => {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
};

const cargarTareas = () => {
  asegurarDirectorio();
  if (!fs.existsSync(TAREAS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(TAREAS_FILE, "utf8"));
  } catch {
    return [];
  }
};

const guardarTareas = () => {
  asegurarDirectorio();
  fs.writeFileSync(TAREAS_FILE, JSON.stringify(tareas, null, 2));
};

const cargarHistorial = () => {
  asegurarDirectorio();
  if (!fs.existsSync(HISTORIAL_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORIAL_FILE, "utf8"));
  } catch {
    return [];
  }
};

const guardarHistorial = () => {
  asegurarDirectorio();
  fs.writeFileSync(HISTORIAL_FILE, JSON.stringify(historial, null, 2));
};

// ─── Estado en memoria (cargado desde disco) ──────────────────────────────────
const tareas = cargarTareas();
const historial = cargarHistorial();
const cronJobs = new Map();

const TIPOS = ["respaldo_completo", "respaldo_tabla", "exportar_csv"];

// ─── Ejecutar tarea ───────────────────────────────────────────────────────────
const ejecutarTarea = async (tarea) => {
  const inicio = new Date();
  let resultado = "ok";
  let archivo = null;
  let errorMsg = null;

  try {
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const ts = inicio
      .toISOString()
      .replace(/:/g, "-")
      .replace("T", "_")
      .split(".")[0];

    if (tarea.tipo === "respaldo_completo") {
      const fileName = `respaldo_novagraf_${ts}.dump`;
      const filePath = path.join(backupDir, fileName);
      console.log("filePath construido:", filePath); // 👈 AGREGA ESTO
      console.log("¿existe backupDir?", fs.existsSync(backupDir)); 
      await new Promise((res, rej) => {
        exec(
          `${pgDumpPath} --dbname="${process.env.DATABASE_URL}" --format=custom --file="${filePath}" --no-owner --no-privileges`,
          (err) => (err ? rej(err) : res())
        );
      });
      archivo = fileName;

    } else if (tarea.tipo === "respaldo_tabla") {
      const fileName = `respaldo_${tarea.tabla.replace(".", "_")}_${ts}.dump`;
      const filePath = path.join(backupDir, fileName);
      await new Promise((res, rej) => {
        exec(
          `${pgDumpPath} --dbname="${process.env.DATABASE_URL}" --table=${tarea.tabla} --format=custom --file="${filePath}" --no-owner --no-privileges`,
          (err) => (err ? rej(err) : res())
        );
      });
      archivo = fileName;

    } else if (tarea.tipo === "exportar_csv") {
      const result = await pool.query(`SELECT * FROM ${tarea.tabla}`);
      if (result.rows.length > 0) {
        const csv = new Parser().parse(result.rows);
        const fileName = `export_${tarea.tabla.replace(".", "_")}_${ts}.csv`;
        fs.writeFileSync(path.join(backupDir, fileName), csv);
        archivo = fileName;
      }
    }

  } catch (err) {
    resultado = "error";
    errorMsg = err.message;
  }

  const duracion = ((Date.now() - inicio.getTime()) / 1000).toFixed(1) + " s";

  historial.unshift({
    tareaId: tarea.id,
    nombre: tarea.nombre,
    tipo: tarea.tipo,
    tabla: tarea.tabla || null,
    inicio: inicio.toISOString(),
    duracion,
    resultado,
    archivo,
    error: errorMsg,
  });

  if (historial.length > 50) historial.pop();

  // 💾 Persistir historial
  guardarHistorial();

  const t = tareas.find((x) => x.id === tarea.id);
  if (t) {
    t.ultimaEjecucion = inicio.toISOString();
    // 💾 Persistir tareas actualizadas
    guardarTareas();
  }

  return { resultado, archivo, error: errorMsg };
};

// ─── Registrar cron ───────────────────────────────────────────────────────────
const registrarCron = (tarea) => {
  if (tarea.frecuencia === "manual" || !tarea.activa) return;
  if (cronJobs.has(tarea.id)) {
    cronJobs.get(tarea.id).stop();
    cronJobs.delete(tarea.id);
  }
  if (!cron.validate(tarea.cron)) return;
  const job = cron.schedule(
    tarea.cron,
    () => ejecutarTarea(tarea),
    { timezone: "America/Mexico_City" }
  );
  cronJobs.set(tarea.id, job);
};

// ─── Calcular próxima ejecución (aproximada) ─────────────────────────────────
const proximaEjecucion = (expresionCron) => {
  try {
    const partes = expresionCron.split(" ");
    const [min, hora] = partes;
    const ahora = new Date();
    const prox = new Date();
    prox.setSeconds(0, 0);
    prox.setHours(parseInt(hora), parseInt(min));
    if (prox <= ahora) prox.setDate(prox.getDate() + 1);
    return prox.toISOString();
  } catch {
    return null;
  }
};

// ─── CRUD de tareas ───────────────────────────────────────────────────────────
const crearTarea = (datos) => {
  if (!TIPOS.includes(datos.tipo)) throw new Error("Tipo inválido");
  if (datos.tipo !== "respaldo_completo" && !datos.tabla)
    throw new Error("Tabla requerida para este tipo de tarea");
  if (datos.frecuencia !== "manual" && !cron.validate(datos.cron))
    throw new Error("Expresión cron inválida");

  const tarea = {
    id: Date.now().toString(),
    nombre:
      datos.nombre ||
      `${datos.tipo.replace(/_/g, " ")} · ${new Date().toLocaleDateString("es-MX")}`,
    tipo: datos.tipo,
    tabla: datos.tabla || null,
    frecuencia: datos.frecuencia,
    cron: datos.cron || null,
    activa: true,
    creadaEn: new Date().toISOString(),
    ultimaEjecucion: null,
    proximaEjecucion:
      datos.frecuencia !== "manual" ? proximaEjecucion(datos.cron) : null,
  };

  tareas.unshift(tarea);
  registrarCron(tarea);

  // 💾 Persistir
  guardarTareas();

  return tarea;
};

const listarTareas = () => tareas;

const obtenerTarea = (id) => tareas.find((t) => t.id === id) || null;

const toggleActiva = (id) => {
  const tarea = tareas.find((t) => t.id === id);
  if (!tarea) throw new Error("Tarea no encontrada");
  tarea.activa = !tarea.activa;
  if (tarea.activa) {
    registrarCron(tarea);
  } else {
    if (cronJobs.has(id)) {
      cronJobs.get(id).stop();
      cronJobs.delete(id);
    }
  }

  // 💾 Persistir
  guardarTareas();

  return tarea;
};

const eliminarTarea = (id) => {
  const idx = tareas.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Tarea no encontrada");
  if (cronJobs.has(id)) {
    cronJobs.get(id).stop();
    cronJobs.delete(id);
  }
  tareas.splice(idx, 1);

  // 💾 Persistir
  guardarTareas();
};

const listarHistorial = () => historial;

// ─── Restaurar crons al iniciar el servidor ───────────────────────────────────
tareas.forEach((tarea) => registrarCron(tarea));

module.exports = {
  crearTarea,
  listarTareas,
  obtenerTarea,
  toggleActiva,
  eliminarTarea,
  ejecutarTarea,
  listarHistorial,
};