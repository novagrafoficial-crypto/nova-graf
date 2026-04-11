// frontend/src/pages/client/ClientProfile.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getToken } from "../../utils/auth";
import "../../styles/client/Clientprofile.css";

const API_BASE = import.meta.env.VITE_API_URL;

const CAMPOS = [
  { label: "Nombre *",           name: "nombre",           required: true },
  { label: "Apellido Paterno *", name: "apellido_paterno", required: true },
  { label: "Apellido Materno",   name: "apellido_materno" },
  { label: "Nombre de usuario *",name: "nombre_usuario",   required: true },
  { label: "Fecha de nacimiento",name: "fecha_nacimiento", type: "date" },
  { label: "Domicilio",          name: "domicilio" },
  { label: "Teléfono",           name: "telefono" },
];

const MENU = [
  { id: "mi-perfil",      icon: "👤", label: "Mi perfil"      },
  { id: "mis-disenos",    icon: "🎨", label: "Mis diseños"    },
  { id: "compras",        icon: "🛒", label: "Compras"        },
  { id: "ventas",         icon: "💰", label: "Ventas"         },
  { id: "facturacion",    icon: "🧾", label: "Facturación"    },
  { id: "historial",      icon: "📜", label: "Historial"      },
  { id: "configuracion",  icon: "⚙️", label: "Configuración"  },
];

// ========== COMPONENTE PARA MOSTRAR PEDIDOS ==========
function PedidosUsuario() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedidos = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/client/pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPedidos(data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend no disponible, usando simulación");
      }

      const stored = localStorage.getItem('pedidos_simulados');
      const pedidosSimulados = stored ? JSON.parse(stored) : [];
      pedidosSimulados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setPedidos(pedidosSimulados);
      setLoading(false);
    };

    fetchPedidos();
  }, []);

  if (loading) return <p>Cargando tus compras...</p>;

  if (pedidos.length === 0) {
    return (
      <div className="cp-empty-section">
        <span>🛒</span>
        <p>No has realizado ninguna compra aún.</p>
      </div>
    );
  }

  return (
    <div className="cp-pedidos-list">
      {pedidos.map((pedido) => (
        <div key={pedido.id} className="cp-pedido-card">
          <div className="cp-pedido-header">
            <span className="cp-pedido-id">Pedido #{pedido.id}</span>
            <span className="cp-pedido-fecha">
              {new Date(pedido.fecha).toLocaleDateString('es-MX')}
            </span>
            <span className={`cp-pedido-estado ${pedido.estado?.toLowerCase()}`}>
              {pedido.estado || 'Completado'}
            </span>
          </div>
          <div className="cp-pedido-items">
            {pedido.items.map((item, idx) => (
              <div key={idx} className="cp-pedido-item">
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="cp-pedido-item-img"
                  onError={(e) => (e.target.src = '/placeholder.png')}
                />
                <div className="cp-pedido-item-info">
                  <h4>{item.nombre}</h4>
                  <p>Cantidad: {item.cantidad}</p>
                  <p>Precio unitario: ${Number(item.precio_unitario).toFixed(2)}</p>
                  {item.texto_personalizado && (
                    <p className="cp-pedido-item-texto">Texto: {item.texto_personalizado}</p>
                  )}
                </div>
                <div className="cp-pedido-item-total">
                  ${(item.cantidad * Number(item.precio_unitario)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="cp-pedido-footer">
            <div className="cp-pedido-total">
              Total: <strong>${Number(pedido.total).toFixed(2)}</strong>
            </div>
            <div className="cp-pedido-entrega">
              Entrega: {pedido.forma_entrega === 'domicilio' ? '🚚 Domicilio' :
                        pedido.forma_entrega === 'punto_entrega' ? '📦 Punto de entrega' :
                        '🏬 Retiro en tienda'}
            </div>
            <div className="cp-pedido-pago">
              Pago: {pedido.forma_pago === 'tarjeta' ? '💳 Tarjeta' :
                     pedido.forma_pago === 'transferencia' ? '🏦 Transferencia' :
                     '💰 Depósito'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ========== COMPONENTE PRINCIPAL ==========
function ClientProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", ok: true });
  const [selectedOption, setSelectedOption] = useState(() => {
    return location.state?.activeTab || "mi-perfil";
  });

  const [pwForm, setPwForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [pwMsg, setPwMsg] = useState({ text: "", ok: true });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  
  // Estados para el ojito
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    fetch(`${API_BASE}/api/users/profile/${user.id_usuario}`)
      .then(r => r.json())
      .then(data => { setProfile(data); setForm(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const notify = (text, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage({ text: "", ok: true }), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/profile/${user.id_usuario}`, {
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
      const res = await fetch(`${API_BASE}/api/users/profile/${user.id_usuario}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual: pwForm.actual, nueva: pwForm.nueva }),
      });
      const data = await res.json();
      const ok = res.ok;
      setPwMsg({ text: (ok ? "✅ " : "❌ ") + data.message, ok });
      if (ok) { setPwForm({ actual: "", nueva: "", confirmar: "" }); setShowPw(false); }
    } catch {
      setPwMsg({ text: "❌ Error de conexión", ok: false });
    }
    setTimeout(() => setPwMsg({ text: "", ok: true }), 3500);
    setPwSaving(false);
  };

  const handleLogout = () => { localStorage.removeItem("user"); localStorage.removeItem("token"); navigate("/"); };

  if (loading) return <div className="cp-loading">Cargando perfil…</div>;
  if (!profile) return <div className="cp-loading">No se pudo cargar el perfil.</div>;

  const esGoogle = profile.proveedor === "google";

  const renderContent = () => {
    if (selectedOption === "mi-perfil" && editing) {
      return renderEditProfile();
    }

    switch (selectedOption) {
      case "mi-perfil":
        return renderDashboard();
      case "mis-disenos":
        return <MisDisenos />;
      case "compras":
        return (
          <div className="cp-card">
            <h2 className="cp-card__title">Mis compras</h2>
            <PedidosUsuario />
          </div>
        );
      case "historial":
        return (
          <div className="cp-card">
            <h2 className="cp-card__title">Historial de compras</h2>
            <PedidosUsuario />
          </div>
        );
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

  const renderDashboard = () => {
    return (
      <>
        {profile.domicilio && (
          <div className="cp-address-banner">
            <span className="cp-address-icon">📍</span>
            <div>
              <strong>Enviar a {profile.nombre}</strong>
              <p>{profile.domicilio} {profile.codigo_postal ? `CP ${profile.codigo_postal}` : ''}</p>
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
                <div className="cp-pw-input-wrapper">
                  <input 
                    type={showActual ? "text" : "password"} 
                    placeholder="Contraseña actual" 
                    value={pwForm.actual} 
                    onChange={e => setPwForm({ ...pwForm, actual: e.target.value })} 
                  />
                  <button 
                    type="button" 
                    className="cp-pw-toggle" 
                    onClick={() => setShowActual(!showActual)}
                    tabIndex={-1}
                  >
                    {showActual ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
                <div className="cp-pw-input-wrapper">
                  <input 
                    type={showNueva ? "text" : "password"} 
                    placeholder="Nueva contraseña" 
                    value={pwForm.nueva} 
                    onChange={e => setPwForm({ ...pwForm, nueva: e.target.value })} 
                  />
                  <button 
                    type="button" 
                    className="cp-pw-toggle" 
                    onClick={() => setShowNueva(!showNueva)}
                    tabIndex={-1}
                  >
                    {showNueva ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
                <div className="cp-pw-input-wrapper">
                  <input 
                    type={showConfirmar ? "text" : "password"} 
                    placeholder="Confirmar nueva" 
                    value={pwForm.confirmar} 
                    onChange={e => setPwForm({ ...pwForm, confirmar: e.target.value })} 
                  />
                  <button 
                    type="button" 
                    className="cp-pw-toggle" 
                    onClick={() => setShowConfirmar(!showConfirmar)}
                    tabIndex={-1}
                  >
                    {showConfirmar ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
                <div className="cp-pw-actions">
                  <button className="cp-btn cp-btn--primary" onClick={handlePasswordSave} disabled={pwSaving}>Guardar</button>
                  <button className="cp-btn-link" onClick={() => setShowPw(false)}>Cancelar</button>
                </div>
                {pwMsg.text && <p className={`cp-inline-msg ${pwMsg.ok ? "cp-inline-msg--ok" : "cp-inline-msg--err"}`}>{pwMsg.text}</p>}
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
            {profile.fecha_nacimiento && <p><strong>Nacimiento:</strong> {new Date(profile.fecha_nacimiento).toLocaleDateString()}</p>}
          </div>
        </div>
      </>
    );
  };

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
            <p className="cp-field__value">{profile.correo_electronico} <span className="cp-tag cp-tag--gray">no editable</span></p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cp-layout">
      <aside className="cp-sidebar">
        <div className="cp-sidebar__user">
          <div className="cp-sidebar__avatar">{profile.nombre?.charAt(0).toUpperCase()}</div>
          <div className="cp-sidebar__info">
            <p className="cp-sidebar__name">{profile.nombre} {profile.apellido_paterno}</p>
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
              onClick={() => { setSelectedOption(id); setEditing(false); }}
            >
              <span className="cp-sidebar__icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <button className="cp-sidebar__logout" onClick={handleLogout}>🚪 Cerrar sesión</button>
      </aside>
      <main className="cp-main">{renderContent()}</main>
    </div>
  );
}

// ========== COMPONENTE MIS DISEÑOS ==========
function MisDisenos() {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDisenos = async () => {
    try {
      const token = getToken();
      if (!token) { setError('No has iniciado sesión'); setLoading(false); return; }
      const res = await axios.get(`${API_BASE}/api/client/borradores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisenos(res.data);
    } catch (err) {
      setError('No se pudieron cargar tus diseños');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisenos(); }, []);

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este diseño?')) return;
    const token = getToken();
    try {
      await axios.delete(`${API_BASE}/api/client/borradores/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisenos(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const handleEditar = (diseno) => {
    navigate(`/cliente/producto/${diseno.producto_id}/personalizar`, {
      state: {
        imagenProducto: diseno.variante_imagen || '',
        productoId: diseno.producto_id,
        variante: { 
          id: diseno.variante_id, 
          imagen_url: diseno.variante_imagen, 
          color: diseno.variante_color 
        },
        borradorId: diseno.id,
        elementosGuardados: diseno.elementos,
      }
    });
  };

  const handleAgregarAlCarrito = async (diseno) => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    try {
      const textoPersonalizado = diseno.elementos
        ?.filter(el => el.tipo === 'texto')
        .map(t => t.contenido)
        .join(' | ') || '';
      
      const precioAdicionalPersonalizacion = 50;
      const precioBase = parseFloat(diseno.precio_base || 0);
      const precioAdicionalVariante = parseFloat(diseno.precio_adicional || 0);
      const precioUnitario = precioBase + precioAdicionalVariante + precioAdicionalPersonalizacion;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        variante_id: diseno.variante_id,
        texto_personalizado: textoPersonalizado,
        imagen_personalizada_url: diseno.imagen_preview,
        precio_adicional: precioAdicionalPersonalizacion,
        precio_unitario: precioUnitario,
        cantidad: 1,
      };

      await axios.post(`${API_BASE}/api/client/carrito`, payload, config);
      alert('🛒 ¡Producto agregado a tu carrito!');
      navigate('/cliente/carrito');
    } catch (err) {
      alert('❌ No se pudo agregar al carrito.');
    }
  };

  if (loading) return <div className="cp-card"><p>Cargando diseños...</p></div>;
  if (error) return <div className="cp-card"><p className="error">{error}</p></div>;

  return (
    <div className="cp-card">
      <h2 className="cp-card__title">Mis diseños guardados</h2>
      {disenos.length === 0 ? (
        <div className="cp-empty-section">
          <span>🎨</span>
          <p>Aún no tienes diseños guardados.</p>
        </div>
      ) : (
        <div className="disenos-grid">
          {disenos.map(d => {
            const imgPreview = d.imagen_preview?.startsWith("http") 
                ? d.imagen_preview 
                : d.imagen_preview ? `${API_BASE}${d.imagen_preview}` : null;
            
            const imgVariante = d.variante_imagen?.startsWith("http") 
                ? d.variante_imagen 
                : d.variante_imagen ? `${API_BASE}${d.variante_imagen}` : null;

            return (
              <div key={d.id} className="diseno-card">
                <div className="diseno-card__img">
                  <img src={imgPreview || imgVariante} alt={d.nombre || 'Diseño'} />
                </div>
                <div className="diseno-card__info">
                  <h3>{d.nombre || 'Sin nombre'}</h3>
                  <p>Producto: {d.producto_nombre}</p>
                  <p className="diseno-card__date">
                    {new Date(d.fecha_modificacion).toLocaleDateString()}
                  </p>
                </div>
                <div className="diseno-card__actions">
                  <button className="cp-btn cp-btn--small" onClick={() => handleEditar(d)}>✏️ Editar</button>
                  <button className="cp-btn cp-btn--small" onClick={() => handleAgregarAlCarrito(d)}>🛒 Agregar</button>
                  <button className="cp-btn cp-btn--small cp-btn--danger" onClick={() => handleEliminar(d.id)}>🗑️ Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClientProfile;