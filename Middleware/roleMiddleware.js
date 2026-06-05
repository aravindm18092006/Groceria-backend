const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role ${req.user?.role} is not allowed to access this route`);
  }
  next();
};

module.exports = { authorizeRoles };
