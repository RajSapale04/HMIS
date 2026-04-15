import User from '../models/User.js';
import Patient from '../models/Patient.js';
import ApiError from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.findOne({ email })) throw new ApiError(400, 'Email already registered');

    const user = await User.create({ name, email, password, role });
    const token = generateToken(res, user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(401, 'Invalid credentials');
    }
    const token = generateToken(res, user._id);
    res.json({ success: true, token, user });
  } catch (err) { next(err); }
};

export const logout = (req, res) => {
  res.cookie('token', '', { maxAge: 0 });
  res.json({ success: true, message: 'Logged out' });
};

export const getMe = (req, res) => res.json({ success: true, user: req.user });