//Array de metodos (C R U D)
const productsController = {};
import productsModel from "../models/Products.js";

// SELECT
productsController.getProducts = async (req, res) => {
  const products = await productsModel.find();
  res.json(products);
};

// INSERT
productsController.createProducts = async (req, res) => {
  const { name, description, price, stock } = req.body; // ✅ incluyo stock
  const newProduct = new productsModel({ name, description, price, stock });
  await newProduct.save();
  res.json({ message: "product saved" });
};

// DELETE
productsController.deleteProducts = async (req, res) => {
  const deletedProduct = await productsModel.findByIdAndDelete(req.params.id); // ⚡ ojo: id minúscula
  if (!deletedProduct) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }
  res.json({ message: "product deleted" });
};

// UPDATE
productsController.updateProducts = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body; // ✅ incluyo stock

    const updatedProduct = await productsModel.findByIdAndUpdate(
      req.params.id,
      { name, description, price, stock },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "product updated", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SELECT ONE
productsController.getSingleProduct = async (req, res) => {
  const product = await productsModel.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }
  res.json(product);
};

export default productsController;
