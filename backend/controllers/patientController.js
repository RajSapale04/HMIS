import User from '../models/User.js';
import Patient from '../models/Patient.js';
import ApiError from '../utils/ApiError.js';

export const registerPatient = async (req, res, next) => {
  try {
    const { name, email, password, dateOfBirth, gender, bloodGroup,
            phone, address, emergencyContact, insurance,
            medicalHistory, allergies } = req.body;

    if (await User.findOne({ email })) throw new ApiError(400, 'Email already registered');

    const user    = await User.create({ name, email, password, role: 'patient' });
    const patient = await Patient.create({
      user: user._id, dateOfBirth, gender, bloodGroup, phone, address,
      emergencyContact, insurance, medicalHistory, allergies,
      registeredBy: req.user._id,
    });

    await patient.populate('user', 'name email');
    res.status(201).json({ success: true, data: patient });
  } catch (err) { next(err); }
};

export const getPatients = async (req, res, next) => {
  try {
    const { search } = req.query;
    let patients;

    if (search) {
      // Search across linked User fields
      const users = await User.find({
        role: 'patient',
        $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      const ids = users.map(u => u._id);
      patients = await Patient.find({
        $or: [
          { user: { $in: ids } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).populate('user', 'name email').sort({ createdAt: -1 });
    } else {
      patients = await Patient.find().populate('user', 'name email').sort({ createdAt: -1 });
    }

    res.json({ success: true, data: patients });
  } catch (err) { next(err); }
};

// export const getPatient = async (req, res, next) => {
//   try {
//     const patient = await Patient.findById(req.params.id).populate('user', 'name email');
//     if (!patient) throw new ApiError(404, 'Patient not found');
//     res.json({ success: true, data: patient });
//   } catch (err) { next(err); }
// };

export const getPatient = async (req, res, next) => {
  try {
    let query;

    // If a patient is logged in, ONLY let them search by their User ID
    if (req.user.role === 'patient') {
      // Force the query to only look at the 'user' field, ignoring the URL param completely
      query = { user: req.params.id }; 
    } 
    // If an Admin/Staff/Doctor is logged in, let them search by the Patient _id from the URL
    else {
      query = { _id: req.params.id };
    }

    const patient = await Patient.findOne(query).populate('user', 'name email');
    
    if (!patient) throw new ApiError(404, 'Patient not found');
    
    res.json({ success: true, data: patient });
  } catch (err) { 
    next(err); 
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const allowed = ['phone','address','emergencyContact','insurance','medicalHistory','allergies','bloodGroup'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const patient = await Patient.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('user', 'name email');
    if (!patient) throw new ApiError(404, 'Patient not found');
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
};