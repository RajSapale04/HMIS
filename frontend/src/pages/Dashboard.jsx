import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';

const StatCard = ({ title, value, sub, color }) => (
  <div className={`rounded-xl p-6 text-white ${color}`}>
    <p className="text-sm font-medium opacity-80">{title}</p>
    <p className="mt-1 text-3xl font-bold">{value}</p>
    {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data.data));
  }, []);

  if (!stats) return <p className="p-8 text-gray-500">Loading MIS data…</p>;

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Admin MIS Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total patients"      value={stats.totalPatients}      color="bg-violet-600" />
        <StatCard title="Active doctors"      value={stats.activeDoctors}      color="bg-blue-600" />
        <StatCard title="Today's appointments" value={stats.todayAppointments} color="bg-teal-600" />
        <StatCard title="Total revenue"       value={`₹${stats.totalRevenue.toLocaleString()}`} color="bg-amber-500" />
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-700">Monthly revenue (last 6 months)</h2>
        <div className="flex items-end gap-2 h-32">
          {stats.monthlyRevenue.map(m => {
            const max = Math.max(...stats.monthlyRevenue.map(x => x.revenue), 1);
            const pct = (m.revenue / max) * 100;
            return (
              <div key={`${m._id.year}-${m._id.month}`} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{`₹${(m.revenue/1000).toFixed(1)}k`}</span>
                <div className="w-full rounded-t bg-violet-400" style={{ height: `${pct}%`, minHeight: 4 }} />
                <span className="text-xs text-gray-400">{m._id.month}/{m._id.year}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-700">Appointments by type</h2>
        <div className="flex flex-wrap gap-3">
          {stats.appointmentsByType.map(t => (
              <span key={t._id} className="rounded-full bg-blue-100 px-4 py-1 text-sm text-blue-800">
              {t._id}: <strong>{t.count}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
    </Layout>
  );
}