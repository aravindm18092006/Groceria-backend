const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');
const asyncHandler = require('../Utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');

  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }

  next();
});

module.exports = { protect };
