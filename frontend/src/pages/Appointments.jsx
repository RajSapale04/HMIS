import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  patientId: '', doctorId: '', date: '', startTime: '', endTime: '',
  type: 'consultation', notes: '',
};

const STATUS_OPTIONS = ['scheduled', 'completed', 'cancelled', 'no-show'];

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients]         = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [dateFilter, setDateFilter]     = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = dateFilter ? { date: dateFilter } : {};
      const patientRoute = user?.role === 'patient' 
        ? `/patients/${user._id}` // Change to user.id if your context uses that
        : '/patients';

      const [apptRes, patRes, docRes] = await Promise.all([
        api.get('/appointments', { params }),
        api.get(patientRoute),
        api.get('/doctors'),
      ]);
      const fetchedPatients = patRes.data.data;
      setPatients(Array.isArray(fetchedPatients) ? fetchedPatients : [fetchedPatients]);
      setAppointments(apptRes.data.data);
      setDoctors(docRes.data.data);
      console.log('Fetched appointments:', apptRes.data.data);
      console.log('Fetched patients:', fetchedPatients);
      console.log('Fetched doctors:', docRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const field = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleBook = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/appointments', {
        patient: form.patientId,
        doctor:  form.doctorId,
        date:    form.date,
        startTime: form.startTime,
        endTime:   form.endTime,
        type:      form.type,
        notes:     form.notes,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      setAppointments(prev =>
        prev.map(a => a._id === id ? { ...a, status } : a)
      );
    } catch {
      alert('Failed to update status');
    }
  };

  const canBook = ['admin', 'staff','patient'].includes(user?.role);
  const canChangeStatus = ['admin', 'doctor', 'staff'].includes(user?.role);

  const columns = [
    { key: 'patient',   label: 'Patient',  render: r => r.patient?.user?.name ?? '—' },
    { key: 'doctor',    label: 'Doctor',   render: r => `Dr. ${r.doctor?.user?.name ?? '—'}` },
    { key: 'date',      label: 'Date',     render: r => new Date(r.date).toLocaleDateString() },
    { key: 'time',      label: 'Time',     render: r => `${r.startTime} – ${r.endTime}` },
    { key: 'type',      label: 'Type',     render: r => <span className="capitalize">{r.type}</span> },
    { key: 'status',    label: 'Status',   render: r => <Badge status={r.status} /> },
    ...(canChangeStatus ? [{
      key: 'actions', label: '',
      render: r => (
        <select
          value={r.status}
          onChange={e => updateStatus(r._id, e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-400"
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    }] : []),
  ];

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Appointments</h1>
          <p className="text-sm text-gray-500">{appointments.length} appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date" value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-sm text-gray-400 hover:text-gray-600">
              Clear
            </button>
          )}
          {canBook && (
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              + Book appointment
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-gray-400">Loading appointments…</p>
      ) : (
        <Table columns={columns} data={appointments} emptyMessage="No appointments found." />
      )}

      {/* Booking Modal */}
      {showModal && (
        <Modal title="Book appointment" onClose={() => { setShowModal(false); setError(''); }}>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}
          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Patient</label>
              <select required value={form.patientId} onChange={e => field('patientId', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white">
                <option value="">Select patient…</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.user?.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Doctor</label>
              <select required value={form.doctorId} onChange={e => field('doctorId', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white">
                <option value="">Select doctor…</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>Dr. {d.user?.name} — {d.specialization}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-gray-500">Date</label>
                <input type="date" required value={form.date} onChange={e => field('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Start</label>
                <input type="time" required value={form.startTime} onChange={e => field('startTime', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">End</label>
                <input type="time" required value={form.endTime} onChange={e => field('endTime', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
              <select value={form.type} onChange={e => field('type', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white">
                {['consultation','follow-up','emergency','procedure'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Notes (optional)</label>
              <textarea rows={3} value={form.notes} onChange={e => field('notes', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60">
                {submitting ? 'Booking…' : 'Book appointment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}