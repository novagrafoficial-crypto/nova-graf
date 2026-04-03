const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Helper ───────────────────────────────────────────────────────────────────
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
        count(*) FILTER (WHERE state = 'active')    AS activas,
        count(*) FILTER (WHERE state = 'idle')      AS idle,
        count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_tx,
        count(*)                                    AS total,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_conn
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    const [cache] = await query(`
      SELECT
        blks_hit,
        blks_read,
        CASE WHEN (blks_hit + blks_read) = 0 THEN 100
             ELSE round(blks_hit::numeric / (blks_hit + blks_read) * 100, 2)
        END AS cache_hit_ratio,
        xact_commit,
        xact_rollback,
        tup_inserted,
        tup_updated,
        tup_deleted
      FROM pg_stat_database
      WHERE datname = current_database()
    `);

    const [tamano] = await query(`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) AS tamaño_legible,
        pg_database_size(current_database()) AS tamaño_bytes
    `);

    const [txps] = await query(`
      SELECT
        xact_commit + xact_rollback AS total_tx,
        extract(epoch FROM (now() - stats_reset))::bigint AS segundos_activos
      FROM pg_stat_database
      WHERE datname = current_database()
    `);

    res.json({
      conexiones: {
        activas:      parseInt(conexiones.activas),
        idle:         parseInt(conexiones.idle),
        idle_in_tx:   parseInt(conexiones.idle_in_tx),
        total:        parseInt(conexiones.total),
        max:          parseInt(conexiones.max_conn),
        porcentaje:   Math.round(parseInt(conexiones.total) / parseInt(conexiones.max_conn) * 100)
      },
      cache: {
        hit_ratio:    parseFloat(cache.cache_hit_ratio),
        blks_hit:     parseInt(cache.blks_hit),
        blks_read:    parseInt(cache.blks_read)
      },
      transacciones: {
        commits:      parseInt(cache.xact_commit),
        rollbacks:    parseInt(cache.xact_rollback),
        inserts:      parseInt(cache.tup_inserted),
        updates:      parseInt(cache.tup_updated),
        deletes:      parseInt(cache.tup_deleted),
        tps:          txps.segundos_activos > 0
                        ? (parseInt(txps.total_tx) / parseInt(txps.segundos_activos)).toFixed(2)
                        : 0
      },
      base: {
        nombre:  process.env.DB_NAME || "base actual",
        tamaño:  tamano.tamaño_legible,
        bytes:   parseInt(tamano.tamaño_bytes)
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
        usename                                        AS usuario,
        application_name                               AS aplicacion,
        state,
        wait_event_type,
        wait_event,
        now() - query_start                            AS duracion,
        left(query, 200)                               AS query
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
        blocked.pid                                    AS pid_bloqueado,
        blocked.usename                                AS usuario_bloqueado,
        left(blocked.query, 150)                       AS query_bloqueada,
        blocking.pid                                   AS pid_bloqueador,
        blocking.usename                               AS usuario_bloqueador,
        left(blocking.query, 150)                      AS query_bloqueadora,
        now() - blocked.query_start                    AS tiempo_espera
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
    // Verificar si la extensión está instalada
    const [ext] = await query(`
      SELECT count(*) AS total
      FROM pg_extension
      WHERE extname = 'pg_stat_statements'
    `);

    if (parseInt(ext.total) === 0) {
      return res.json({ disponible: false, rows: [] });
    }

    const rows = await query(`
      SELECT
        left(query, 200)                              AS query,
        calls                                         AS ejecuciones,
        round(total_exec_time::numeric, 2)            AS tiempo_total_ms,
        round(mean_exec_time::numeric, 2)             AS tiempo_promedio_ms,
        round(max_exec_time::numeric, 2)              AS tiempo_max_ms,
        rows                                          AS filas_afectadas
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

// ─── 5. Estado de tablas (vacuum, bloat, scans) ───────────────────────────────
const getTablas = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        schemaname                                    AS esquema,
        relname                                       AS tabla,
        n_live_tup                                    AS filas_vivas,
        n_dead_tup                                    AS filas_muertas,
        CASE WHEN n_live_tup + n_dead_tup = 0 THEN 0
             ELSE round(n_dead_tup::numeric / (n_live_tup + n_dead_tup) * 100, 1)
        END                                           AS pct_muertas,
        seq_scan,
        idx_scan,
        to_char(last_autovacuum,  'DD/MM/YYYY HH24:MI') AS ultimo_autovacuum,
        to_char(last_autoanalyze, 'DD/MM/YYYY HH24:MI') AS ultimo_autoanalyze,
        pg_size_pretty(pg_total_relation_size(relid))  AS tamaño
      FROM pg_stat_user_tables
      ORDER BY n_dead_tup DESC
      LIMIT 15
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener estado de tablas" });
  }
};

// ─── 6. Terminar proceso ──────────────────────────────────────────────────────
const terminarProceso = async (req, res) => {
  const { pid } = req.params;
  const pidNum = parseInt(pid);

  if (!pidNum || isNaN(pidNum)) {
    return res.status(400).json({ error: "PID inválido" });
  }

  try {
    const [result] = await query(
      `SELECT pg_terminate_backend($1) AS terminado`,
      [pidNum]
    );
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
  terminarProceso
};