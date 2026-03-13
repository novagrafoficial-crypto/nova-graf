const db = require('../../config/db');
const fs = require('node:fs');
const path = require('node:path');
const archiver = require('archiver');

const TABLAS = [
  'usuarios', 'empresa', 'mision', 'vision', 'valores',
  'antecedentes', 'politicas', 'contactos_empresa',
  'redes_sociales_empresa', 'ubicacion_empresa',
  'categorias', 'subcategorias', 'marcas', 'materiales', 'colores',
  'tipos_atributo', 'valores_atributo', 'productos',
  'producto_tipos_atributo', 'producto_variantes',
  'variante_atributos', 'inventario', 'movimientos_inventario',
  'descuentos', 'descuento_productos', 'promociones', 'promocion_descuentos'
];

const generarRespaldo = async (req, res) => {
  const backupRoot = path.join(__dirname, '../../../backups');
  const tempDir    = path.join(backupRoot, 'temp');

  try {
    if (!fs.existsSync(backupRoot)) fs.mkdirSync(backupRoot, { recursive: true });
    if (!fs.existsSync(tempDir))    fs.mkdirSync(tempDir,    { recursive: true });

    // Exportar cada tabla como JSON
    for (const tabla of TABLAS) {
      try {
        const result = await db.query(`SELECT * FROM ${tabla}`);
        const filePath = path.join(tempDir, `${tabla}.json`);
        fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));
      } catch {
        // Si la tabla no existe en este momento, la omite sin romper el respaldo
        console.warn(`Tabla '${tabla}' omitida`);
      }
    }

    const timestamp = new Date().toISOString().replaceAll(':', '-');
    const zipName   = `respaldo_${timestamp}.zip`;
    const zipPath   = path.join(backupRoot, zipName);

    const output  = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(tempDir, false);
    await archive.finalize();

    output.on('close', () => {
      res.download(zipPath, zipName, (err) => {
        if (err) console.error('Error al descargar:', err);
        // Limpiar archivos temporales
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.unlinkSync(zipPath);
      });
    });

  } catch (error) {
    console.error(error);
    // Limpiar temp si algo falló
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    res.status(500).json({ error: 'Error al generar respaldo' });
  }
};

module.exports = { generarRespaldo };