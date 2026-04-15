# Hospital Management Information System (HMIS)

A comprehensive, role-based Hospital Management Information System built using the MERN stack. This system digitizes hospital operations, enabling seamless coordination between administration, doctors, and patients.

## 🚀 Features
* **Role-Based Access Control (RBAC):** Secure login portals for Admins, Doctors, Patients, and Staff using JSON Web Tokens (JWT).
* **Patient Management:** Centralized digital records for patient medical history and details.
* **Smart Appointment Scheduling:** Real-time booking system that prevents overlapping doctor appointments.
* **MIS Dashboard:** Admin overview of total hospital revenue, active doctors, and patient intake.
* **Responsive UI:** Built with React and Tailwind CSS for a clean, modern interface.

## 🛠️ Tech Stack
* **Frontend:** React.js, Vite, React Router, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose

## ⚙️ Local Setup Instructions

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/your-username/hospital-mis.git
cd hospital-mis
\`\`\`

### 2. Setup the Backend
Open a terminal and navigate to the backend directory:
\`\`\`bash
cd backend
npm install
\`\`\`
Create a `.env` file in the `backend` folder with the following variables:
\`\`\`text
PORT=5000
MONGO_URI=mongodb://localhost:27017/hospital_mis
JWT_SECRET=your_super_secret_jwt_key
\`\`\`
Start the backend server:
\`\`\`bash
npm run dev
\`\`\`

### 3. Setup the Frontend
Open a new terminal and navigate to the frontend directory:
\`\`\`bash
cd frontend
npm install
\`\`\`
Start the Vite development server:
\`\`\`bash
npm run dev
\`\`\`

### 4. Database Setup
This project requires MongoDB running locally. You can quickly spin up a local instance using Docker:
\`\`\`bash
docker run --name hmis-mongo -d -p 27017:27017 mongo:latest
\`\`\`