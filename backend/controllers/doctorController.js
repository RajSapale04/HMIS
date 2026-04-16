// import User from '../models/User.js';

// export const getDoctors = async (req, res, next) => {
//   try {
//     const doctors = await User.find({ role: 'doctor', isActive: true })
//       .select('name email specialisation licenseNumber createdAt');
//     res.json({ success: true, data: doctors });
//   } catch (err) { next(err); }
// };

import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import ApiError from '../utils/ApiError.js';

// @desc    Register a new doctor
// @route   POST /api/doctors
// @access  Admin/Staff
export const registerDoctor = async (req, res, next) => {
  try {
    const { 
      name, email, password, phone, department, 
      specialization, experience, licenseNumber, 
      consultationFee, qualifications 
    } = req.body;

    // 1. Check if email is already used
    if (await User.findOne({ email })) {
      throw new ApiError(400, 'Email already registered');
    }

    // 2. Check if License Number is already registered
    if (await Doctor.findOne({ licenseNumber })) {
      throw new ApiError(400, 'License number already in use');
    }

    // 3. Create the User account for the Doctor
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: 'doctor' 
    });

    // 4. Create the Doctor profile linked to the User
    const doctor = await Doctor.create({
      user: user._id,
      phone,
      department,
      specialization,
      experience,
      licenseNumber,
      consultationFee,
      qualifications,
      registeredBy: req.user._id,
    });

    await doctor.populate('user', 'name email');
    res.status(201).json({ success: true, data: doctor });
  } catch (err) { 
    next(err); 
  }
};

// @desc    Get all doctors (with search functionality)
// @route   GET /api/doctors
// @access  Public or Protected (Admin, Staff, Patient, Doctor)
export const getDoctors = async (req, res, next) => {
  try {
    const { search } = req.query;
    let doctors;

    if (search) {
      // Step A: Search for matching names or emails in the User collection
      const users = await User.find({
        role: 'doctor',
        $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      
      const userIds = users.map(u => u._id);

      // Step B: Search the Doctor collection by the found User IDs OR matching department/specialty/phone
      doctors = await Doctor.find({
        $or: [
          { user: { $in: userIds } },
          { department: { $regex: search, $options: 'i' } },
          { specialization: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).populate('user', 'name email').sort({ createdAt: -1 });
    } else {
      // If no search, return all doctors
      doctors = await Doctor.find().populate('user', 'name email').sort({ createdAt: -1 });
    }

    res.json({ success: true, data: doctors });
  } catch (err) { 
    next(err); 
  }
};

// @desc    Get a single doctor by ID
// @route   GET /api/doctors/:id
// @access  Protected
export const getDoctor = async (req, res, next) => {
  try {
    let query;

    // Use the collision-proof pattern you learned!
    // If a logged-in doctor is trying to fetch their own profile using their User ID:
    if (req.user.role === 'doctor' && req.params.id === req.user._id.toString()) {
      query = { user: req.params.id }; 
    } 
    // If Admin/Staff/Patient is looking up a doctor, they will use the Doctor _id:
    else {
      query = { _id: req.params.id };
    }

    const doctor = await Doctor.findOne(query).populate('user', 'name email');
    
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    
    res.json({ success: true, data: doctor });
  } catch (err) { 
    next(err); 
  }
};

// @desc    Update a doctor's profile
// @route   PATCH /api/doctors/:id
// @access  Admin/Staff/Doctor (updating their own)
export const updateDoctor = async (req, res, next) => {
  try {
    // We do NOT allow updating the 'licenseNumber' or 'user' reference here for security
    const allowedUpdates = [
      'phone', 'department', 'specialization', 
      'experience', 'consultationFee', 'availability', 'qualifications'
    ];
    
    // Filter the request body to only include allowed fields
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
    );

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!doctor) throw new ApiError(404, 'Doctor not found');
    
    res.json({ success: true, data: doctor });
  } catch (err) { 
    next(err); 
  }
};