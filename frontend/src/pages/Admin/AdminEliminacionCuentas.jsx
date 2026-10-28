import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "../../utils/auth";
import "../../styles/admin/AdminEliminacionCuentas.css";

const API_URL = import.meta.env.VITE_API_URL;
const BASE = `${API_URL}/api/admin/solicitudes-eliminacion`;

const FILTROS = [
  { valor: "PENDIENTE", texto: "Pendientes" },
  { valor: "ATENDIDA", texto: "Atendidas" },
  { valor: "RECHAZADA", texto: "Rechazadas" },
  { valor: "TODAS", texto: "Todas" },
];

const fecha = (v) =>
  v ? new Date(v).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const diasDesde = (v) => Math.floor((Date.now() - new Date(v).getTime()) / 86400000);

// Gestión de solicitudes de eliminación de cuenta (Google Play).
// Confirmar = anonimiza los datos personales del cliente (los pedidos y pagos se conservan).
function AdminEliminacionCuentas() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("PENDIENTE");
  const [mensaje, setMensaje] = useState(null); // { ok, texto }
  const [accion, setAccion] = useState(null); // { tipo: 'atender' | 'rechazar', solicitud }
  const [notas, setNotas] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  const cargar = async () => {
    try {
      const res = await fetch(BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      setSolicitudes(await res.json());
    } catch {
      setMensaje({ ok: false, texto: "No se pudieron cargar las solicitudes." });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const visibles = useMemo(
    () => (filtro === "TODAS" ? solicitudes : solicitudes.filter((s) => s.estado === filtro)),
    [solicitudes, filtro]
  );
  const conteo = (v) => (v === "TODAS" ? solicitudes.length : solicitudes.filter((s) => s.estado === v).length);

  const abrir = (tipo, solicitud) => {
    setNotas("");
    setAccion({ tipo, solicitud });
  };

  const confirmar = async () => {
    if (accion.tipo === "rechazar" && !notas.trim()) return;
    setTrabajando(true);
    try {
      const res = await fetch(`${BASE}/${accion.solicitud.id}/${accion.tipo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ notas: notas.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "No se pudo actualizar.");
      setMensaje({
        ok: true,
        texto:
          accion.tipo === "atender"
            ? `Solicitud #${accion.solicitud.id} atendida. Recuerda avisarle al cliente por correo.`
            : `Solicitud #${accion.solicitud.id} rechazada.`,
      });
      setAccion(null);
      await cargar();
    } catch (e) {
      setMensaje({ ok: false, texto: e.message });
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <div className="elim">
      <div className="elim-cabecera">
        <div>
          <h2>Eliminación de cuentas</h2>
          <p>Solicitudes hechas desde la app o desde la página pública. Plazo de atención: 30 días.</p>
        </div>
        <div className="elim-filtros">
          {FILTROS.map((f) => (
            <button key={f.valor} className={`elim-filtro ${filtro === f.valor ? "activo" : ""}`} onClick={() => setFiltro(f.valor)}>
              {f.texto} ({conteo(f.valor)})
            </button>
          ))}
        </div>
      </div>

      <div className="elim-aviso">
        <strong>Antes de confirmar:</strong> si la solicitud dice <em>"Por verificar"</em> (llegó desde la web), responde al
        correo del cliente para confirmar que él la pidió. Las marcadas como <em>"Verificada"</em> se pidieron con la sesión
        iniciada en la app. Al confirmar se borran su nombre, teléfono, domicilio, correo y contraseña; sus pedidos y pagos
        se conservan.
      </div>

      {mensaje && <div className={`elim-mensaje ${mensaje.ok ? "ok" : "error"}`}>{mensaje.texto}</div>}

      <div className="elim-tabla-caja">
        {cargando ? (
          <p className="elim-vacio">Cargando…</p>
        ) : visibles.length === 0 ? (
          <p className="elim-vacio">No hay solicitudes en esta sección.</p>
        ) : (
          <table className="elim-tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Motivo</th>
                <th>Origen</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((s) => {
                const dias = diasDesde(s.fecha_solicitud);
                return (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      <div>{s.usuario_id ? `${s.nombre ?? ""} ${s.apellido_paterno ?? ""}`.trim() : "Sin cuenta"}</div>
                      <div className="elim-sub">{s.correo}</div>
                      {!s.usuario_id && <div className="elim-sub">Este correo no está registrado</div>}
                    </td>
                    <td>{s.motivo || <span className="elim-sub">—</span>}</td>
                    <td>
                      <div>{s.origen === "APP" ? "App" : "Web"}</div>
                      <span className={`elim-pastilla ${s.verificada ? "ok" : "warn"}`}>
                        {s.verificada ? "Verificada" : "Por verificar"}
                      </span>
                    </td>
                    <td>
                      <div>{fecha(s.fecha_solicitud)}</div>
                      {s.estado === "PENDIENTE" && <div className="elim-sub">Hace {dias} {dias === 1 ? "día" : "días"}</div>}
                      {s.fecha_atendida && <div className="elim-sub">Atendida: {fecha(s.fecha_atendida)}</div>}
                    </td>
                    <td>
                      <span className={`elim-pastilla ${s.estado}`}>{s.estado.charAt(0) + s.estado.slice(1).toLowerCase()}</span>
                      {s.notas_admin && <div className="elim-sub">{s.notas_admin}</div>}
                    </td>
                    <td>
                      {s.estado === "PENDIENTE" ? (
                        <div className="elim-acciones">
                          <button className="elim-btn confirmar" onClick={() => abrir("atender", s)}>
                            Confirmar
                          </button>
                          <button className="elim-btn rechazar" onClick={() => abrir("rechazar", s)}>
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="elim-sub">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {accion && (
        <div className="elim-fondo" onClick={() => !trabajando && setAccion(null)}>
          <div className="elim-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{accion.tipo === "atender" ? "Confirmar eliminación" : "Rechazar solicitud"}</h3>
            <p>
              {accion.tipo === "atender"
                ? accion.solicitud.usuario_id
                  ? `Se borrarán los datos personales de ${accion.solicitud.correo} y ya no podrá iniciar sesión. Esta acción no se puede deshacer.`
                  : "Este correo no tiene cuenta. Solo se marcará la solicitud como atendida."
                : "Escribe el motivo (por ejemplo: no se pudo confirmar que el dueño del correo la pidió)."}
            </p>
            <textarea
              placeholder={accion.tipo === "atender" ? "Notas (opcional)" : "Motivo del rechazo (obligatorio)"}
              value={notas}
              maxLength={500}
              onChange={(e) => setNotas(e.target.value)}
            />
            <div className="elim-modal-botones">
              <button className="elim-btn rechazar" onClick={() => setAccion(null)} disabled={trabajando}>
                Volver
              </button>
              <button
                className="elim-btn confirmar"
                onClick={confirmar}
                disabled={trabajando || (accion.tipo === "rechazar" && !notas.trim())}
              >
                {trabajando ? "Guardando…" : accion.tipo === "atender" ? "Sí, eliminar datos" : "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEliminacionCuentas;
