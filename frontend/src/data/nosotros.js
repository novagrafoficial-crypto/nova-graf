// ═══════════════════════════════════════════════════════════
//  CONTENIDO ESTÁTICO DE "NOSOTROS"
//  Misión, visión, valores e historia de Nova Graf.
//  Vive en el código (no en la base de datos), así carga al
//  instante y funciona sin internet en la PWA.
//  >>> Reemplaza los textos "ESCRIBE AQUÍ ..." por los reales. <<<
// ═══════════════════════════════════════════════════════════

export const mision = {
  descripcion: 'Ofrecer soluciones innovadoras en la personalización de artículos, mediante el uso de tecnología digital que permita gestionar pedidos, diseños y procesos de producción de forma eficiente, brindando productos de alta calidad que satisfagan las necesidades y creatividad de nuestros clientes.',
};

export const vision = {
  descripcion: 'Ser una empresa líder en la personalización de productos a nivel regional, reconocida por su innovación tecnológica, eficiencia en la gestión de pedidos y calidad en sus productos, consolidándose como una plataforma integral que facilite la interacción entre clientes y procesos de diseño.',
};

// Puedes agregar o quitar valores. En el inicio se muestran los primeros 4.
export const valores = [
  { id: 1, titulo: 'Respeto', descripcion: 'Diseños autorizados por el cliente' },
  { id: 2, titulo: 'compromiso', descripcion: 'entregas en tiempo y forma' },
  { id: 3, titulo: 'Honestidad', descripcion: 'Información sobre cualquier inconveniente' },
  { id: 4, titulo: 'Empeño', descripcion: 'Realizamos lo mejor en cada proyecto' },
];

// Línea de tiempo de la página /nosotros. Si dejas la lista vacía ([]),
// se muestra el mensaje "Pronto compartiremos...".
// Usa fechas con la hora (T12:00:00) para que no se corra el mes por zona horaria.
export const antecedentes = [
  { fecha_evento: '2024-01-01T12:00:00', descripcion: 'Inaguración de local' },
];
