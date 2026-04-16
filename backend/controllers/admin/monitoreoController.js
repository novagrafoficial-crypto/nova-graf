const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const query = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
};

// ─── Utilidad: validar que una query sea segura (solo lectura) ────────────────
const esQuerySegura = (sql = "") => {
  const normalizada = sql.trim().toUpperCase();

  if (
    !normalizada.startsWith("SELECT") &&
    !normalizada.startsWith("EXPLAIN") &&
    !normalizada.startsWith("WITH")
  ) {
    return { valida: false, razon: "Solo se permiten consultas SELECT, EXPLAIN o WITH." };
  }

  const prohibidas = [
    /\bDROP\b/, /\bDELETE\b/, /\bTRUNCATE\b/, /\bINSERT\b/,
    /\bUPDATE\b/, /\bALTER\b/, /\bCREATE\b/, /\bGRANT\b/,
    /\bREVOKE\b/, /\bCOPY\b/, /\bEXECUTE\b/, /\bDO\b/,
    /\bCALL\b/, /\bPG_TERMINATE_BACKEND\b/, /\bPG_RELOAD_CONF\b/,
  ];

  for (const patron of prohibidas) {
    if (patron.test(normalizada)) {
      return {
        valida: false,
        razon: `Palabra clave no permitida detectada: ${patron.source.replace(/\\b/g, "")}`
      };
    }
  }

  return { valida: true };
};

// ─── 1. Resumen general ───────────────────────────────────────────────────────
const getResumen = async (req, res) => {
  try {
    const [conexiones] = await query(`
      SELECT
        count(*) FILTER (WHERE state = 'active')              AS activas,
        count(*) FILTER (WHERE state = 'idle')                AS idle,
        count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_tx,
        count(*)                                              AS total,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_conn
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    const [cache] = await query(`
      SELECT
        blks_hit, blks_read,
        CASE WHEN (blks_hit + blks_read) = 0 THEN 100
             ELSE round(blks_hit::numeric / (blks_hit + blks_read) * 100, 2)
        END AS cache_hit_ratio,
        xact_commit, xact_rollback,
        tup_inserted, tup_updated, tup_deleted
      FROM pg_stat_database
      WHERE datname = current_database()
    `);

    const [tamano] = await query(`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) AS tamaño_legible,
        pg_database_size(current_database())                  AS tamaño_bytes
    `);

    const [txps] = await query(`
      SELECT
        xact_commit + xact_rollback                              AS total_tx,
        extract(epoch FROM (now() - stats_reset))::bigint        AS segundos_activos
      FROM pg_stat_database
      WHERE datname = current_database()
    `);

    res.json({
      conexiones: {
        activas:    parseInt(conexiones.activas),
        idle:       parseInt(conexiones.idle),
        idle_in_tx: parseInt(conexiones.idle_in_tx),
        total:      parseInt(conexiones.total),
        max:        parseInt(conexiones.max_conn),
        porcentaje: Math.round(parseInt(conexiones.total) / parseInt(conexiones.max_conn) * 100)
      },
      cache: {
        hit_ratio: parseFloat(cache.cache_hit_ratio),
        blks_hit:  parseInt(cache.blks_hit),
        blks_read: parseInt(cache.blks_read)
      },
      transacciones: {
        commits:   parseInt(cache.xact_commit),
        rollbacks: parseInt(cache.xact_rollback),
        inserts:   parseInt(cache.tup_inserted),
        updates:   parseInt(cache.tup_updated),
        deletes:   parseInt(cache.tup_deleted),
        tps:       txps.segundos_activos > 0
                     ? (parseInt(txps.total_tx) / parseInt(txps.segundos_activos)).toFixed(2)
                     : 0
      },
      base: {
        nombre: process.env.DB_NAME || "base actual",
        tamaño: tamano.tamaño_legible,
        bytes:  parseInt(tamano.tamaño_bytes)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener resumen" });
  }
};

// ─── 2. Actividad en tiempo real ──────────────────────────────────────────────
const getActividad = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        pid,
        usename                          AS usuario,
        application_name                 AS aplicacion,
        state,
        wait_event_type,
        wait_event,
        now() - query_start              AS duracion,
        left(query, 200)                 AS query
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
      ORDER BY query_start ASC NULLS LAST
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener actividad" });
  }
};

// ─── 3. Bloqueos activos ──────────────────────────────────────────────────────
const getBloqueos = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        blocked.pid                       AS pid_bloqueado,
        blocked.usename                   AS usuario_bloqueado,
        left(blocked.query, 150)          AS query_bloqueada,
        blocking.pid                      AS pid_bloqueador,
        blocking.usename                  AS usuario_bloqueador,
        left(blocking.query, 150)         AS query_bloqueadora,
        now() - blocked.query_start       AS tiempo_espera
      FROM pg_stat_activity AS blocked
      JOIN pg_stat_activity AS blocking
        ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
      WHERE cardinality(pg_blocking_pids(blocked.pid)) > 0
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener bloqueos" });
  }
};

// ─── 4. Consultas lentas (pg_stat_statements) ─────────────────────────────────
const getConsultasLentas = async (req, res) => {
  try {
    const [ext] = await query(`
      SELECT count(*) AS total FROM pg_extension WHERE extname = 'pg_stat_statements'
    `);

    if (parseInt(ext.total) === 0) {
      return res.json({ disponible: false, rows: [] });
    }

    const rows = await query(`
      SELECT
        left(query, 200)                     AS query,
        calls                                AS ejecuciones,
        round(total_exec_time::numeric, 2)   AS tiempo_total_ms,
        round(mean_exec_time::numeric, 2)    AS tiempo_promedio_ms,
        round(max_exec_time::numeric, 2)     AS tiempo_max_ms,
        rows                                 AS filas_afectadas
      FROM pg_stat_statements
      WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ORDER BY total_exec_time DESC
      LIMIT 10
    `);

    res.json({ disponible: true, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener consultas lentas" });
  }
};

// ─── 5. Estado de tablas — solo esquema "empresa" ─────────────────────────────
const getTablas = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        schemaname                                              AS esquema,
        relname                                                 AS tabla,
        n_live_tup                                             AS filas_vivas,
        n_dead_tup                                             AS filas_muertas,
        CASE WHEN n_live_tup + n_dead_tup = 0 THEN 0
             ELSE round(n_dead_tup::numeric / (n_live_tup + n_dead_tup) * 100, 1)
        END                                                     AS pct_muertas,
        seq_scan,
        idx_scan,
        to_char(last_autovacuum,  'DD/MM/YYYY HH24:MI')        AS ultimo_autovacuum,
        to_char(last_autoanalyze, 'DD/MM/YYYY HH24:MI')        AS ultimo_autoanalyze,
        pg_size_pretty(pg_total_relation_size(relid))           AS tamaño
      FROM pg_stat_user_tables
      WHERE schemaname = 'empresa'
      ORDER BY n_live_tup DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener estado de tablas" });
  }
};

// ─── 6. Tablas más usadas (todas, ordenadas por operaciones) ──────────────────
const getTablasUsadas = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        schemaname                                                        AS esquema,
        relname                                                           AS tabla,
        COALESCE(seq_scan, 0)                                            AS seq_scan,
        COALESCE(idx_scan, 0)                                            AS idx_scan,
        COALESCE(n_tup_ins, 0)                                           AS inserts,
        COALESCE(n_tup_upd, 0)                                           AS updates,
        COALESCE(n_tup_del, 0)                                           AS deletes,
        COALESCE(seq_scan, 0) + COALESCE(idx_scan, 0)                   AS total_lecturas,
        COALESCE(n_tup_ins, 0) + COALESCE(n_tup_upd, 0)
          + COALESCE(n_tup_del, 0)                                       AS total_escrituras,
        COALESCE(seq_scan, 0) + COALESCE(idx_scan, 0)
          + COALESCE(n_tup_ins, 0) + COALESCE(n_tup_upd, 0)
          + COALESCE(n_tup_del, 0)                                       AS total_operaciones
      FROM pg_stat_user_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY total_operaciones DESC
      LIMIT 12
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener tablas usadas" });
  }
};

// ─── 7. Consultas por tipo ────────────────────────────────────────────────────
const getConsultasPorTipo = async (req, res) => {
  try {
    const ext = await query(`SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'`);

    if (ext.length === 0) {
      const [fb] = await query(`
        SELECT
          datname, xact_commit AS commits, xact_rollback AS rollbacks,
          tup_inserted AS inserts, tup_updated AS updates, tup_deleted AS deletes,
          tup_returned AS filas_retornadas, tup_fetched AS filas_fetch
        FROM pg_stat_database
        WHERE datname = current_database()
      `);
      return res.json({ disponible: false, fallback: fb });
    }

    const rows = await query(`
      SELECT
        UPPER(
          CASE
            WHEN query ILIKE 'select%' THEN 'SELECT'
            WHEN query ILIKE 'insert%' THEN 'INSERT'
            WHEN query ILIKE 'update%' THEN 'UPDATE'
            WHEN query ILIKE 'delete%' THEN 'DELETE'
            WHEN query ILIKE 'with%'   THEN 'WITH'
            ELSE 'OTRO'
          END
        )                                           AS tipo,
        COUNT(*)                                    AS cantidad_queries,
        SUM(calls)                                  AS total_ejecuciones,
        ROUND(SUM(total_exec_time)::numeric, 2)     AS tiempo_total_ms,
        ROUND(AVG(mean_exec_time)::numeric, 2)      AS tiempo_promedio_ms
      FROM pg_stat_statements
      WHERE query NOT ILIKE '%pg_stat%'
      GROUP BY tipo
      ORDER BY total_ejecuciones DESC
    `);
    res.json({ disponible: true, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener consultas por tipo" });
  }
};

// ─── 8. Usuarios más activos ──────────────────────────────────────────────────
const getUsuariosActivos = async (req, res) => {
  try {
    const ext = await query(`SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'`);
    let historico = [];

    if (ext.length > 0) {
      historico = await query(`
        SELECT
          COALESCE(userid::regrole::text, 'desconocido') AS usuario,
          COUNT(*)                                        AS queries_distintas,
          SUM(calls)                                      AS total_ejecuciones,
          ROUND(SUM(total_exec_time)::numeric, 2)         AS tiempo_total_ms,
          ROUND(AVG(mean_exec_time)::numeric, 2)          AS tiempo_promedio_ms
        FROM pg_stat_statements
        WHERE query NOT ILIKE '%pg_stat%'
        GROUP BY userid
        ORDER BY total_ejecuciones DESC
        LIMIT 10
      `);
    }

    const sesiones = await query(`
      SELECT
        COALESCE(usename, 'sin usuario')            AS usuario,
        COUNT(*)                                     AS sesiones_activas,
        COUNT(*) FILTER (WHERE state = 'active')    AS queries_corriendo,
        COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL) AS en_espera,
        MAX(EXTRACT(EPOCH FROM (now() - state_change)))::int AS segundos_max_sesion
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid() AND usename IS NOT NULL
      GROUP BY usename
      ORDER BY sesiones_activas DESC
      LIMIT 10
    `);

    res.json({ historico, sesiones });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios activos" });
  }
};

// ─── 9. Últimas consultas ─────────────────────────────────────────────────────
const getUltimasConsultas = async (req, res) => {
  try {
    const enCurso = await query(`
      SELECT
        pid,
        COALESCE(usename, '—')                           AS usuario,
        state, wait_event_type, wait_event,
        EXTRACT(EPOCH FROM (now() - query_start))::int   AS segundos_ejecutando,
        LEFT(query, 120)                                 AS query,
        query_start
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid()
        AND query IS NOT NULL AND query <> '<IDLE>'
        AND query NOT ILIKE '%pg_stat_activity%'
      ORDER BY query_start DESC NULLS LAST
      LIMIT 20
    `);

    const ext = await query(`SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'`);
    let historial = [];

    if (ext.length > 0) {
      historial = await query(`
        SELECT
          COALESCE(userid::regrole::text, '—')   AS usuario,
          calls                                   AS ejecuciones,
          ROUND(mean_exec_time::numeric, 2)       AS promedio_ms,
          ROUND(max_exec_time::numeric, 2)        AS max_ms,
          LEFT(query, 120)                        AS query
        FROM pg_stat_statements
        WHERE query NOT ILIKE '%pg_stat%' AND query NOT ILIKE '%pg_extension%'
        ORDER BY (total_exec_time / NULLIF(calls, 0)) DESC
        LIMIT 20
      `);
    }

    res.json({ enCurso, historial, pg_stat_disponible: ext.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener últimas consultas" });
  }
};

// ─── 10. Terminar proceso ─────────────────────────────────────────────────────
const terminarProceso = async (req, res) => {
  const { pid } = req.params;
  const pidNum = parseInt(pid);
  if (!pidNum || isNaN(pidNum)) return res.status(400).json({ error: "PID inválido" });

  try {
    const [result] = await query(`SELECT pg_terminate_backend($1) AS terminado`, [pidNum]);
    res.json({
      terminado: result.terminado,
      mensaje: result.terminado
        ? `Proceso ${pidNum} terminado correctamente`
        : `No se pudo terminar el proceso ${pidNum}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al terminar proceso" });
  }
};

// ─── 11. Índices faltantes o ineficientes ─────────────────────────────────────
const getIndicesFaltantes = async (req, res) => {
  try {
    const candidatos = await query(`
      SELECT
        schemaname                                              AS esquema,
        relname                                                 AS tabla,
        COALESCE(seq_scan, 0)                                  AS seq_scan,
        COALESCE(idx_scan, 0)                                  AS idx_scan,
        COALESCE(seq_tup_read, 0)                              AS filas_leidas_secuencial,
        n_live_tup                                             AS filas_vivas,
        pg_size_pretty(pg_total_relation_size(relid))          AS tamaño,
        CASE
          WHEN COALESCE(seq_scan, 0) + COALESCE(idx_scan, 0) = 0 THEN 0
          ELSE round(
            COALESCE(seq_scan, 0)::numeric
            / (COALESCE(seq_scan, 0) + COALESCE(idx_scan, 0)) * 100, 1
          )
        END                                                     AS pct_secuencial
      FROM pg_stat_user_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        AND COALESCE(seq_scan, 0) > 50
        AND n_live_tup > 1000
        AND COALESCE(seq_scan, 0) > COALESCE(idx_scan, 0)
      ORDER BY seq_scan DESC
      LIMIT 15
    `);

    const indicesInutiles = await query(`
      SELECT
        schemaname                                    AS esquema,
        relname                                       AS tabla,
        indexrelname                                  AS indice,
        idx_scan                                      AS veces_usado,
        pg_size_pretty(pg_relation_size(indexrelid))  AS tamaño_indice
      FROM pg_stat_user_indexes
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        AND idx_scan = 0
        AND indexrelname NOT LIKE '%_pkey'
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 15
    `);

    const indicesDuplicados = await query(`
      SELECT
        n.nspname                                     AS esquema,
        t.relname                                     AS tabla,
        array_agg(i.relname ORDER BY i.relname)       AS indices,
        pg_size_pretty(SUM(pg_relation_size(ix.indexrelid))) AS tamaño_total
      FROM pg_index ix
      JOIN pg_class t  ON t.oid = ix.indrelid
      JOIN pg_class i  ON i.oid = ix.indexrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      GROUP BY n.nspname, t.relname, ix.indkey, ix.indpred
      HAVING COUNT(*) > 1
      ORDER BY SUM(pg_relation_size(ix.indexrelid)) DESC
      LIMIT 10
    `);

    res.json({ candidatos, indicesInutiles, indicesDuplicados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al analizar índices" });
  }
};

// ─── 12. Salud general — score + alertas accionables ─────────────────────────
const getSaludGeneral = async (req, res) => {
  try {
    const alertas = [];
    let penalizacion = 0;

    // — Caché hit ratio
    const [cache] = await query(`
      SELECT
        CASE WHEN (blks_hit + blks_read) = 0 THEN 100
             ELSE round(blks_hit::numeric / (blks_hit + blks_read) * 100, 2)
        END AS ratio
      FROM pg_stat_database WHERE datname = current_database()
    `);
    const cacheRatio = parseFloat(cache.ratio);
    if (cacheRatio < 90) {
      penalizacion += 25;
      alertas.push({
        severidad: "critica",
        categoria: "Cache",
        mensaje: `Cache hit ratio en ${cacheRatio}% (ideal > 95%)`,
        recomendacion: "Aumentar shared_buffers en postgresql.conf. Actualmente el servidor está leyendo mucho del disco.",
        valor: cacheRatio
      });
    } else if (cacheRatio < 95) {
      penalizacion += 10;
      alertas.push({
        severidad: "advertencia",
        categoria: "Cache",
        mensaje: `Cache hit ratio en ${cacheRatio}% (ideal > 95%)`,
        recomendacion: "Considera aumentar shared_buffers si tienes RAM disponible.",
        valor: cacheRatio
      });
    }

    // — Conexiones
    const [conn] = await query(`
      SELECT
        count(*) AS total,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_conn
      FROM pg_stat_activity WHERE datname = current_database()
    `);
    const pctConex = Math.round(parseInt(conn.total) / parseInt(conn.max_conn) * 100);
    if (pctConex > 85) {
      penalizacion += 20;
      alertas.push({
        severidad: "critica",
        categoria: "Conexiones",
        mensaje: `${pctConex}% de conexiones usadas (${conn.total}/${conn.max_conn})`,
        recomendacion: "Implementa un connection pooler como PgBouncer. Estás cerca del límite.",
        valor: pctConex
      });
    } else if (pctConex > 70) {
      penalizacion += 8;
      alertas.push({
        severidad: "advertencia",
        categoria: "Conexiones",
        mensaje: `${pctConex}% de conexiones usadas`,
        recomendacion: "Monitorea el crecimiento. Considera PgBouncer si sigue subiendo.",
        valor: pctConex
      });
    }

    // — Bloqueos activos
    const bloqueos = await query(`
      SELECT COUNT(*) AS total
      FROM pg_stat_activity
      WHERE cardinality(pg_blocking_pids(pid)) > 0
    `);
    const totalBloqueos = parseInt(bloqueos[0].total);
    if (totalBloqueos > 0) {
      penalizacion += 15;
      alertas.push({
        severidad: "critica",
        categoria: "Bloqueos",
        mensaje: `${totalBloqueos} proceso(s) bloqueado(s) en este momento`,
        recomendacion: "Revisa la pestaña de Bloqueos para identificar y terminar los procesos bloqueadores.",
        valor: totalBloqueos
      });
    }

    // — Tablas con alto porcentaje de filas muertas (bloat)
    const bloat = await query(`
      SELECT relname AS tabla,
             round(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 1) AS pct_muertas
      FROM pg_stat_user_tables
      WHERE n_live_tup + n_dead_tup > 1000
        AND round(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 1) > 20
      ORDER BY pct_muertas DESC
      LIMIT 5
    `);
    if (bloat.length > 0) {
      penalizacion += 10;
      alertas.push({
        severidad: "advertencia",
        categoria: "Bloat",
        mensaje: `${bloat.length} tabla(s) con >20% de filas muertas: ${bloat.map(b => b.tabla).join(", ")}`,
        recomendacion: "Ejecuta VACUUM ANALYZE en esas tablas. Si es recurrente, ajusta autovacuum_vacuum_scale_factor.",
        valor: bloat.length
      });
    }

    // — Idle in transaction
    const [idleTx] = await query(`
      SELECT count(*) AS total
      FROM pg_stat_activity
      WHERE state = 'idle in transaction'
        AND query_start < now() - interval '5 minutes'
    `);
    const totalIdleTx = parseInt(idleTx.total);
    if (totalIdleTx > 0) {
      penalizacion += 10;
      alertas.push({
        severidad: "advertencia",
        categoria: "Transacciones",
        mensaje: `${totalIdleTx} conexión(es) en "idle in transaction" por más de 5 minutos`,
        recomendacion: "Revisa tu código de aplicación: puede haber transacciones abiertas sin cerrarse. Considera idle_in_transaction_session_timeout.",
        valor: totalIdleTx
      });
    }

    // — Rollback ratio alto
    const [tx] = await query(`
      SELECT xact_commit, xact_rollback
      FROM pg_stat_database WHERE datname = current_database()
    `);
    const totalTx = parseInt(tx.xact_commit) + parseInt(tx.xact_rollback);
    const rollbackRatio = totalTx > 0
      ? Math.round(parseInt(tx.xact_rollback) / totalTx * 100)
      : 0;
    if (rollbackRatio > 10) {
      penalizacion += 10;
      alertas.push({
        severidad: "advertencia",
        categoria: "Transacciones",
        mensaje: `${rollbackRatio}% de transacciones terminan en rollback`,
        recomendacion: "Revisa los errores de aplicación. Un rollback ratio alto puede indicar errores frecuentes o lógica de negocio con fallas.",
        valor: rollbackRatio
      });
    }

    // — Tablas sin autovacuum reciente
    const sinVacuum = await query(`
      SELECT relname AS tabla,
             to_char(last_autovacuum, 'DD/MM/YYYY') AS ultimo_vacuum
      FROM pg_stat_user_tables
      WHERE n_live_tup > 5000
        AND (last_autovacuum IS NULL OR last_autovacuum < now() - interval '7 days')
      ORDER BY n_live_tup DESC
      LIMIT 5
    `);
    if (sinVacuum.length > 0) {
      penalizacion += 5;
      alertas.push({
        severidad: "info",
        categoria: "Mantenimiento",
        mensaje: `${sinVacuum.length} tabla(s) con más de 5000 filas sin autovacuum en 7 días`,
        recomendacion: "Ejecuta VACUUM ANALYZE manualmente o revisa la configuración de autovacuum.",
        valor: sinVacuum.length
      });
    }

    const score = Math.max(0, 100 - penalizacion);

    res.json({
      score,
      nivel: score >= 85 ? "saludable" : score >= 60 ? "advertencia" : "critico",
      alertas: alertas.sort((a, b) => {
        const orden = { critica: 0, advertencia: 1, info: 2 };
        return orden[a.severidad] - orden[b.severidad];
      }),
      resumen: {
        cache_hit_ratio: cacheRatio,
        pct_conexiones: pctConex,
        bloqueos_activos: totalBloqueos,
        rollback_ratio: rollbackRatio,
        tablas_con_bloat: bloat.length,
        idle_in_tx_largo: totalIdleTx
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al calcular salud general" });
  }
};

// ─── 13. Espacio por esquema y tabla ──────────────────────────────────────────
const getEspacioPorEsquema = async (req, res) => {
  try {
    const porEsquema = await query(`
      SELECT
        n.nspname                                                       AS esquema,
        count(c.relname)                                               AS num_tablas,
        pg_size_pretty(SUM(pg_total_relation_size(c.oid)))             AS tamaño_total,
        SUM(pg_total_relation_size(c.oid))                             AS bytes_total
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      GROUP BY n.nspname
      ORDER BY bytes_total DESC
    `);

    const porTabla = await query(`
      SELECT
        n.nspname                                                       AS esquema,
        c.relname                                                       AS tabla,
        pg_size_pretty(pg_table_size(c.oid))                           AS tamaño_datos,
        pg_size_pretty(pg_indexes_size(c.oid))                         AS tamaño_indices,
        pg_size_pretty(pg_total_relation_size(c.oid))                  AS tamaño_total,
        pg_total_relation_size(c.oid)                                  AS bytes_total,
        s.n_live_tup                                                   AS filas
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
      WHERE c.relkind = 'r'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY bytes_total DESC
      LIMIT 20
    `);

    res.json({ porEsquema, porTabla });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener espacio por esquema" });
  }
};

// ─── 14. Ejecutar query de prueba (solo SELECT / WITH) ───────────────────────
const ejecutarQuery = async (req, res) => {
  const { sql } = req.body;

  if (!sql || typeof sql !== "string" || sql.trim().length === 0) {
    return res.status(400).json({ error: "Query vacía o inválida." });
  }

  const validacion = esQuerySegura(sql);
  if (!validacion.valida) {
    return res.status(400).json({ error: validacion.razon });
  }

  const inicio = Date.now();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = '10s'");

    const limitada = sql.trim().replace(/;+$/, "");
    const result = await client.query(`
      SELECT * FROM (${limitada}) AS __resultado__ LIMIT 500
    `);

    await client.query("ROLLBACK");

    const duracion = Date.now() - inicio;

    res.json({
      columnas: result.fields.map(f => f.name),
      filas: result.rows,
      total: result.rowCount,
      truncado: result.rowCount === 500,
      duracion_ms: duracion
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(400).json({
      error: "Error al ejecutar la consulta.",
      detalle: err.message || "Error desconocido"
    });
  } finally {
    client.release();
  }
};

// ─── 15. EXPLAIN ANALYZE de una query ────────────────────────────────────────
const explicarQuery = async (req, res) => {
  const { sql } = req.body;

  if (!sql || typeof sql !== "string" || sql.trim().length === 0) {
    return res.status(400).json({ error: "Query vacía o inválida." });
  }

  const sinExplain = sql.trim().replace(/^EXPLAIN\s*(ANALYZE\s*)?(BUFFERS\s*)?(FORMAT\s+\w+\s*)?/i, "");
  const validacion = esQuerySegura(sinExplain);
  if (!validacion.valida) {
    return res.status(400).json({ error: validacion.razon });
  }

  const inicio = Date.now();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = '30s'");

    const queryLimpia = sinExplain.trim().replace(/;+$/, "");
    const result = await client.query(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${queryLimpia}`
    );

    await client.query("ROLLBACK");

    const duracion = Date.now() - inicio;
    const plan = result.rows[0]["QUERY PLAN"][0];

    // ── Extraer nodos costosos recursivamente ─────────────────────────────────
    const nodosCostosos = [];
    const recorrerNodos = (nodo, profundidad = 0) => {
      if (!nodo) return;
      const tipo       = nodo["Node Type"] || "Desconocido";
      const costoTotal = nodo["Total Cost"] || 0;
      const filas      = nodo["Actual Rows"] ?? nodo["Plan Rows"] ?? 0;
      const loops      = nodo["Actual Loops"] || 1;
      const tiempo     = (nodo["Actual Total Time"] || 0) * loops;
      const buffers    = (nodo["Shared Hit Blocks"] || 0) + (nodo["Shared Read Blocks"] || 0);

      if (costoTotal > 100 || tiempo > 10) {
        nodosCostosos.push({
          tipo,
          profundidad,
          costo_total:          costoTotal,
          filas_reales:         filas * loops,
          filas_estimadas:      nodo["Plan Rows"] || 0,
          tiempo_ms:            parseFloat(tiempo.toFixed(2)),
          buffers_bloques:      buffers,
          relacion:             nodo["Relation Name"] || nodo["Alias"] || null,
          filtro:               nodo["Filter"] || nodo["Index Cond"] || null,
          removidas_por_filtro: nodo["Rows Removed by Filter"] || 0
        });
      }

      (nodo["Plans"] || []).forEach(hijo => recorrerNodos(hijo, profundidad + 1));
    };
    recorrerNodos(plan["Plan"]);
    nodosCostosos.sort((a, b) => b.tiempo_ms - a.tiempo_ms);

    // ── Recomendaciones automáticas ───────────────────────────────────────────
    const recomendaciones = [];
    const planStr = JSON.stringify(plan);

    if (planStr.includes('"Seq Scan"') && plan["Plan"]["Total Cost"] > 500) {
      recomendaciones.push({
        tipo: "indice",
        mensaje: "Se detectó un Seq Scan costoso. Considera agregar un índice en las columnas usadas en WHERE o JOIN."
      });
    }
    if (planStr.includes('"Nested Loop"')) {
      const loops = nodosCostosos.filter(n => n.tipo === "Nested Loop" && n.filas_reales > 10000);
      if (loops.length > 0) {
        recomendaciones.push({
          tipo: "join",
          mensaje: "Nested Loop con muchas filas puede ser costoso. Verifica que las columnas de JOIN tengan índices."
        });
      }
    }
    if (planStr.includes('"Sort"')) {
      recomendaciones.push({
        tipo: "orden",
        mensaje: "Se está haciendo un Sort en memoria. Si usas ORDER BY frecuentemente en esta columna, considera un índice ordenado."
      });
    }
    const nodoConMuchasFilasRemovidas = nodosCostosos.find(n => n.removidas_por_filtro > 1000);
    if (nodoConMuchasFilasRemovidas) {
      recomendaciones.push({
        tipo: "filtro",
        mensaje: `El nodo "${nodoConMuchasFilasRemovidas.tipo}" eliminó ${nodoConMuchasFilasRemovidas.removidas_por_filtro} filas por filtro. Un índice parcial o compuesto podría reducir el trabajo.`
      });
    }
    const estimacionErrada = nodosCostosos.find(n =>
      n.filas_estimadas > 0 &&
      Math.abs(n.filas_reales - n.filas_estimadas) / n.filas_estimadas > 10
    );
    if (estimacionErrada) {
      recomendaciones.push({
        tipo: "estadisticas",
        mensaje: `El planificador estimó ${estimacionErrada.filas_estimadas} filas pero obtuvo ${estimacionErrada.filas_reales}. Ejecuta ANALYZE en la tabla para actualizar las estadísticas.`
      });
    }

    res.json({
      plan_completo: plan,
      resumen: {
        costo_total:            plan["Plan"]["Total Cost"],
        tiempo_planificacion_ms: plan["Planning Time"] || 0,
        tiempo_ejecucion_ms:    plan["Execution Time"] || duracion,
        duracion_real_ms:       duracion
      },
      nodos_costosos:   nodosCostosos.slice(0, 10),
      recomendaciones
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(400).json({
      error: "Error al ejecutar EXPLAIN.",
      detalle: err.message || "Error desconocido"
    });
  } finally {
    client.release();
  }
};

module.exports = {
  // Existentes
  getResumen,
  getActividad,
  getBloqueos,
  getConsultasLentas,
  getTablas,
  getTablasUsadas,
  getConsultasPorTipo,
  getUsuariosActivos,
  getUltimasConsultas,
  terminarProceso,
  // Nuevas
  getIndicesFaltantes,
  getSaludGeneral,
  getEspacioPorEsquema,
  ejecutarQuery,
  explicarQuery
};