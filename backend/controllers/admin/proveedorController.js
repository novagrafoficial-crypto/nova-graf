const ProveedorModel = require('../../models/admin/proveedorModel');

const registrarProveedor = async (req, res) => {
    try {
        const nuevoProveedor = await ProveedorModel.crear(req.body);
        res.status(201).json({
            success: true,
            message: "Proveedor registrado con éxito",
            data: nuevoProveedor
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al registrar proveedor" });
    }
};

const obtenerProveedores = async (req, res) => {
    try {
        const proveedores = await ProveedorModel.listarTodos();
        res.json(proveedores);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener proveedores" });
    }
};

module.exports = { registrarProveedor, obtenerProveedores };