// Política de privacidad de Nova Graf (la misma que muestra la app móvil).
// Si cambias algo aquí, cambia también src/features/legal/constants/avisoPrivacidad.ts en la app.

export const FECHA_ACTUALIZACION = "28 de octubre de 2026";
export const CORREO_PRIVACIDAD = "novagraf.oficial@gmail.com";

export const POLITICA_PRIVACIDAD = [
  {
    titulo: "1. Identificación",
    bloques: [
      { t: "li", x: "Aplicación: Nova Graf Mobile (com.novagraf.mobile) y sitio web de Nova Graf." },
      { t: "li", x: "Responsable: Nova Graf." },
      { t: "li", x: "Domicilio: C. Morelos 43, Centro, 43000 Huejutla de Reyes, Hgo." },
      { t: "li", x: "Correo de privacidad: novagraf.oficial@gmail.com" },
      { t: "li", x: "Fecha de publicación: 20 de octubre de 2026. Última actualización: 28 de octubre de 2026." },
    ],
  },
  {
    titulo: "2. Datos que se recopilan",
    bloques: [
      { t: "p", x: "Recopilamos únicamente los datos necesarios para operar la aplicación y el sitio:" },
      { t: "li", x: "Datos de cuenta: nombre, apellido paterno y materno, nombre de usuario, fecha de nacimiento, teléfono, domicilio, correo electrónico y contraseña (se guarda cifrada)." },
      { t: "li", x: "Si inicias sesión con Google: tu nombre, tus apellidos (si Google los proporciona), tu correo electrónico verificado y tu identificador de Google." },
      { t: "li", x: "Código de verificación: un código temporal que enviamos a tu correo para activar tu cuenta o recuperar tu contraseña." },
      { t: "li", x: "Pedidos: productos, método de entrega y de pago, dirección de entrega o punto de encuentro, montos, estado e historial de compras." },
      { t: "li", x: "Personalizaciones y archivos: los diseños, imágenes y archivos que subes, y los comprobantes de pago." },
      { t: "li", x: "Mensajes: los que intercambias con Nova Graf en el chat de tu pedido, y las notificaciones sobre su estado." },
      { t: "li", x: "Solicitudes de eliminación de cuenta: el correo, el motivo (si lo escribes), la fecha y su estado." },
      { t: "li", x: "Registros técnicos: dirección IP, fecha y hora y recursos solicitados, que generan automáticamente los servidores y servicios de alojamiento." },
      { t: "li", x: "Datos de análisis interno: tu edad (calculada a partir de tu fecha de nacimiento), la antigüedad de tu cuenta y tu gasto total." },
      { t: "li", x: "Ubicación: la aplicación móvil no solicita tu ubicación. En el sitio web existe una función opcional que, si la aceptas, calcula en tu propio dispositivo la distancia a nuestra tienda; esa ubicación no se envía ni se guarda en nuestros servidores." },
    ],
  },
  {
    titulo: "3. Cómo se obtienen",
    bloques: [
      { t: "li", x: "Los introduces tú: al registrarte, editar tu perfil, hacer pedidos, subir diseños o comprobantes, escribir en el chat y solicitar la eliminación de tu cuenta." },
      { t: "li", x: "Llegan mediante Google Sign-In: si eliges iniciar sesión con Google, Google nos comparte tu nombre, correo verificado e identificador." },
      { t: "li", x: "Se generan automáticamente: los registros técnicos, el estado de tus pedidos, las notificaciones y los datos de análisis interno." },
      { t: "li", x: "En el sitio web instalable (PWA), tu navegador guarda en tu dispositivo tu sesión y contenido público para que funcione sin conexión. Puedes borrarlo desde la configuración del navegador." },
      { t: "p", x: "La aplicación solo accede a tus fotos o archivos cuando tú decides adjuntar una imagen o un documento." },
    ],
  },
  {
    titulo: "4. Finalidades",
    bloques: [
      { t: "li", x: "Datos de cuenta y de Google: crear tu cuenta, verificar tu correo, iniciar sesión y recuperar tu contraseña." },
      { t: "li", x: "Pedidos, domicilio y teléfono: gestionar tus pedidos, coordinar la entrega o la recogida y contactarte sobre ellos." },
      { t: "li", x: "Diseños, archivos y comprobantes: producir tus artículos personalizados, mostrarte vistas previas y verificar tus pagos." },
      { t: "li", x: "Mensajes: atender tus consultas sobre un pedido." },
      { t: "li", x: "Solicitudes de eliminación: atender tu solicitud y dejar constancia de que se cumplió." },
      { t: "li", x: "Registros técnicos: proteger el servicio, prevenir abusos y diagnosticar fallas." },
      { t: "li", x: "Datos de análisis interno: conocer el perfil de nuestros clientes y mejorar productos y servicio." },
      { t: "li", x: "Todos los datos que corresponda: cumplir las obligaciones fiscales, contables y legales aplicables." },
    ],
  },
  {
    titulo: "5. Proveedores y terceros",
    bloques: [
      { t: "p", x: "No vendemos tus datos personales ni usamos publicidad ni herramientas de analítica de terceros. Compartimos datos únicamente con los proveedores que hacen posible el servicio:" },
      { t: "li", x: "Google: recibe tu solicitud de inicio de sesión y nos entrega tu nombre, correo verificado e identificador, para autenticarte." },
      { t: "li", x: "Supabase: aloja la base de datos y los archivos, por lo que almacena tus datos de cuenta, pedidos, mensajes y archivos." },
      { t: "li", x: "SendGrid: recibe tu nombre y correo electrónico para enviarte códigos de verificación, de recuperación y avisos." },
      { t: "li", x: "Render: aloja el servidor que procesa las solicitudes de la aplicación y del sitio y genera registros técnicos." },
      { t: "li", x: "Vercel: aloja el sitio web y genera registros técnicos de acceso, como la dirección IP." },
      { t: "p", x: "También podemos compartir datos con una autoridad competente cuando la ley lo exija." },
    ],
  },
  {
    titulo: "6. Seguridad de la información",
    bloques: [
      { t: "li", x: "Las contraseñas se guardan cifradas (hash con bcrypt); nunca en texto legible." },
      { t: "li", x: "La aplicación y el sitio se comunican con el servidor mediante conexiones cifradas (HTTPS)." },
      { t: "li", x: "Tu sesión usa un token con vigencia limitada (7 días) y la aplicación móvil lo guarda en el almacenamiento seguro del dispositivo." },
      { t: "li", x: "El acceso a la información está separado por roles: un cliente solo ve sus propios pedidos y datos." },
      { t: "p", x: "Ningún sistema es completamente seguro. Te recomendamos usar una contraseña única y no compartirla." },
    ],
  },
  {
    titulo: "7. Conservación de datos",
    bloques: [
      { t: "p", x: "No fijamos un plazo único. Conservamos cada categoría con estos criterios:" },
      { t: "li", x: "Datos de cuenta: mientras tu cuenta esté activa. Si eliminas tu cuenta, tus datos personales se anonimizan." },
      { t: "li", x: "Códigos de verificación: se eliminan al usarse o al vencer." },
      { t: "li", x: "Pedidos, pagos, comprobantes, diseños y mensajes de cada pedido: se conservan el tiempo que exijan las obligaciones fiscales, contables y legales aplicables, o que sea necesario para atender aclaraciones y reclamaciones. Pueden incluir la dirección de entrega que indicaste en ese pedido." },
      { t: "li", x: "Solicitudes de eliminación: se conservan como constancia de que se atendieron." },
      { t: "li", x: "Registros técnicos: según lo definan los servicios de alojamiento que los generan." },
    ],
  },
  {
    titulo: "8. Eliminación de cuenta",
    bloques: [
      { t: "p", x: "Puedes solicitar la eliminación de tu cuenta de dos formas:" },
      { t: "li", x: "Desde la aplicación: Perfil → «Eliminar mi cuenta» (o en el menú, sin iniciar sesión)." },
      { t: "li", x: "Desde la web: en la página pública «Eliminar mi cuenta». Si no puedes usarla, escríbenos a novagraf.oficial@gmail.com desde el correo con el que te registraste." },
      { t: "p", x: "Detalles del proceso:" },
      { t: "li", x: "Verificación de identidad: si la solicitas desde la aplicación con tu sesión iniciada, queda ligada a tu cuenta. Si la solicitas desde la web o por correo, te escribimos al correo registrado para confirmar que eres tú antes de eliminarla." },
      { t: "li", x: "Plazo: atendemos cada solicitud en un máximo de 30 días." },
      { t: "li", x: "Qué se elimina: tu nombre, apellidos, usuario, fecha de nacimiento, teléfono, domicilio, correo, identificador de Google y contraseña. Se anonimizan de forma irreversible y ya no podrás iniciar sesión con esa cuenta." },
      { t: "li", x: "Qué se conserva: los pedidos, pagos, comprobantes, diseños y mensajes asociados a pedidos, por el tiempo indicado en la sección 7." },
      { t: "li", x: "Resultado: al enviar la solicitud verás la confirmación de que la recibimos, y cuando la completemos te avisaremos al correo registrado." },
    ],
  },
  {
    titulo: "9. Derechos ARCO y consultas",
    bloques: [
      { t: "li", x: "Tienes derecho a solicitar el acceso, la rectificación, la cancelación u oposición al tratamiento de tus datos personales (derechos ARCO), así como a revocar tu consentimiento." },
      { t: "li", x: "Algunos datos puedes corregirlos tú mismo en tu Perfil: nombre, teléfono, domicilio y contraseña." },
      { t: "li", x: "Para el resto, escribe a novagraf.oficial@gmail.com desde el correo registrado e indica: tu nombre completo, el correo de tu cuenta, el derecho que quieres ejercer, una descripción clara de los datos involucrados y, para rectificar, los documentos que respalden el cambio." },
      { t: "li", x: "Para proteger tus datos, verificamos tu identidad respondiendo al correo registrado y, si es necesario, pidiéndote información adicional sobre tu cuenta o tus pedidos recientes. Responderemos dentro de los plazos que establece la normativa aplicable." },
    ],
  },
  {
    titulo: "10. Menores de edad",
    bloques: [
      { t: "li", x: "Nova Graf Mobile está dirigida a personas de 15 años en adelante. No está dirigida a menores de 15 años y no recopilamos sus datos de forma intencional; el registro pide la fecha de nacimiento y no permite crear cuentas a menores de esa edad. Si detectamos una cuenta de una persona menor, la eliminaremos." },
      { t: "li", x: "Si tienes entre 15 y 17 años, te recomendamos usar la aplicación con el conocimiento y la orientación de tu madre, padre o tutor. Ellos pueden contactarnos para consultas o para ejercer tus derechos sobre tus datos." },
    ],
  },
  {
    titulo: "11. Cambios y contacto",
    bloques: [
      { t: "li", x: "Cuando cambiemos esta política publicaremos la versión nueva en esta misma página, con su fecha de actualización. Si el cambio es importante, también te lo avisaremos en la aplicación." },
      { t: "li", x: "Para consultas, reclamaciones o asuntos de privacidad, escríbenos a novagraf.oficial@gmail.com o visita C. Morelos 43, Centro, 43000 Huejutla de Reyes, Hgo." },
    ],
  },
];
