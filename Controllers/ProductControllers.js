const Product = require('../Models/ProductModel');

// @desc   Get all active products
// @route  GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, sort } = req.query;
    // Don't filter by isActive strictly - show all products that aren't explicitly deactivated
    const filter = { isActive: { $ne: false } };
    if (category && category !== 'all') filter.category = category.toLowerCase();

    let query = Product.find(filter);
    if (sort === 'price-low') query = query.sort({ price: 1 });
    else if (sort === 'price-high') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query.lean();
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single product by ID
// @route  GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: { $ne: false } }).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create product (Admin)
// @route  POST /api/products
const createProduct = async (req, res) => {
  try {
    const { name, description, price, oldPrice, weight, category, image, stock } = req.body;
    if (!name || price === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
    }
    const product = await Product.create({
      name, description: description || '', price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : 0,
      weight, category: category.toLowerCase(), image, stock: stock || 100, isActive: true,
    });
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Update product (Admin)
// @route  PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.price) updates.price = Number(updates.price);
    if (updates.oldPrice) updates.oldPrice = Number(updates.oldPrice);
    if (updates.stock) updates.stock = Number(updates.stock);

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Delete product (Admin - soft delete)
// @route  DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Product removed from catalog' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Seed all products (Admin) - replaces entire catalog
// @route  POST /api/products/seed
const seedProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'A non-empty products array is required' });
    }
    await Product.deleteMany({});
    const docs = products.map(p => ({
      name: p.name,
      description: p.description || '',
      price: Number(p.price),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : 0,
      weight: p.weight || '',
      category: (p.category || 'fruits').toLowerCase(),
      image: p.image || '',
      stock: 100,
      isActive: true,
    }));
    const inserted = await Product.insertMany(docs);
    res.status(201).json({ success: true, message: `${inserted.length} products seeded`, data: inserted });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, seedProducts };

