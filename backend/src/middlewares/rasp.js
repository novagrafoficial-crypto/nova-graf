const requestCounts = new Map();

const RATE_LIMIT  = 60;
const RATE_WINDOW = 60 * 1000;

const SQL_PATTERNS = [
  /'\s*(OR|AND)\s+['"\d]/i,
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
  /--+/,
  /UNION\s+(ALL\s+)?SELECT/i,
  /;\s*(DROP|DELETE|INSERT|UPDATE)\b/i,
  /\/\*[\s\S]*?\*\//,
  /\bSLEEP\s*\(\d+\)/i,
  /\bWAITFOR\s+DELAY\b/i,
  /\bEXEC\s*\(/i,
  /xp_cmdshell/i,
  /INFORMATION_SCHEMA/i,
  /\bSELECT\b.+\bFROM\b/i,
  /\bDROP\s+TABLE\b/i,
];

const XSS_PATTERNS = [
  /<script[\s\S]*?>/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']?[^"'>]*/i,
  /<iframe/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.%2F/i,
  /%2e%2e/i,
];

const detectarAtaque = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  // ── Rate limiting ──────────────────────────────────────
  const ahora    = Date.now();
  const registro = requestCounts.get(ip) || { count: 0, firstRequest: ahora };

  if (ahora - registro.firstRequest > RATE_WINDOW) {
    requestCounts.set(ip, { count: 1, firstRequest: ahora });
  } else {
    registro.count++;
    requestCounts.set(ip, registro);
    if (registro.count > RATE_LIMIT) {
      console.warn(`🚨 [RASP] Rate limit excedido - IP: ${ip}`);
      return res.status(429).json({ error: "Demasiadas peticiones. Intenta más tarde." });
    }
  }

  // ── Análisis de payload ────────────────────────────────
  const revisar = JSON.stringify({
    body:   req.body,
    query:  req.query,
    params: req.params,
  });

  const ataques = [
    { nombre: "SQL Injection",  patrones: SQL_PATTERNS },
    { nombre: "XSS",            patrones: XSS_PATTERNS },
    { nombre: "Path Traversal", patrones: PATH_TRAVERSAL_PATTERNS },
  ];

  for (const { nombre, patrones } of ataques) {
    for (const patron of patrones) {
      if (patron.test(revisar)) {
        console.warn(`🚨 [RASP] ${nombre} detectado`);
        console.warn(`   IP: ${ip}`);
        console.warn(`   Ruta: ${req.method} ${req.originalUrl}`);
        console.warn(`   Payload: ${revisar.substring(0, 300)}`);

        return res.status(403).json({
          error: `Solicitud bloqueada: ${nombre} detectado`
        });
      }
    }
  }

  next();
};

module.exports = detectarAtaque;