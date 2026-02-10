const productos = [];

class ProductModel {

  static create(producto) {
    producto.id = productos.length + 1;
    productos.push(producto);
    return producto;
  }

  static getAll() {
    return productos;
  }
}

module.exports = ProductModel;
