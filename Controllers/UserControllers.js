const crypto = require('crypto');
const User = require('../Models/UserModel');
const generateToken = require('../Utils/generateToken');
const nodemailer = require('nodemailer');

// --- Mailer helper ----------------------------------------------------------
const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    tls: { rejectUnauthorized: false },
  });

// --- Register ---------------------------------------------------------------
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ success: false, message: 'Please provide name, email, phone, and password' });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ success: false, message: 'Email is already registered' });

    const user = await User.create({ name, email, phone, password });
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, token: generateToken(user._id) },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- Login ------------------------------------------------------------------
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, address: user.address || '', token: generateToken(user._id) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Update Profile ---------------------------------------------------------
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.name    = req.body.name    !== undefined ? req.body.name    : user.name;
    user.phone   = req.body.phone   !== undefined ? req.body.phone   : user.phone;
    user.address = req.body.address !== undefined ? req.body.address : user.address;
    if (req.body.password) user.password = req.body.password;

    const updated = await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { _id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, role: updated.role, address: updated.address, token: generateToken(updated._id) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Forgot Password — send reset link via email ----------------------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(200).json({ success: true, message: 'If this email is registered, a reset link has been sent.' });

    // Generate token and save to DB
    const rawToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${rawToken}`;

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Groceria Support" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: 'Groceria — Reset Your Password',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
            <div style="background:#1976d2;color:white;padding:20px;">
              <h2 style="margin:0;">?? Password Reset Request</h2>
            </div>
            <div style="padding:24px;">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>You requested a password reset for your Groceria account. Click the button below to set a new password.</p>
              <p style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}" style="background:#1976d2;color:white;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:bold;font-size:16px;">
                  Reset Password
                </a>
              </p>
              <p style="color:#888;font-size:13px;">This link expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>
              <p style="color:#aaa;font-size:12px;word-break:break-all;">Or copy this link: ${resetUrl}</p>
            </div>
          </div>
        `,
      });
      res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
    } catch (mailErr) {
      // If mail fails, clear token and return raw token as fallback
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Mail send failed:', mailErr.message);
      // Fallback: return token directly so user can still reset
      res.status(200).json({
        success: true,
        message: 'Email delivery failed (SMTP blocked). Use the token below to reset your password.',
        resetToken: rawToken,
        resetUrl,
        expiresIn: '15 minutes',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Reset Password via token in URL ----------------------------------------
const resetPasswordByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password)
      return res.status(400).json({ success: false, message: 'Token and new password are required' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token. Please request a new one.' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
      data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Reset Password via body token (legacy) ---------------------------------
const resetPassword = async (req, res) => {
  req.params.token = req.body.token;
  return resetPasswordByToken(req, res);
};

// --- Admin: get all users ----------------------------------------------------
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Admin: update role ------------------------------------------------------
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.role = req.body.role || user.role;
    await user.save();
    res.status(200).json({ success: true, message: 'User role updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Admin: delete user ------------------------------------------------------
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await User.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  SignupUser: registerUser,
  loginUser,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  resetPasswordByToken,
  getAllUsers,
  updateUserRole,
  deleteUser,
};
