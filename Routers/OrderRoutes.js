const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../Controllers/OrderControllers');
const { protect } = require('../Middleware/authMiddleware');
const { authorizeRoles } = require('../Middleware/roleMiddleware');

router.use(protect); // All order routes require auth

// Admin routes FIRST (before /:id to avoid conflict)
router.get('/admin/all', authorizeRoles('admin'), getAllOrders);
router.put('/admin/:id/status', authorizeRoles('admin'), updateOrderStatus);

// User routes
router.post('/', placeOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
