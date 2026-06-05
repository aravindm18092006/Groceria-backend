const Order = require('../Models/OrderModel');
const Cart = require('../Models/CartModel');

// --- Place Order -------------------------------------------------------------
const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, orderItems, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;
    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ success: false, message: 'No order items provided' });

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      itemsPrice: itemsPrice || 0,
      taxPrice: taxPrice || 0,
      shippingPrice: shippingPrice || 0,
      totalPrice: totalPrice || 0,
      status: 'pending',
      trackingHistory: [{ status: 'pending', message: 'Order placed successfully' }],
    });

    // Clear cart after order
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- Get My Orders -----------------------------------------------------------
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Get Single Order --------------------------------------------------------
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Allow owner or admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Cancel Order (user) -----------------------------------------------------
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['shipped', 'delivered'].includes(order.status))
      return res.status(400).json({ success: false, message: `Cannot cancel an order that is already ${order.status}` });

    order.status = 'cancelled';
    order.trackingHistory.push({ status: 'cancelled', message: 'Order cancelled by customer' });
    await order.save();
    res.status(200).json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Admin: Get All Orders ---------------------------------------------------
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email phone').sort({ createdAt: -1 });
    const totalAmount = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    res.status(200).json({ success: true, count: orders.length, totalAmount, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Admin: Update Order Status ----------------------------------------------
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Use: ${validStatuses.join(', ')}` });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    order.trackingHistory.push({ status, message: `Order status updated to ${status}` });
    if (status === 'delivered') { order.isDelivered = true; order.deliveredAt = Date.now(); }
    if (status === 'processing' && !order.isPaid && order.paymentMethod !== 'cod') {
      order.isPaid = true; order.paidAt = Date.now();
    }
    await order.save();
    res.status(200).json({ success: true, message: `Order status updated to ${status}`, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
