const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  resetPasswordByToken,
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
router.post('/reset-password',         resetPassword);          // body: { token, password }
router.post('/reset-password/:token',  resetPasswordByToken);   // URL token from email link

// -- Protected User -----------------------------------------------------------
router.put('/profile', protect, updateUserProfile);

// -- Admin (protect + authorizeRoles BOTH required) ---------------------------
router.get(    '/admin/users',          protect, authorizeRoles('admin'), getAllUsers);
router.put(    '/admin/user/:id/role',  protect, authorizeRoles('admin'), updateUserRole);
router.delete( '/admin/user/:id',       protect, authorizeRoles('admin'), deleteUser);

module.exports = router;
