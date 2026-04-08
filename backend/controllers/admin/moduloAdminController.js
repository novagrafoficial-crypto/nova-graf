const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { Readable } = require("stream");
const { Parser } = require("json2csv");
const csvParser = require("csv-parser");
const multer = require("multer");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const historialRespaldos = [];

const pgDumpPath = `"C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe"`;

const TABLAS = [
  "usuarios.usuarios",
  "empresa.empresa",
  "empresa.mision",
  "empresa.vision",
  "empresa.valores",
  "empresa.antecedentes",
  "empresa.politicas",
  "empresa.contactos_empresa",
  "empresa.redes_sociales_empresa",
  "empresa.ubicacion_empresa",
  "empresa.portafolio",
  "productos.categorias",
  "productos.subcategorias",
  "productos.marcas",
  "productos.materiales",
  "productos.colores",
  "productos.tipos_atributo",
  "productos.valores_atributo",
  "productos.productos",
  "productos.producto_tipos_atributo",
  "productos.producto_variantes",
  "productos.variante_atributos",
  "inventario.inventario",
  "inventario.movimientos_inventario",
  "marketing.descuentos",
  "marketing.descuento_productos",
  "marketing.promociones",
  "marketing.promocion_descuentos",
  "ventas.pedidos",
  "ventas.pedido_detalle",
  "ventas.pagos",
  "ventas.personalizaciones"
];

// ─── RESPALDO COMPLETO ────────────────────────────────────────────────────────
const generarRespaldo = (req, res) => {
  const backupDir = path.join(__dirname, "../../../backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace("T", "_")
    .split(".")[0];

  const fileName = `respaldo_novagraf_${timestamp}.dump`;
  const filePath = path.join(backupDir, fileName);

  const connectionString = process.env.DATABASE_URL;

  const comando = `${pgDumpPath} --dbname="${connectionString}" --format=custom --file="${filePath}" --no-owner --no-privileges`;

  exec(comando, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al generar respaldo" });
    }

    const stats = fs.statSync(filePath);

    historialRespaldos.unshift({
      nombre: fileName,
      fecha: new Date(),
      tamaño: `${(stats.size / 1024).toFixed(2)} KB`,
      tipo: "Completo"
    });

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    res.download(filePath, fileName, () => {
      fs.unlinkSync(filePath);
    });
  });
};

// ─── RESPALDO POR TABLA ───────────────────────────────────────────────────────
const generarRespaldoTabla = (req, res) => {
  const { tabla } = req.params;

  if (!TABLAS.includes(tabla)) {
    return res.status(400).json({ error: "Tabla no permitida" });
  }

  const backupDir = path.join(__dirname, "../../../backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace("T", "_")
    .split(".")[0];

  const fileName = `respaldo_${tabla.replace(".", "_")}_${timestamp}.dump`;
  const filePath = path.join(backupDir, fileName);

  const connectionString = process.env.DATABASE_URL;

  const comando = `${pgDumpPath} --dbname="${connectionString}" --table=${tabla} --format=custom --file="${filePath}" --no-owner --no-privileges`;

  exec(comando, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al generar respaldo" });
    }

    const stats = fs.statSync(filePath);

    historialRespaldos.unshift({
      nombre: fileName,
      fecha: new Date(),
      tamaño: `${(stats.size / 1024).toFixed(2)} KB`,
      tipo: tabla
    });

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    res.download(filePath, fileName, () => {
      fs.unlinkSync(filePath);
    });
  });
};

// ─── HISTORIAL ────────────────────────────────────────────────────────────────
const obtenerHistorialRespaldos = (req, res) => {
  res.json(historialRespaldos.slice(0, 10));
};

// ─── LISTA DE TABLAS ──────────────────────────────────────────────────────────
const obtenerTablas = (req, res) => {
  res.json(TABLAS);
};

// ─── EXPORTAR CSV ─────────────────────────────────────────────────────────────
const exportarCSV = async (req, res) => {
  const { tabla } = req.params;

  if (!TABLAS.includes(tabla)) {
    return res.status(400).json({ error: "Tabla no permitida" });
  }

  try {
    const result = await pool.query(`SELECT * FROM ${tabla}`);

    if (result.rows.length === 0) {
      return res.status(204).json({ message: "La tabla está vacía" });
    }

    const parser = new Parser();
    const csv = parser.parse(result.rows);

    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace("T", "_")
      .split(".")[0];

    const fileName = `export_${tabla.replace(".", "_")}_${timestamp}.csv`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al exportar CSV" });
  }
};

// ─── IMPORTAR CSV ─────────────────────────────────────────────────────────────
const importarCSV = async (req, res) => {
  const { tabla } = req.params;

  if (!TABLAS.includes(tabla)) {
    return res.status(400).json({ error: "Tabla no permitida" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No se recibió archivo" });
  }

  try {
    const rows = [];

    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csvParser())
        .on("data", (row) => rows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    if (rows.length === 0) {
      return res.status(400).json({ error: "El CSV está vacío" });
    }

    const columns = Object.keys(rows[0]);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const row of rows) {
        const values = columns.map((col) => row[col]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        const colNames = columns.map((c) => `"${c}"`).join(", ");

        await client.query(
          `INSERT INTO ${tabla} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
      }

      await client.query("COMMIT");
      res.json({ message: `${rows.length} filas importadas correctamente` });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al importar CSV" });
  }
};

// ─── MULTER (memoria, sin guardar en disco) ───────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

module.exports = {
  generarRespaldo,
  generarRespaldoTabla,
  obtenerHistorialRespaldos,
  obtenerTablas,
  exportarCSV,
  importarCSV,
  upload
};