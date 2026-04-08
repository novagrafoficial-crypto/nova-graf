import React, { useState, useEffect } from 'react';

const AdminProveedor = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        contacto: '',
        telefono: '',
        tiempo_entrega_promedio: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/admin/proveedores/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert("¡Proveedor guardado!");
                setFormData({ nombre: '', contacto: '', telefono: '', tiempo_entrega_promedio: '' });
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Registrar Proveedor - Nova Graf</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
                <input name="nombre" placeholder="Nombre de la empresa" onChange={handleChange} value={formData.nombre} required />
                <input name="contacto" placeholder="Nombre del contacto" onChange={handleChange} value={formData.contacto} />
                <input name="telefono" placeholder="Teléfono" onChange={handleChange} value={formData.telefono} />
                <input name="tiempo_entrega_promedio" type="number" placeholder="Tiempo entrega (días)" onChange={handleChange} value={formData.tiempo_entrega_promedio} required />
                <button type="submit" style={{ background: '#007bff', color: 'white', padding: '10px', border: 'none', cursor: 'pointer' }}>
                    Guardar Proveedor
                </button>
            </form>
        </div>
    );
};

export default AdminProveedor;