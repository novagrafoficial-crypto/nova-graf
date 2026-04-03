const pool = require('../../config/db'); // Tu configuración de conexión a Postgres

const ProveedorModel = {
    crear: async (datos) => {
        const { nombre, contacto, telefono, tiempo_entrega_promedio } = datos;
        const query = `
            INSERT INTO compras.proveedores (nombre, contacto, telefono, tiempo_entrega_promedio)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [nombre, contacto, telefono, tiempo_entrega_promedio];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    listarTodos: async () => {
        const query = 'SELECT * FROM compras.proveedores ORDER BY id DESC;';
        const { rows } = await pool.query(query);
        return rows;
    }
};

module.exports = ProveedorModel;