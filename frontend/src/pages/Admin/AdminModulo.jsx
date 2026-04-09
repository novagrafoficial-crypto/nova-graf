import { useState, useEffect, useCallback } from "react";
import "../../styles/admin/AdminModulo.css";

// ✅ URL dinámica con fallback para desarrollo local
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_MODULO    = `${API_BASE}/api/admin/modulo`;
const API_MONITOREO = `${API_BASE}/api/admin/monitoreo`;

const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const formatDuracion = (interval) => {
  if (!interval) return "—";
  const str   = String(interval);
  const match = str.match(/(\d+):(\d+):(\d+)/);
  if (!match) return str;
  const [, h, m, s] = match;
  if (parseInt(h) > 0) return `${h}h ${m}m`;
  if (parseInt(m) > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// ─── StatusDot ────────────────────────────────────────────────────────────────
function StatusDot({ state }) {
  const colorMap = {
    active:                          "var(--am-green)",
    idle:                            "var(--am-muted-border)",
    "idle in transaction":           "var(--am-amber)",
    "idle in transaction (aborted)": "var(--am-red)",
  };
  return (
    <span style={{
      display: "inline-block",
      width: 8, height: 8,
      borderRadius: "50%",
      background: colorMap[state] || "var(--am-muted-border)",
      flexShrink: 0,
    }} />
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, status }) {
  const statusColors = {
    ok:   "var(--am-green)",
    warn: "var(--am-amber)",
    bad:  "var(--am-red)",
  };
  return (
    <div className="am-stat-card">
      {status && (
        <span className="am-stat-status-bar" style={{ background: statusColors[status] || "transparent" }} />
      )}
      <div className="am-stat-icon">{icon}</div>
      <div className="am-stat-label">{label}</div>
      <div className="am-stat-value">{value ?? "—"}</div>
      {sub && <div className="am-stat-sub">{sub}</div>}
    </div>
  );
}

// ─── GaugeBar ─────────────────────────────────────────────────────────────────
function GaugeBar({ value, label, inverted = false }) {
  const pct = Math.min(Math.round(value), 100);
  const getColor = () => {
    if (!inverted) {
      if (pct >= 90) return "var(--am-red)";
      if (pct >= 70) return "var(--am-amber)";
      return "var(--am-green)";
    } else {
      if (pct < 90) return "var(--am-red)";
      if (pct < 95) return "var(--am-amber)";
      return "var(--am-green)";
    }
  };
  return (
    <div className="am-gauge">
      <div className="am-gauge-header">
        <span className="am-gauge-label">{label}</span>
        <span className="am-gauge-pct" style={{ color: getColor() }}>{pct}%</span>
      </div>
      <div className="am-gauge-track">
        <div className="am-gauge-fill" style={{ width: `${pct}%`, background: getColor() }} />
      </div>
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
function Section({ title, count, countBad, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="am-section">
      <button className="am-section-header" onClick={() => setOpen(!open)}>
        <span className="am-section-title">{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {count !== undefined && (
            <span className={`am-count-badge ${countBad && count > 0 ? "am-count-badge--bad" : ""}`}>
              {count}
            </span>
          )}
          <span className="am-section-chevron">{open ? "▾" : "▸"}</span>
        </div>
      </button>
      {open && <div className="am-section-body">{children}</div>}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ icon, text }) {
  return (
    <div className="am-empty">
      <span className="am-empty-icon">{icon}</span>
      <span className="am-empty-text">{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminModulo() {
  const [tabActiva, setTabActiva] = useState("respaldo");

  // ── Respaldos ────────────────────────────────────────────────
  const [historial,         setHistorial]        = useState([]);
  const [tablas,            setTablas]            = useState([]);
  const [tablaSeleccionada, setTablaSeleccionada] = useState("");

  // ── CSV ──────────────────────────────────────────────────────
  const [tablaCSV,      setTablaCSV]      = useState("");
  const [archivoCSV,    setArchivoCSV]    = useState(null);
  const [mensajeImport, setMensajeImport] = useState("");
  const [cargandoCSV,   setCargandoCSV]   = useState(false);

  // ── Monitoreo ────────────────────────────────────────────────
  const [monitor,     setMonitor]     = useState(null);
  const [monCargando, setMonCargando] = useState(false);
  const [monError,    setMonError]    = useState(null);
  const [ultimaAct,   setUltimaAct]   = useState(null);
  const [terminando,  setTerminando]  = useState(null);
  const [msgTerminar, setMsgTerminar] = useState("");

  useEffect(() => {
    fetchJSON(`${API_MODULO}/historial`).then(setHistorial).catch(() => {});
    fetchJSON(`${API_MODULO}/tablas`).then(setTablas).catch(() => {});
  }, []);

  const descargarArchivo = async (url) => {
    const res = await fetch(url);
    if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.error || "Error"); return; }
    if (res.status === 204) { alert("La tabla está vacía."); return; }
    const blob    = await res.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const cd      = res.headers.get("content-disposition");
    let fileName  = "descarga";
    if (cd) { const m = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/); if (m?.[1]) fileName = m[1].replace(/['"]/g, "").trim(); }
    const a = document.createElement("a");
    a.href = urlBlob; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(urlBlob);
    setTimeout(() => fetchJSON(`${API_MODULO}/historial`).then(setHistorial), 500);
  };

  const importarCSV = async () => {
    if (!tablaCSV || !archivoCSV) return;
    const formData = new FormData();
    formData.append("archivo", archivoCSV);
    setCargandoCSV(true); setMensajeImport("");
    try {
      const res  = await fetch(`${API_MODULO}/csv/${tablaCSV}`, { method: "POST", body: formData });
      const data = await res.json();
      setMensajeImport(data.message || data.error || "Respuesta inesperada");
      setArchivoCSV(null);
      const input = document.getElementById("csv-file-input");
      if (input) input.value = "";
    } catch { setMensajeImport("Error de red al importar el archivo"); }
    finally  { setCargandoCSV(false); }
  };

  const cargarMonitoreo = useCallback(async () => {
    setMonCargando(true); setMonError(null); setMsgTerminar("");
    try {
      const [resumen, actividad, bloqueos, lentas, tablasMon] = await Promise.all([
        fetchJSON(`${API_MONITOREO}/resumen`),
        fetchJSON(`${API_MONITOREO}/actividad`),
        fetchJSON(`${API_MONITOREO}/bloqueos`),
        fetchJSON(`${API_MONITOREO}/consultas-lentas`),
        fetchJSON(`${API_MONITOREO}/tablas`),
      ]);
      setMonitor({ resumen, actividad, bloqueos, lentas, tablas: tablasMon });
      setUltimaAct(new Date().toLocaleTimeString());
    } catch { setMonError("No se pudo conectar con el servidor de monitoreo."); }
    finally  { setMonCargando(false); }
  }, []);

  // ── Auto-refresh cada 5s solo cuando el tab de monitoreo está activo ──
  useEffect(() => {
    if (tabActiva !== "monitoreo") return;
    cargarMonitoreo();
    const intervalo = setInterval(cargarMonitoreo, 5000);
    return () => clearInterval(intervalo);
  }, [tabActiva, cargarMonitoreo]);

  const terminarProceso = async (pid) => {
    if (!window.confirm(`¿Terminar el proceso ${pid}?`)) return;
    setTerminando(pid);
    try {
      const res  = await fetch(`${API_MONITOREO}/proceso/${pid}`, { method: "DELETE" });
      const json = await res.json();
      setMsgTerminar(json.mensaje || json.error);
      cargarMonitoreo();
    } catch { setMsgTerminar("Error al terminar el proceso"); }
    finally  { setTerminando(null); }
  };

  const { resumen, actividad, bloqueos, lentas, tablas: tablasMon } = monitor || {};

  const tabs = [
    { id: "respaldo",  label: "Respaldos",  icon: "💾" },
    { id: "csv",       label: "CSV",         icon: "📄" },
    { id: "monitoreo", label: "Monitoreo",   icon: "📊" },
  ];

  // ═══════════════════════════════════════════════════════════
  return (
    <div className="am-root">

      {/* ── Header ── */}
      <div className="am-header">
        <div className="am-header-title">
          <span className="am-header-dot" />
          Panel de administración
        </div>
        <div className="am-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`am-tab ${tabActiva === t.id ? "am-tab--active" : ""}`}
              onClick={() => setTabActiva(t.id)}
            >
              <span className="am-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="am-content">

        {/* ════════ RESPALDOS ════════ */}
        {tabActiva === "respaldo" && (
          <div className="am-grid-2">
            <div>
              <div className="am-card">
                <div className="am-card-header">
                  <span className="am-card-icon">🗄️</span>
                  <div>
                    <div className="am-card-title">Respaldo completo</div>
                    <div className="am-card-desc">Exporta toda la base en formato SQL</div>
                  </div>
                </div>
                <button className="am-btn am-btn--primary" onClick={() => descargarArchivo(API_MODULO)}>
                  ↓ Generar respaldo completo
                </button>
              </div>

              <div className="am-card" style={{ marginTop: 16 }}>
                <div className="am-card-header">
                  <span className="am-card-icon">📋</span>
                  <div>
                    <div className="am-card-title">Respaldo por tabla</div>
                    <div className="am-card-desc">Selecciona una tabla específica</div>
                  </div>
                </div>
                <select
                  className="am-select"
                  value={tablaSeleccionada}
                  onChange={(e) => setTablaSeleccionada(e.target.value)}
                >
                  <option value="">Seleccionar tabla…</option>
                  {tablas.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
                <button
                  className="am-btn am-btn--primary"
                  disabled={!tablaSeleccionada}
                  onClick={() => descargarArchivo(`${API_MODULO}/tabla/${tablaSeleccionada}`)}
                  style={{ marginTop: 10 }}
                >
                  ↓ Respaldar tabla
                </button>
              </div>
            </div>

            <div className="am-card am-card--full">
              <div className="am-card-header">
                <span className="am-card-icon">🕑</span>
                <div className="am-card-title">Historial de respaldos</div>
              </div>
              {historial.length === 0 ? (
                <EmptyState icon="📭" text="Sin respaldos aún" />
              ) : (
                <div className="am-table-wrap">
                  <table className="am-table">
                    <thead>
                      <tr>
                        <th>Archivo</th>
                        <th>Fecha</th>
                        <th>Tamaño</th>
                        <th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((item, i) => (
                        <tr key={i}>
                          <td className="am-mono">{item.nombre}</td>
                          <td>{new Date(item.fecha).toLocaleString()}</td>
                          <td>{item.tamaño}</td>
                          <td><span className="am-pill am-pill--info">{item.tipo}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ CSV ════════ */}
        {tabActiva === "csv" && (
          <div className="am-card" style={{ maxWidth: 560 }}>
            <div className="am-card-header">
              <span className="am-card-icon">📄</span>
              <div>
                <div className="am-card-title">Exportar / Importar CSV</div>
                <div className="am-card-desc">Selecciona una tabla para operar</div>
              </div>
            </div>

            <select
              className="am-select"
              value={tablaCSV}
              onChange={(e) => { setTablaCSV(e.target.value); setMensajeImport(""); }}
            >
              <option value="">Seleccionar tabla…</option>
              {tablas.map((t, i) => <option key={i} value={t}>{t}</option>)}
            </select>

            <div className="am-csv-actions">
              <button
                className="am-btn am-btn--primary"
                disabled={!tablaCSV}
                onClick={() => descargarArchivo(`${API_MODULO}/csv/${tablaCSV}`)}
              >
                ↓ Exportar CSV
              </button>
            </div>

            <div className="am-divider"><span>Importar</span></div>

            <div className="am-file-row">
              <label className="am-file-label">
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={(e) => { setArchivoCSV(e.target.files[0] || null); setMensajeImport(""); }}
                />
                {archivoCSV ? archivoCSV.name : "Elegir archivo .csv…"}
              </label>
              <button
                className="am-btn am-btn--primary"
                disabled={!tablaCSV || !archivoCSV || cargandoCSV}
                onClick={importarCSV}
              >
                {cargandoCSV ? "Importando…" : "↑ Importar"}
              </button>
            </div>

            {mensajeImport && (
              <div className={`am-alert ${mensajeImport.toLowerCase().includes("error") ? "am-alert--error" : "am-alert--ok"}`}>
                {mensajeImport}
              </div>
            )}
          </div>
        )}

        {/* ════════ MONITOREO ════════ */}
        {tabActiva === "monitoreo" && (
          <>
            <div className="am-monitor-bar">
              <span className="am-live-badge">
                <span className="am-live-dot" />
                En vivo · cada 5s
              </span>
              {ultimaAct && (
                <span className="am-monitor-time">
                  {monCargando
                    ? <><span className="am-spinner" /> Actualizando…</>
                    : `Actualizado ${ultimaAct}`}
                </span>
              )}
            </div>

            {monError && <div className="am-alert am-alert--error">{monError}</div>}
            {msgTerminar && (
              <div className={`am-alert ${msgTerminar.includes("Error") ? "am-alert--error" : "am-alert--ok"}`}>
                {msgTerminar}
              </div>
            )}

            {!monitor && monCargando && (
              <div className="am-card am-welcome">
                <span className="am-welcome-icon">📊</span>
                <p className="am-welcome-text">Cargando métricas…</p>
              </div>
            )}

            {monitor && (
              <>
                {/* ── Resumen ── */}
                <Section title="Resumen general">
                  <div className="am-stats-grid">
                    <StatCard
                      icon="🔌"
                      label="Conexiones"
                      value={`${resumen.conexiones.total} / ${resumen.conexiones.max}`}
                      sub={`${resumen.conexiones.porcentaje}% del límite`}
                      status={resumen.conexiones.porcentaje >= 90 ? "bad" : resumen.conexiones.porcentaje >= 70 ? "warn" : "ok"}
                    />
                    <StatCard
                      icon="⚡"
                      label="Cache hit"
                      value={`${resumen.cache.hit_ratio}%`}
                      sub={resumen.cache.hit_ratio >= 99 ? "Óptimo" : resumen.cache.hit_ratio >= 95 ? "Aceptable" : "Revisar shared_buffers"}
                      status={resumen.cache.hit_ratio < 95 ? "warn" : "ok"}
                    />
                    <StatCard
                      icon="🔄"
                      label="TPS promedio"
                      value={resumen.transacciones.tps}
                      sub="transacciones / seg"
                    />
                    <StatCard
                      icon="🗃️"
                      label="Tamaño de base"
                      value={resumen.base.tamaño}
                      sub={resumen.base.nombre}
                    />
                    <StatCard
                      icon="✅"
                      label="Commits"
                      value={resumen.transacciones.commits.toLocaleString()}
                    />
                    <StatCard
                      icon="↩️"
                      label="Rollbacks"
                      value={resumen.transacciones.rollbacks.toLocaleString()}
                      status={resumen.transacciones.rollbacks > 100 ? "warn" : null}
                    />
                  </div>
                  <div className="am-gauges">
                    <GaugeBar
                      value={resumen.conexiones.porcentaje}
                      label="Uso de conexiones"
                    />
                    <GaugeBar
                      value={resumen.cache.hit_ratio}
                      label="Cache hit ratio"
                      inverted
                    />
                  </div>
                </Section>

                {/* ── Actividad ── */}
                <Section
                  title="Actividad en tiempo real"
                  count={actividad.length}
                  countBad={actividad.some((r) => r.wait_event_type)}
                >
                  {actividad.length === 0 ? (
                    <EmptyState icon="🟢" text="Sin sesiones activas" />
                  ) : (
                    <div className="am-table-wrap">
                      <table className="am-table">
                        <thead>
                          <tr>
                            <th>PID</th>
                            <th>Usuario</th>
                            <th>Estado</th>
                            <th>Espera</th>
                            <th>Duración</th>
                            <th>Query</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {actividad.map((row) => (
                            <tr key={row.pid} className={row.wait_event_type ? "am-tr--warn" : ""}>
                              <td className="am-mono am-dim">{row.pid}</td>
                              <td>{row.usuario || <span className="am-dim">—</span>}</td>
                              <td>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <StatusDot state={row.state} />
                                  <span style={{ fontSize: 12 }}>{row.state}</span>
                                </span>
                              </td>
                              <td>
                                {row.wait_event_type
                                  ? <span className="am-pill am-pill--warn">{row.wait_event_type}</span>
                                  : <span className="am-dim">—</span>}
                              </td>
                              <td className="am-mono">{formatDuracion(row.duracion)}</td>
                              <td className="am-query" title={row.query}>{row.query || <span className="am-dim">—</span>}</td>
                              <td>
                                <button
                                  className="am-btn-kill"
                                  disabled={terminando === row.pid}
                                  onClick={() => terminarProceso(row.pid)}
                                  title={`Terminar PID ${row.pid}`}
                                >
                                  {terminando === row.pid ? "…" : "✕"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>

                {/* ── Bloqueos ── */}
                <Section title="Bloqueos activos" count={bloqueos.length} countBad>
                  {bloqueos.length === 0 ? (
                    <EmptyState icon="🔓" text="Sin bloqueos detectados" />
                  ) : (
                    <div className="am-table-wrap">
                      <table className="am-table">
                        <thead>
                          <tr>
                            <th>PID bloqueado</th>
                            <th>Query bloqueada</th>
                            <th>Tiempo espera</th>
                            <th>PID bloqueador</th>
                            <th>Query bloqueadora</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bloqueos.map((row, i) => (
                            <tr key={i} className="am-tr--error">
                              <td className="am-mono">{row.pid_bloqueado}</td>
                              <td className="am-query" title={row.query_bloqueada}>{row.query_bloqueada}</td>
                              <td className="am-mono am-text--warn">{formatDuracion(row.tiempo_espera)}</td>
                              <td className="am-mono">{row.pid_bloqueador}</td>
                              <td className="am-query" title={row.query_bloqueadora}>{row.query_bloqueadora}</td>
                              <td>
                                <button
                                  className="am-btn-kill am-btn-kill--label"
                                  disabled={terminando === row.pid_bloqueador}
                                  onClick={() => terminarProceso(row.pid_bloqueador)}
                                >
                                  {terminando === row.pid_bloqueador ? "…" : "✕ Liberar"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>

                {/* ── Consultas lentas ── */}
                <Section title="Top 10 consultas más costosas">
                  {!lentas.disponible ? (
                    <div className="am-alert am-alert--info">
                      La extensión <code>pg_stat_statements</code> no está instalada.
                      Ejecuta: <code>CREATE EXTENSION pg_stat_statements;</code> y agrega
                      <code>pg_stat_statements</code> a <code>shared_preload_libraries</code>.
                    </div>
                  ) : lentas.rows.length === 0 ? (
                    <EmptyState icon="📭" text="Sin datos aún" />
                  ) : (
                    <div className="am-table-wrap">
                      <table className="am-table">
                        <thead>
                          <tr>
                            <th style={{ width: 32 }}>#</th>
                            <th>Query</th>
                            <th>Ejecuciones</th>
                            <th>Total (ms)</th>
                            <th>Promedio (ms)</th>
                            <th>Máximo (ms)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lentas.rows.map((row, i) => (
                            <tr key={i} className={row.tiempo_promedio_ms > 1000 ? "am-tr--warn" : ""}>
                              <td className="am-mono am-dim">{i + 1}</td>
                              <td className="am-query" title={row.query}>{row.query}</td>
                              <td className="am-mono">{parseInt(row.ejecuciones).toLocaleString()}</td>
                              <td className="am-mono">{parseFloat(row.tiempo_total_ms).toLocaleString()}</td>
                              <td className={`am-mono ${row.tiempo_promedio_ms > 1000 ? "am-text--warn" : ""}`}>
                                {row.tiempo_promedio_ms}
                              </td>
                              <td className="am-mono">{row.tiempo_max_ms}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>

                {/* ── Estado de tablas ── */}
                <Section title="Estado de tablas">
                  <div className="am-table-wrap">
                    <table className="am-table">
                      <thead>
                        <tr>
                          <th>Tabla</th>
                          <th>Filas vivas</th>
                          <th>Filas muertas</th>
                          <th>% muertas</th>
                          <th>Seq scans</th>
                          <th>Idx scans</th>
                          <th>Último autovacuum</th>
                          <th>Tamaño</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tablasMon.map((row, i) => {
                          const pct = parseFloat(row.pct_muertas);
                          return (
                            <tr key={i} className={pct > 20 ? "am-tr--warn" : ""}>
                              <td>
                                <span className="am-dim">{row.esquema}.</span>
                                <strong>{row.tabla}</strong>
                              </td>
                              <td className="am-mono">{parseInt(row.filas_vivas).toLocaleString()}</td>
                              <td className="am-mono">{parseInt(row.filas_muertas).toLocaleString()}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div className="am-mini-bar">
                                    <div
                                      className="am-mini-bar-fill"
                                      style={{
                                        width: `${Math.min(pct, 100)}%`,
                                        background: pct > 20 ? "var(--am-amber)" : "var(--am-green)",
                                      }}
                                    />
                                  </div>
                                  <span className={`am-mono ${pct > 20 ? "am-text--warn" : ""}`}>
                                    {row.pct_muertas}%
                                  </span>
                                </div>
                              </td>
                              <td className="am-mono">{parseInt(row.seq_scan).toLocaleString()}</td>
                              <td className="am-mono">{parseInt(row.idx_scan || 0).toLocaleString()}</td>
                              <td className="am-dim am-small">{row.ultimo_autovacuum || "Nunca"}</td>
                              <td className="am-mono">{row.tamaño}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}