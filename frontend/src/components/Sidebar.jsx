import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',    roles: ['admin'],                          icon: '▦' },
  { to: '/patients',     label: 'Patients',     roles: ['admin', 'staff', 'doctor'],       icon: '♥' },
  { to: '/appointments', label: 'Appointments', roles: ['admin', 'staff', 'doctor', 'patient'], icon: '◷' },
  { to: '/billing',      label: 'Billing',      roles: ['admin', 'staff'],                 icon: '₹' },
  { to: '/doctors',      label: 'Doctors',      roles: ['admin', 'staff', 'patient'],      icon: '✚' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allowed = NAV.filter(n => n.roles.includes(user?.role));

  return (
    <aside className="flex h-screen w-56 flex-col bg-gray-900 px-4 py-6 text-gray-300">
      {/* Brand */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white text-sm font-bold">H</div>
        <span className="font-semibold text-white">HMIS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {allowed.map(n => (
          <NavLink
            key={n.to} to={n.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive ? 'bg-violet-600 text-white' : 'hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-700 pt-4">
        <div className="mb-3 px-2">
          <p className="text-xs font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}