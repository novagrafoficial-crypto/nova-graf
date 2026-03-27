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

// ─── 5. Estado de tablas — SOLO esquema "empresa" ────────────────────────────
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

// ─── 6. Tablas más usadas (todas, ordenadas por operaciones) ─────────────────
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

// ─── 7. Consultas por tipo (pg_stat_statements o fallback) ───────────────────
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

module.exports = {
  getResumen,
  getActividad,
  getBloqueos,
  getConsultasLentas,
  getTablas,
  getTablasUsadas,
  getConsultasPorTipo,
  getUsuariosActivos,
  getUltimasConsultas,
  terminarProceso
};