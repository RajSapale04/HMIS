import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js'
import { errorHandler } from './middleware/errorHandler.js';
import 'dotenv/config';

connectDB();
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctors', doctorRoutes)

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
export default app;