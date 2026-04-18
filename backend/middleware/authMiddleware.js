import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

// Verify JWT from Authorization header or httpOnly cookie
export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) throw new ApiError(401, 'Not authorised — no token');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) throw new ApiError(401, 'Account not found or deactivated');

    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(401, 'Not authorized, token failed'));
  }
};

// Usage: authorizeRoles('admin', 'staff')
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, `Role '${req.user.role}' is not permitted to access this route`));
  }
  next();
};