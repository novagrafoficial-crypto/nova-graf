import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

const CAMPOS = [
  { label: "Nombre *",            name: "nombre",           required: true },
  { label: "Apellido Paterno *",  name: "apellido_paterno", required: true },
  { label: "Apellido Materno",    name: "apellido_materno"  },
  { label: "Nombre de usuario *", name: "nombre_usuario",   required: true },
  { label: "Fecha de nacimiento", name: "fecha_nacimiento", type: "date"   },
  { label: "Domicilio",           name: "domicilio"         },
  { label: "Teléfono",            name: "telefono"          },
];

function MiPerfil() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("user"));

  const [profile,       setProfile]       = useState(null);
  const [form,          setForm]          = useState({});
  const [editing,       setEditing]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [message,       setMessage]       = useState({ text: "", ok: true });
  const [pwForm,        setPwForm]        = useState({ actual: "", nueva: "", confirmar: "" });
  const [pwMsg,         setPwMsg]         = useState({ text: "", ok: true });
  const [pwSaving,      setPwSaving]      = useState(false);
  const [showPw,        setShowPw]        = useState(false);
  const [showActual,    setShowActual]    = useState(false);
  const [showNueva,     setShowNueva]     = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const notify = (text, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage({ text: "", ok: true }), 3500);
  };

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    fetch(`${API_BASE}/api/users/profile/${user.id_usuario}`)
      .then(r => r.json())
      .then(data => { setProfile(data); setForm(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/users/profile/${user.id_usuario}`, {
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
    } catch { notify("❌ Error de conexión", false); }
    setSaving(false);
  };

  const handlePasswordSave = async () => {
    if (pwForm.nueva !== pwForm.confirmar) {
      setPwMsg({ text: "❌ Las contraseñas no coinciden", ok: false }); return;
    }
    if (pwForm.nueva.length < 6) {
      setPwMsg({ text: "❌ Mínimo 6 caracteres", ok: false }); return;
    }
    setPwSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/users/profile/${user.id_usuario}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual: pwForm.actual, nueva: pwForm.nueva }),
      });
      const data = await res.json();
      setPwMsg({ text: (res.ok ? "✅ " : "❌ ") + data.message, ok: res.ok });
      if (res.ok) { setPwForm({ actual: "", nueva: "", confirmar: "" }); setShowPw(false); }
    } catch { setPwMsg({ text: "❌ Error de conexión", ok: false }); }
    setTimeout(() => setPwMsg({ text: "", ok: true }), 3500);
    setPwSaving(false);
  };

  if (loading)  return <p className="cp-loading-inline">Cargando perfil…</p>;
  if (!profile) return <p className="cp-loading-inline">No se pudo cargar el perfil.</p>;

  const esGoogle = profile.proveedor === "google";

  if (editing) return (
    <div className="cp-card">
      <div className="cp-card__header">
        <div>
          <h2 className="cp-card__title">Editar información personal</h2>
          <p className="cp-card__sub">
            {esGoogle ? "Cuenta Google — correo no editable" : "Mantén tus datos actualizados"}
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
      <div className="cp-fields">
        {CAMPOS.map(({ label, name, type = "text", required }) => (
          <div key={name} className="cp-field">
            <label className="cp-field__label">{label}</label>
            <input
              className="cp-field__input"
              type={type}
              name={name}
              value={type === "date" && form[name] ? form[name].split("T")[0] : form[name] || ""}
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
      {message.text && (
        <p className={`cp-inline-msg ${message.ok ? "cp-inline-msg--ok" : "cp-inline-msg--err"}`}>
          {message.text}
        </p>
      )}
    </div>
  );

  return (
    <>
      {message.text && (
        <div className={`cp-toast ${message.ok ? "cp-toast--ok" : "cp-toast--err"}`}>
          {message.text}
        </div>
      )}

      {profile.domicilio && (
        <div className="cp-address-banner">
          <span className="cp-address-icon">📍</span>
          <div>
            <strong>Enviar a {profile.nombre}</strong>
            <p>{profile.domicilio} {profile.codigo_postal ? `CP ${profile.codigo_postal}` : ""}</p>
          </div>
        </div>
      )}

      {!esGoogle && (
        <div className="cp-card cp-card--simple">
          <div className="cp-card__header-simple">
            <span>🔒 Modifica tu contraseña y mantén tu cuenta segura</span>
            <button className="cp-btn-link" onClick={() => setShowPw(true)}>Modificar</button>
          </div>
          {showPw && (
            <div className="cp-pw-mini">
              {[
                { key: "actual",    label: "Contraseña actual", show: showActual,    toggle: () => setShowActual(v => !v)    },
                { key: "nueva",     label: "Nueva contraseña",  show: showNueva,     toggle: () => setShowNueva(v => !v)     },
                { key: "confirmar", label: "Confirmar nueva",   show: showConfirmar, toggle: () => setShowConfirmar(v => !v) },
              ].map(({ key, label, show, toggle }) => (
                <div key={key} className="cp-pw-input-wrapper">
                  <input
                    type={show ? "text" : "password"}
                    placeholder={label}
                    value={pwForm[key]}
                    onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                  />
                  <button type="button" className="cp-pw-toggle" onClick={toggle} tabIndex={-1}>
                    {show ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              ))}
              <div className="cp-pw-actions">
                <button className="cp-btn cp-btn--primary" onClick={handlePasswordSave} disabled={pwSaving}>
                  {pwSaving ? "Guardando…" : "Guardar"}
                </button>
                <button className="cp-btn-link" onClick={() => setShowPw(false)}>Cancelar</button>
              </div>
              {pwMsg.text && (
                <p className={`cp-inline-msg ${pwMsg.ok ? "cp-inline-msg--ok" : "cp-inline-msg--err"}`}>
                  {pwMsg.text}
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
          {profile.fecha_nacimiento && (
            <p><strong>Nacimiento:</strong> {new Date(profile.fecha_nacimiento).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </>
  );
}

export default MiPerfil;