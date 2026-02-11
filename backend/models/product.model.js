const products = [];

class Product {
  constructor(id, name, price, description, category, image){
    this.id = id;
    this.name = name;
    this.price = price;
    this.description = description;
    this.category = category;
    this.image = image;
  }

  static getAll(){
    return products;
  }

  static create(data){
    const product = new Product(
      Date.now(),
      data.name,
      data.price,
      data.description,
      data.category,
      data.image
    );

    products.push(product);
    return product;
  }
}

module.exports = Product;
