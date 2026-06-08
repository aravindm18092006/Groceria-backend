const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  resetPasswordByToken,
  sendOtp,
  verifyOtp,
  resetPasswordWithOtp,
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require('../Controllers/UserControllers');
const { protect } = require('../Middleware/authMiddleware');
const { authorizeRoles } = require('../Middleware/roleMiddleware');

// -- Public Auth --------------------------------------------------------------
router.post('/register', registerUser);
router.post('/signup',   registerUser);
router.post('/login',    loginUser);

// -- Password Reset (public) --------------------------------------------------
router.post('/forgot-password',        forgotPassword);
router.post('/reset-password',         resetPassword);
router.post('/reset-password/:token',  resetPasswordByToken);

// -- OTP Password Reset (public) ----------------------------------------------
router.post('/send-otp',              sendOtp);
router.post('/verify-otp',            verifyOtp);
router.post('/reset-password-otp',    resetPasswordWithOtp);

// -- Protected User -----------------------------------------------------------
router.put('/profile', protect, updateUserProfile);

// -- Admin (protect + authorizeRoles BOTH required) ---------------------------
router.get(    '/admin/users',          protect, authorizeRoles('admin'), getAllUsers);
router.put(    '/admin/user/:id/role',  protect, authorizeRoles('admin'), updateUserRole);
router.delete( '/admin/user/:id',       protect, authorizeRoles('admin'), deleteUser);

module.exports = router;
