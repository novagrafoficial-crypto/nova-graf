const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

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

    // ✅ FIX: header explícito para que fetch lo lea correctamente
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    res.download(filePath, fileName, () => {
      fs.unlinkSync(filePath);
    });
  });
};

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

    // ✅ FIX: header explícito para que fetch lo lea correctamente
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    res.download(filePath, fileName, () => {
      fs.unlinkSync(filePath);
    });
  });
};

const obtenerHistorialRespaldos = (req, res) => {
  res.json(historialRespaldos.slice(0, 10));
};

const obtenerTablas = (req, res) => {
  res.json(TABLAS);
};

module.exports = {
  generarRespaldo,
  generarRespaldoTabla,
  obtenerHistorialRespaldos,
  obtenerTablas
};