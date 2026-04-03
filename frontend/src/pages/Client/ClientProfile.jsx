import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/client/ClientProfile.css";

/* ─────────────────────────────────────────────
   CAMPOS EDITABLES
   ───────────────────────────────────────────── */
const CAMPOS = [
  { label: "Nombre *",           name: "nombre",           required: true },
  { label: "Apellido Paterno *", name: "apellido_paterno", required: true },
  { label: "Apellido Materno",   name: "apellido_materno" },
  { label: "Nombre de usuario *",name: "nombre_usuario",   required: true },
  { label: "Fecha de nacimiento",name: "fecha_nacimiento", type: "date" },
  { label: "Domicilio",          name: "domicilio" },
  { label: "Teléfono",           name: "telefono" },
];

/* ─────────────────────────────────────────────
   OPCIONES DEL MENÚ LATERAL (similar a Mercado Libre)
   ───────────────────────────────────────────── */
const MENU = [
   { id: "mi-perfil",      icon: "👤", label: "Mi perfil"      },
  { id: "compras",        icon: "🛒", label: "Compras"        },
  { id: "ventas",         icon: "💰", label: "Ventas"         },
  { id: "facturacion",    icon: "🧾", label: "Facturación"    },
  { id: "historial",      icon: "📜", label: "Historial"      },
  { id: "configuracion",  icon: "⚙️", label: "Configuración"  },
];

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
   ───────────────────────────────────────────── */
function ClientProfile() {
  const navigate = useNavigate();
  const [user]    = useState(() => JSON.parse(localStorage.getItem("user")));

  const [profile,        setProfile]        = useState(null);
  const [form,           setForm]           = useState({});
  const [editing,        setEditing]        = useState(false); // modo edición detallada
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [message,        setMessage]        = useState({ text: "", ok: true });
  const [selectedOption, setSelectedOption] = useState("mi-perfil"); // por defecto Mi perfil

  // ── Cambio de contraseña
  const [pwForm, setPwForm]       = useState({ actual: "", nueva: "", confirmar: "" });
  const [pwMsg,  setPwMsg]        = useState({ text: "", ok: true });
  const [pwSaving, setPwSaving]   = useState(false);
  const [showPw,   setShowPw]     = useState(false);

  /* ── Carga del perfil ── */
  useEffect(() => {
    if (!user) { navigate("/"); return; }
    fetch(`http://localhost:5000/api/users/profile/${user.id_usuario}`)
      .then(r => r.json())
      .then(data => { setProfile(data); setForm(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const notify = (text, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage({ text: "", ok: true }), 3500);
  };

  /* ── Guardar perfil (edición detallada) ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`http://localhost:5000/api/users/profile/${user.id_usuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setForm(data.user);
        setEditing(false);
        localStorage.setItem("user", JSON.stringify({ ...user, nombre: data.user.nombre }));
        notify("✅ Perfil actualizado correctamente");
      } else {
        notify("❌ " + data.message, false);
      }
    } catch {
      notify("❌ Error de conexión", false);
    }
    setSaving(false);
  };

  /* ── Cambiar contraseña ── */
  const handlePasswordSave = async () => {
    if (pwForm.nueva !== pwForm.confirmar) {
      setPwMsg({ text: "❌ Las contraseñas nuevas no coinciden", ok: false });
      return;
    }
    if (pwForm.nueva.length < 6) {
      setPwMsg({ text: "❌ Mínimo 6 caracteres", ok: false });
      return;
    }
    setPwSaving(true);
    try {
      const res  = await fetch(`http://localhost:5000/api/users/profile/${user.id_usuario}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual: pwForm.actual, nueva: pwForm.nueva }),
      });
      const data = await res.json();
      const ok   = res.ok;
      setPwMsg({ text: (ok ? "✅ " : "❌ ") + data.message, ok });
      if (ok) { setPwForm({ actual: "", nueva: "", confirmar: "" }); setShowPw(false); }
    } catch {
      setPwMsg({ text: "❌ Error de conexión", ok: false });
    }
    setTimeout(() => setPwMsg({ text: "", ok: true }), 3500);
    setPwSaving(false);
  };

  const handleLogout = () => { localStorage.removeItem("user"); navigate("/"); };

  /* ── Guards de carga ── */
  if (loading) return <div className="cp-loading">Cargando perfil…</div>;
  if (!profile) return <div className="cp-loading">No se pudo cargar el perfil.</div>;

  const esGoogle = profile.proveedor === "google";

  /* ======================================================
     RENDERIZADO DE CONTENIDO SEGÚN OPCIÓN SELECCIONADA
  ====================================================== */
  const renderContent = () => {
    // Si está en modo edición detallada (desde "Mi perfil" -> botón Editar)
    if (selectedOption === "mi-perfil" && editing) {
      return renderEditProfile();
    }

    switch (selectedOption) {
      case "mi-perfil":
        return renderDashboard(); // Vista tipo Mercado Libre con tarjetas
      case "compras":
        return (
          <div className="cp-card">
            <h2 className="cp-card__title">Compras activas</h2>
            {[
              { id: 1, fecha: "2026-03-15", total: "$450",   estado: "En proceso" },
              { id: 2, fecha: "2026-03-10", total: "$1,200", estado: "Enviado"    },
            ].map(p => <PedidoRow key={p.id} pedido={p} />)}
          </div>
        );
      case "historial": // Lo agregamos aunque no esté en el menú, por si acaso
        return (
          <div className="cp-card">
            <h2 className="cp-card__title">Historial de compras</h2>
            {[
              { id: 3, fecha: "2026-02-28", total: "$320", estado: "Entregado" },
              { id: 4, fecha: "2026-02-14", total: "$890", estado: "Entregado" },
            ].map(p => <PedidoRow key={p.id} pedido={p} />)}
          </div>
        );
      // Para las demás opciones (ventas, marketing, etc.) mostramos un placeholder
      default:
        return (
          <div className="cp-card">
            <h2 className="cp-card__title">{MENU.find(o => o.id === selectedOption)?.label}</h2>
            <div className="cp-empty-section">
              <span>🚧</span>
              <p>Sección en construcción</p>
            </div>
          </div>
        );
    }
  };

  /* ── Vista Dashboard  ── */
  const renderDashboard = () => {
    return (
      <>
        {/* Banner de dirección (si tiene domicilio) */}
        {profile.domicilio && (
          <div className="cp-address-banner">
            <span className="cp-address-icon">📍</span>
            <div>
              <strong>Enviar a {profile.nombre}</strong>
              <p>{profile.domicilio} {profile.codigo_postal ? `CP ${profile.codigo_postal}` : ''}</p>
            </div>
          </div>
        )}

        {/* Tarjeta: Modifica tu contraseña (solo si no es Google) */}
        {!esGoogle && (
          <div className="cp-card cp-card--simple">
            <div className="cp-card__header-simple">
              <span>🔒 Modifica tu contraseña y mantén tu cuenta segura</span>
              <button className="cp-btn-link" onClick={() => setShowPw(true)}>Modificar</button>
            </div>
            {showPw && (
              <div className="cp-pw-mini">
                <input
                  type="password"
                  placeholder="Contraseña actual"
                  value={pwForm.actual}
                  onChange={e => setPwForm({ ...pwForm, actual: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={pwForm.nueva}
                  onChange={e => setPwForm({ ...pwForm, nueva: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Confirmar nueva"
                  value={pwForm.confirmar}
                  onChange={e => setPwForm({ ...pwForm, confirmar: e.target.value })}
                />
                <div className="cp-pw-actions">
                  <button className="cp-btn cp-btn--primary" onClick={handlePasswordSave} disabled={pwSaving}>
                    Guardar
                  </button>
                  <button className="cp-btn-link" onClick={() => setShowPw(false)}>Cancelar</button>
                </div>
                {pwMsg.text && <p className={`cp-inline-msg ${pwMsg.ok ? "cp-inline-msg--ok" : "cp-inline-msg--err"}`}>{pwMsg.text}</p>}
              </div>
            )}
          </div>
        )}

        {/* Tarjeta: Tu información */}
        <div className="cp-card cp-card--simple">
          <div className="cp-card__header-simple">
            <span>📋 Tu información</span>
            <button className="cp-btn-link" onClick={() => setEditing(true)}>Editar</button>
          </div>
          <p className="cp-card-text">Nombre elegido y datos para identificarte.</p>
          <div className="cp-mini-info">
            <p><strong>Nombre:</strong> {profile.nombre} {profile.apellido_paterno} {profile.apellido_materno}</p>
            <p><strong>Usuario:</strong> {profile.nombre_usuario}</p>
            <p><strong>Email:</strong> {profile.correo_electronico}</p>
            {profile.fecha_nacimiento && <p><strong>Nacimiento:</strong> {new Date(profile.fecha_nacimiento).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* Tarjeta: Datos de tu cuenta */}
        <div className="cp-card cp-card--simple">
          <div className="cp-card__header-simple">
            <span>🏦 Datos de tu cuenta</span>
            <span className="cp-badge">{esGoogle ? 'Google' : 'Local'}</span>
          </div>
          <p className="cp-card-text">Datos que representan a la cuenta en NovaGraf.</p>
        </div>

        {/* Tarjeta: Tarjetas guardadas */}
        <div className="cp-card cp-card--simple">
          <div className="cp-card__header-simple">
            <span>💳 Tarjetas</span>
            <button className="cp-btn-link">Administrar</button>
          </div>
          <p className="cp-card-text">Tarjetas guardadas en tu cuenta.</p>
        </div>

        {/* Tarjeta: Direcciones */}
        <div className="cp-card cp-card--simple">
          <div className="cp-card__header-simple">
            <span>🏠 Direcciones</span>
            <button className="cp-btn-link">Administrar</button>
          </div>
          <p className="cp-card-text">Direcciones guardadas en tu cuenta.</p>
          {profile.domicilio && (
            <div className="cp-mini-info">
              <p><strong>Principal:</strong> {profile.domicilio}</p>
            </div>
          )}
        </div>

        {message.text && (
          <p className={`cp-inline-msg ${message.ok ? "cp-inline-msg--ok" : "cp-inline-msg--err"}`}>
            {message.text}
          </p>
        )}
      </>
    );
  };

  /* ── Vista de edición detallada (formulario completo) ── */
  const renderEditProfile = () => {
    return (
      <div className="cp-card">
        <div className="cp-card__header">
          <div>
            <h2 className="cp-card__title">Editar información personal</h2>
            <p className="cp-card__sub">
              {esGoogle ? "Cuenta vinculada con Google — el correo no es editable" : "Cuenta local — mantén tus datos actualizados"}
            </p>
          </div>
          <div className="cp-btn-group">
            <button className="cp-btn cp-btn--success" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "💾 Guardar"}
            </button>
            <button className="cp-btn cp-btn--ghost" onClick={() => { setEditing(false); setForm(profile); }}>
              Cancelar
            </button>
          </div>
        </div>

        <span className={`cp-badge-prov ${esGoogle ? "cp-badge-prov--google" : "cp-badge-prov--local"}`}>
          {esGoogle ? "🔗 Cuenta Google" : "🔑 Cuenta local"}
        </span>

        <div className="cp-fields">
          {CAMPOS.map(({ label, name, type = "text", required }) => (
            <div key={name} className="cp-field">
              <label className="cp-field__label">{label}</label>
              <input
                className="cp-field__input"
                type={type}
                name={name}
                value={
                  type === "date" && form[name]
                    ? form[name].split("T")[0]
                    : form[name] || ""
                }
                onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
                required={required}
              />
            </div>
          ))}

          <div className="cp-field">
            <label className="cp-field__label">Correo electrónico</label>
            <p className="cp-field__value">
              {profile.correo_electronico}
              <span className="cp-tag cp-tag--gray">no editable</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cp-layout">
      {/* SIDEBAR */}
      <aside className="cp-sidebar">
        <div className="cp-sidebar__user">
          <div className="cp-sidebar__avatar">
            {profile.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="cp-sidebar__info">
            <p className="cp-sidebar__name">
              {profile.nombre} {profile.apellido_paterno}
            </p>
            <p className="cp-sidebar__email">{profile.correo_electronico}</p>
            <span className={`cp-sidebar__tag ${esGoogle ? "cp-sidebar__tag--google" : "cp-sidebar__tag--local"}`}>
              {esGoogle ? "Google" : "Local"}
            </span>
          </div>
        </div>

        <nav className="cp-sidebar__nav">
          {MENU.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`cp-sidebar__item ${selectedOption === id ? "cp-sidebar__item--active" : ""}`}
              onClick={() => {
                setSelectedOption(id);
                setEditing(false); // salir del modo edición si se cambia de sección
              }}
            >
              <span className="cp-sidebar__icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <button className="cp-sidebar__logout" onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="cp-main">
        {renderContent()}
      </main>
    </div>
  );
}

/* ── Sub-componente pedido (reutilizable) ── */
function PedidoRow({ pedido: p }) {
  const badge = {
    "En proceso": "cp-badge--yellow",
    "Enviado":    "cp-badge--blue",
    "Entregado":  "cp-badge--green",
  }[p.estado] || "cp-badge--gray";

  return (
    <div className="cp-order">
      <div>
        <p className="cp-order__id">Pedido #{p.id}</p>
        <p className="cp-order__date">{p.fecha}</p>
      </div>
      <div className="cp-order__right">
        <p className="cp-order__total">{p.total}</p>
        <span className={`cp-badge ${badge}`}>{p.estado}</span>
      </div>
    </div>
  );
}

export default ClientProfile;