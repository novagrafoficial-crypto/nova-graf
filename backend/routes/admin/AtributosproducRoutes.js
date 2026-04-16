const express = require('express');
const router = express.Router();
const {
  obtenerColores, crearColor, actualizarColor, eliminarColor,
  obtenerMateriales, crearMaterial, actualizarMaterial, eliminarMaterial,
  obtenerTiposAtributo, crearTipoAtributo, actualizarTipoAtributo, eliminarTipoAtributo,
  obtenerValoresAtributo, crearValorAtributo, actualizarValorAtributo, eliminarValorAtributo,
} = require('../../controllers/admin/AtributosproducController');

// ── Colores ──────────────────────────────────────────────────────────────────
router.get('/colores', obtenerColores);
router.post('/colores', crearColor);
router.put('/colores/:id', actualizarColor);
router.delete('/colores/:id', eliminarColor);

// ── Materiales ───────────────────────────────────────────────────────────────
router.get('/materiales', obtenerMateriales);
router.post('/materiales', crearMaterial);
router.put('/materiales/:id', actualizarMaterial);
router.delete('/materiales/:id', eliminarMaterial);

// ── Tipos atributo ───────────────────────────────────────────────────────────
router.get('/tipos-atributo', obtenerTiposAtributo);
router.post('/tipos-atributo', crearTipoAtributo);
router.put('/tipos-atributo/:id', actualizarTipoAtributo);
router.delete('/tipos-atributo/:id', eliminarTipoAtributo);

// ── Valores atributo ─────────────────────────────────────────────────────────
router.get('/valores-atributo', obtenerValoresAtributo);
router.post('/valores-atributo', crearValorAtributo);
router.put('/valores-atributo/:id', actualizarValorAtributo);
router.delete('/valores-atributo/:id', eliminarValorAtributo);

module.exports = router;