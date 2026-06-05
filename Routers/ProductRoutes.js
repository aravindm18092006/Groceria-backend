const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
} = require('../Controllers/ProductControllers');
const { protect } = require('../Middleware/authMiddleware');
const { authorizeRoles } = require('../Middleware/roleMiddleware');

// IMPORTANT: specific routes before param routes
// Admin routes
router.post('/seed', protect, authorizeRoles('admin'), seedProducts);
router.post('/', protect, authorizeRoles('admin'), createProduct);
router.put('/:id', protect, authorizeRoles('admin'), updateProduct);
router.delete('/:id', protect, authorizeRoles('admin'), deleteProduct);

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

module.exports = router;
