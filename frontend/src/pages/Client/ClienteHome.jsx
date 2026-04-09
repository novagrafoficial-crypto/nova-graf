import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import "../../styles/client/ClientHome.css"; 

// ✅ 1. Definimos la URL base usando la variable de entorno
const API_BASE = import.meta.env.VITE_API_URL;
const API_CATALOGO = `${API_BASE}/api/catalogo`;

function ClienteHome() {
  const context = useOutletContext();
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPags, setTotalPags] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [catActiva, setCatActiva] = useState("");
  const inputRef = useRef(null);

  if (!context) return null;
  const { user } = context;

  // Categorías
  useEffect(() => {
    // ✅ 2. Usamos la ruta dinámica para categorías
    fetch(`${API_CATALOGO}/categorias`)
      .then(r => r.json())
      .then(d => setCategorias(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Productos
  const cargar = useCallback(async (b, cat, pag) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ pagina: pag, por_pagina: 12, orden: "reciente" });
      if (b) p.set("busqueda", b);
      if (cat) p.set("categoria_id", cat);
      
      // ✅ 3. Usamos la ruta dinámica para productos
      const r = await fetch(`${API_CATALOGO}/productos?${p}`);
      const d = await r.json();
      setProductos(d.productos || []);
      setTotal(d.total || 0);
      setTotalPags(d.total_paginas || 1);
    } catch {
      setProductos([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar(busqueda, catActiva, pagina);
  }, [busqueda, catActiva, pagina, cargar]);

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
    setPagina(1);
  };

  const abrirModal = async (id) => {
    try {
      // ✅ 4. Ruta dinámica para el detalle del producto
      const p = await fetch(`${API_CATALOGO}/productos/${id}`).then(r => r.json());
      setModal(p);
    } catch {}
  };

  return (
    <div className="ch-bg">
      {/* HERO */}
      <div className="ch-hero">
        <p className="ch-hero__greeting">Bienvenido, {user?.nombre} 👋</p>
        <h1 className="ch-hero__title">¿Qué deseas personalizar hoy?</h1>
        <p className="ch-hero__subtitle">
          {total > 0 && !loading ? `${total} productos disponibles` : "Explora nuestro catálogo"}
        </p>

        {/* Barra de búsqueda */}
        <div className="ch-search">
          <span className="ch-search__icon">🔍</span>
          <input
            ref={inputRef}
            value={busqueda}
            onChange={handleBusqueda}
            placeholder="Buscar productos..."
            className="ch-search__input"
          />
          {busqueda && (
            <button
              onClick={() => { setBusqueda(""); inputRef.current?.focus(); }}
              className="ch-search__clear"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => cargar(busqueda, catActiva, 1)}
            className="ch-search__button"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Tabs de categorías */}
      <div className="ch-tabs">
        {[{ id: "", nombre: "✨ Todos" }, ...categorias].map(c => {
          const activo = String(catActiva) === String(c.id);
          return (
            <button
              key={c.id}
              onClick={() => { setCatActiva(String(c.id)); setPagina(1); }}
              className={`ch-tab ${activo ? "ch-tab--active" : ""}`}
            >
              {c.nombre}
            </button>
          );
        })}
      </div>

      {/* Grid de productos */}
      <div className="ch-grid">
        {loading ? (
          <div className="ch-grid__container">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="ch-skeleton" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="ch-empty">
            <div className="ch-empty__icon">🔍</div>
            <h3 className="ch-empty__title">Sin resultados</h3>
            <p className="ch-empty__text">Intenta con otra búsqueda o categoría.</p>
            <button
              onClick={() => { setBusqueda(""); setCatActiva(""); }}
              className="ch-empty__button"
            >
              Ver todos
            </button>
          </div>
        ) : (
          <>
            <div className="ch-grid__container">
              {productos.map((p, i) => (
                <TarjetaCliente
                  key={p.id}
                  producto={p}
                  idx={i}
                  onClick={() => abrirModal(p.id)}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPags > 1 && (
              <div className="ch-pagination">
                <button
                  className="ch-pagination__button"
                  disabled={pagina === 1}
                  onClick={() => setPagina(p => p - 1)}
                >
                  ← Ant
                </button>
                {[...Array(totalPags)].map((_, i) => (
                  <button
                    key={i}
                    className={`ch-pagination__button ${pagina === i + 1 ? "ch-pagination__button--active" : ""}`}
                    onClick={() => setPagina(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="ch-pagination__button"
                  disabled={pagina === totalPags}
                  onClick={() => setPagina(p => p + 1)}
                >
                  Sig →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {modal && <ModalCliente producto={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

/* Tarjeta de producto */
function TarjetaCliente({ producto: p, idx, onClick }) {
  const API_BASE = import.meta.env.VITE_API_URL;
  const [hover, setHover] = useState(false);
  
  // ✅ 5. Ajuste de URL de imagen para Render
  const img = p.imagen_url?.startsWith("http") 
    ? p.imagen_url 
    : p.imagen_url ? `${API_BASE}${p.imagen_url}` : null;
    
  const precio = parseFloat(p.precio_min || p.precio_base || 0);

  const cardStyle = {
    animationDelay: `${idx * 0.05}s`,
  };

  return (
    <div
      className="ch-card"
      style={cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <div className="ch-card__image">
        {img ? (
          <img src={img} alt={p.nombre} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", opacity: 0.15 }}>
            🛍️
          </div>
        )}
        {p.categoria_nombre && (
          <span className="ch-card__badge">{p.categoria_nombre}</span>
        )}
      </div>

      <div className="ch-card__content">
        <h3 className="ch-card__title">{p.nombre}</h3>

        {p.colores?.length > 0 && (
          <div className="ch-card__colors">
            {p.colores.slice(0, 4).map(c => (
              <span key={c.id} className="ch-card__color">{c.nombre}</span>
            ))}
            {p.colores.length > 4 && (
              <span className="ch-card__color-more">+{p.colores.length - 4}</span>
            )}
          </div>
        )}

        <div className="ch-card__footer">
          <div>
            <span className="ch-card__price-label">Desde</span>
            <div className="ch-card__price">${precio.toFixed(2)}</div>
          </div>
          <span className="ch-card__action">Ver más →</span>
        </div>
      </div>
    </div>
  );
}

/* Modal de producto */
function ModalCliente({ producto: p, onClose }) {
  const API_BASE = import.meta.env.VITE_API_URL;
  const [varSel, setVarSel] = useState(p.variantes?.find(v => v.stock > 0) || p.variantes?.[0] || null);
  
  const img = (varSel?.imagen_url || p.imagen_url || "");
  // ✅ 6. Ajuste de URL de imagen en Modal para Render
  const imgSrc = img.startsWith("http") ? img : img ? `${API_BASE}${img}` : null;
  
  const precio = parseFloat(p.precio_base || 0) + parseFloat(varSel?.precio_adicional || 0);
  const WA = "521XXXXXXXXXX"; // Recuerda cambiar esto por tu número real
  const msg = `Hola NovaGraf 👋 Me interesa: *${p.nombre}*${varSel ? ` — ${varSel.sku || ""}` : ""} ¿Me pueden cotizar?`;

  return (
    <div className="ch-modal-overlay" onClick={onClose}>
      <div className="ch-modal" onClick={e => e.stopPropagation()}>
        <div className="ch-modal__image">
          {imgSrc ? (
            <img src={imgSrc} alt={p.nombre} />
          ) : (
            <span style={{ fontSize: "5rem", opacity: 0.15 }}>🛍️</span>
          )}
        </div>

        <div className="ch-modal__content">
          <div className="ch-modal__header">
            <span className="ch-modal__category">{p.categoria_nombre}</span>
            <button className="ch-modal__close" onClick={onClose}>✕</button>
          </div>

          <h2 className="ch-modal__title">{p.nombre}</h2>
          {p.descripcion && <p className="ch-modal__description">{p.descripcion}</p>}

          {p.colores?.length > 0 && (
            <div>
              <p className="ch-modal__section-title">Color</p>
              <div className="ch-modal__colors">
                {p.colores.map(c => {
                  const sel = varSel?.color_id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        const v = p.variantes?.find(v => v.color_id === c.id && v.stock > 0) || p.variantes?.find(v => v.color_id === c.id);
                        if (v) setVarSel(v);
                      }}
                      className={`ch-modal__color-btn ${sel ? "ch-modal__color-btn--selected" : ""}`}
                    >
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {p.variantes?.length > 0 && (
            <div>
              <p className="ch-modal__section-title">Variante</p>
              <div className="ch-modal__variants">
                {p.variantes.map(v => {
                  const sel = varSel?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => v.stock > 0 && setVarSel(v)}
                      className={`ch-modal__variant-btn ${sel ? "ch-modal__variant-btn--selected" : ""} ${v.stock === 0 ? "ch-modal__variant-btn--disabled" : ""}`}
                      disabled={v.stock === 0}
                    >
                      {v.sku}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="ch-modal__footer">
            <div className="ch-modal__price-row">
              <div>
                <div className="ch-modal__price-label">Precio</div>
                <div className="ch-modal__price">${precio.toFixed(2)}</div>
              </div>
              {varSel && (
                <span className={`ch-modal__stock ${varSel.stock > 0 ? "ch-modal__stock--available" : "ch-modal__stock--unavailable"}`}>
                  {varSel.stock > 0 ? `✓ ${varSel.stock} disponibles` : "✕ Sin stock"}
                </span>
              )}
            </div>
            <a
              href={`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`}
              target="_blank"
              rel="noreferrer"
              className="ch-modal__whatsapp"
            >
              💬 Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClienteHome;