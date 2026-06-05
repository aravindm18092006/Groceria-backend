const Wishlist = require('../Models/WishlistModel');

// @desc   Get user wishlist
// @route  GET /api/wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) return res.status(200).json({ success: true, data: { items: [] } });
    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Add product to wishlist
// @route  POST /api/wishlist/add
const addToWishlist = async (req, res) => {
  try {
    const { productId, name, price, image, weight, category } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = new Wishlist({ user: req.user._id, items: [] });

    const alreadyExists = wishlist.items.find(i => i.product.toString() === productId);
    if (alreadyExists) {
      return res.status(200).json({ success: true, message: 'Already in wishlist', data: wishlist });
    }
    wishlist.items.push({ product: productId, name, price, image, weight, category });
    await wishlist.save();
    res.status(200).json({ success: true, message: 'Added to wishlist', data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Remove product from wishlist
// @route  DELETE /api/wishlist/remove/:productId
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) return res.status(404).json({ success: false, message: 'Wishlist not found' });
    wishlist.items = wishlist.items.filter(i => i.product.toString() !== productId);
    await wishlist.save();
    res.status(200).json({ success: true, message: 'Removed from wishlist', data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Clear wishlist
// @route  DELETE /api/wishlist/clear
const clearWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) { wishlist.items = []; await wishlist.save(); }
    res.status(200).json({ success: true, message: 'Wishlist cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
