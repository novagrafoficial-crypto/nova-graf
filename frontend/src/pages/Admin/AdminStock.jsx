import React, { useState } from 'react';
import '../../styles/admin/AdminStock.css'; // Opcional: puedes usar el mismo CSS de la versión HTML o modularizado

// ✅ URL dinámica con fallback para desarrollo local
const API_BASE = import.meta.env.VITE_API_URL;

// --- Datos Mock (fallback si la API no responde) ---
const ventasMock = [
  { id: 1001, fecha: "2025-02-18", producto: "Laptop Gamer XT", cantidad: 2, total: 2799.98 },
  { id: 1002, fecha: "2025-02-19", producto: "Mouse Inalámbrico", cantidad: 5, total: 149.95 },
  { id: 1003, fecha: "2025-02-20", producto: "Monitor 24'' 4K", cantidad: 1, total: 389.99 },
  { id: 1004, fecha: "2025-02-21", producto: "Teclado Mecánico RGB", cantidad: 3, total: 179.97 },
  { id: 1005, fecha: "2025-02-22", producto: "SSD 1TB NVMe", cantidad: 4, total: 399.96 },
  { id: 1006, fecha: "2025-02-23", producto: "Auriculares Bluetooth", cantidad: 6, total: 239.94 },
  { id: 1007, fecha: "2025-02-24", producto: "Tableta Gráfica", cantidad: 1, total: 159.99 }
];

const comprasMock = [
  { id: 2001, fecha: "2025-02-10", proveedor: "TecnoDist S.A.", producto: "Procesadores Ryzen 7", cantidad: 15, total: 3749.85 },
  { id: 2002, fecha: "2025-02-12", proveedor: "Componentes Global", producto: "Memorias RAM 16GB", cantidad: 30, total: 1799.70 },
  { id: 2003, fecha: "2025-02-14", proveedor: "LogiTech Supplies", producto: "Mouse Oficina", cantidad: 50, total: 499.50 },
  { id: 2004, fecha: "2025-02-17", proveedor: "PantallasWorld", producto: "Monitores 27''", cantidad: 8, total: 2399.92 },
  { id: 2005, fecha: "2025-02-19", proveedor: "Almacenamiento Express", producto: "Discos HDD 2TB", cantidad: 20, total: 1199.80 },
  { id: 2006, fecha: "2025-02-21", proveedor: "Baterías & Más", producto: "Power banks 20000mAh", cantidad: 40, total: 1199.60 },
  { id: 2007, fecha: "2025-02-22", proveedor: "OfficeTech", producto: "Sillas Ergonómicas", cantidad: 5, total: 1249.95 }
];

const inventarioMock = [
  { id: 3001, producto: "Laptop Gamer XT", categoria: "Computadoras", stock: 12, precio: 1399.99 },
  { id: 3002, producto: "Mouse Inalámbrico", categoria: "Periféricos", stock: 84, precio: 29.99 },
  { id: 3003, producto: "Monitor 24'' 4K", categoria: "Monitores", stock: 7, precio: 389.99 },
  { id: 3004, producto: "Teclado Mecánico RGB", categoria: "Periféricos", stock: 23, precio: 59.99 },
  { id: 3005, producto: "SSD 1TB NVMe", categoria: "Almacenamiento", stock: 41, precio: 99.99 },
  { id: 3006, producto: "Auriculares Bluetooth", categoria: "Audio", stock: 32, precio: 39.99 },
  { id: 3007, producto: "Tableta Gráfica", categoria: "Creatividad", stock: 9, precio: 159.99 },
  { id: 3008, producto: "Procesador Ryzen 7", categoria: "Componentes", stock: 14, precio: 249.99 },
  { id: 3009, producto: "Memoria RAM 16GB", categoria: "Componentes", stock: 28, precio: 59.99 },
  { id: 3010, producto: "Silla Ergonómica", categoria: "Mobiliario", stock: 4, precio: 249.99 }
];

// Definición de columnas para cada tabla
const columnDefinitions = {
  ventas: [
    { key: "id", label: "ID Venta" },
    { key: "fecha", label: "Fecha" },
    { key: "producto", label: "Producto" },
    { key: "cantidad", label: "Cantidad" },
    { key: "total", label: "Total (USD)", format: (val) => `$${val.toFixed(2)}` }
  ],
  compras: [
    { key: "id", label: "ID Compra" },
    { key: "fecha", label: "Fecha" },
    { key: "proveedor", label: "Proveedor" },
    { key: "producto", label: "Producto" },
    { key: "cantidad", label: "Cantidad" },
    { key: "total", label: "Total (USD)", format: (val) => `$${val.toFixed(2)}` }
  ],
  inventario: [
    { key: "id", label: "ID Prod." },
    { key: "producto", label: "Producto" },
    { key: "categoria", label: "Categoría" },
    { key: "stock", label: "Stock (unidades)" },
    { key: "precio", label: "Precio Unitario", format: (val) => `$${val.toFixed(2)}` }
  ]
};

const AdminStock = () => {
  const [currentSection, setCurrentSection] = useState('ventas');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (section) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${API_BASE}/api/admin/stock/${section}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(`Error al cargar ${section}:`, err);
      // Usar datos mock como fallback
      if (section === 'ventas') setData(ventasMock);
      else if (section === 'compras') setData(comprasMock);
      else if (section === 'inventario') setData(inventarioMock);
      setError('Usando datos de ejemplo. No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentSection);
  }, [currentSection]);

  const columns = columnDefinitions[currentSection];
  const sectionTitle = {
    ventas: '💰 Ventas realizadas',
    compras: '🛒 Compras a proveedores',
    inventario: '📦 Inventario actual'
  }[currentSection];

  const renderTable = () => {
    if (loading) {
      return <div className="empty-message">🔄 Cargando datos...</div>;
    }
    if (!data.length) {
      return <div className="empty-message">📭 No hay registros para mostrar.</div>;
    }

    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.format ? col.format(item[col.key]) : (item[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>📊 Panel de Control · Administración</h1>
        <p>Visualiza de forma rápida las ventas, compras e inventario de tu empresa.</p>
      </div>

      <div className="selector-cards">
        <button
          className={`card-option ${currentSection === 'ventas' ? 'active' : ''}`}
          onClick={() => setCurrentSection('ventas')}
        >
          <span className="option-icon">💰</span>
          <span className="option-title">Ventas</span>
        </button>
        <button
          className={`card-option ${currentSection === 'compras' ? 'active' : ''}`}
          onClick={() => setCurrentSection('compras')}
        >
          <span className="option-icon">🛒</span>
          <span className="option-title">Compras</span>
        </button>
        <button
          className={`card-option ${currentSection === 'inventario' ? 'active' : ''}`}
          onClick={() => setCurrentSection('inventario')}
        >
          <span className="option-icon">📦</span>
          <span className="option-title">Inventario</span>
        </button>
      </div>

      <div className="table-panel">
        <div className="panel-header">
          <h2>
            {sectionTitle}
            <span className="badge-count">{data.length} registros</span>
          </h2>
        </div>
        {error && <div className="error-message">⚠️ {error}</div>}
        {renderTable()}
      </div>

      <div className="footer-note">
        ⚡ Conectado a API {API_BASE}
      </div>
    </div>
  );
};

export default AdminStock;