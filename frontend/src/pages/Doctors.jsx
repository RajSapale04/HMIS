import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  // User fields
  name: '', email: '', password: '',
  // Doctor fields
  phone: '', department: '', specialization: '', 
  qualifications: '', experience: '', licenseNumber: '', consultationFee: ''
};

export default function Doctors() {
  const { user } = useAuth();
  const [doctors, setDoctors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [viewModal, setViewModal]   = useState(null); // doctor object
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors', { params: { search } });
      setDoctors(data.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const field = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/doctors', {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, department: form.department,
        specialization: form.specialization, experience: Number(form.experience),
        licenseNumber: form.licenseNumber, consultationFee: Number(form.consultationFee),
        qualifications: form.qualifications.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'user',           label: 'Name',           render: r => `Dr. ${r.user?.name ?? '—'}` },
    { key: 'department',     label: 'Department' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'phone',          label: 'Phone' },
    { key: 'fee',            label: 'Cons. Fee',      render: r => `₹${r.consultationFee}` },
    { key: 'status',         label: 'Status',         render: r => <Badge status={r.availability === 'Available' ? 'active' : 'inactive'} text={r.availability} /> },
    { key: 'actions',        label: '',
      render: r => (
        <button
          onClick={() => setViewModal(r)}
          className="rounded-lg px-3 py-1 text-xs font-medium text-violet-600 transition hover:bg-violet-50"
        >
          View
        </button>
      )
    },
  ];

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Doctors</h1>
          <p className="text-sm text-gray-500">{doctors.length} active personnel</p>
        </div>
        {['admin', 'staff'].includes(user?.role) && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            + Register doctor
          </button>
        )}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, department, specialty…"
        className="mb-4 w-full max-w-sm rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />

      {loading ? (
        <p className="py-12 text-center text-gray-400">Loading doctors…</p>
      ) : (
        <Table columns={columns} data={doctors} emptyMessage="No doctors registered yet." />
      )}

      {/* Register Modal */}
      {showModal && (
        <Modal title="Register new doctor" onClose={() => { setShowModal(false); setError(''); }}>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

            <Section title="Account Settings">
              <Row>
                <Field label="Full name"  value={form.name}     onChange={v => field('name', v)} required />
                <Field label="Email"      value={form.email}    onChange={v => field('email', v)} type="email" required />
              </Row>
              <Row>
                <Field label="Password (min 8 chars)" value={form.password} onChange={v => field('password', v)} type="password" required />
                <Field label="Phone number" value={form.phone} onChange={v => field('phone', v)} required />
              </Row>
            </Section>

            <Section title="Professional Details">
              <Row>
                <Field label="Department" value={form.department} onChange={v => field('department', v)} required placeholder="e.g. Cardiology" />
                <Field label="Specialization" value={form.specialization} onChange={v => field('specialization', v)} required placeholder="e.g. Heart Surgeon" />
              </Row>
              <Row>
                <Field label="License Number" value={form.licenseNumber} onChange={v => field('licenseNumber', v)} required />
                <Field label="Years of Experience" value={form.experience} onChange={v => field('experience', v)} type="number" required />
              </Row>
              <Field label="Qualifications (comma-separated)" value={form.qualifications} onChange={v => field('qualifications', v)} placeholder="e.g. MBBS, MD" required />
            </Section>

            <Section title="Hospital Assignment">
              <Field label="Consultation Fee (₹)" value={form.consultationFee} onChange={v => field('consultationFee', v)} type="number" required />
            </Section>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60">
                {submitting ? 'Registering…' : 'Register doctor'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Doctor Modal */}
      {viewModal && (
        <Modal title="Doctor Profile" onClose={() => setViewModal(null)}>
          <div className="space-y-4 text-sm">
            <Detail label="Name"           value={`Dr. ${viewModal.user?.name}`} />
            <Detail label="Email"          value={viewModal.user?.email} />
            <Detail label="Phone"          value={viewModal.phone} />
            <Detail label="Department"     value={viewModal.department} />
            <Detail label="Specialization" value={viewModal.specialization} />
            <Detail label="License No."    value={viewModal.licenseNumber} />
            <Detail label="Experience"     value={`${viewModal.experience} Years`} />
            <Detail label="Cons. Fee"      value={`₹${viewModal.consultationFee}`} />
            {viewModal.qualifications?.length > 0 && (
              <Detail label="Qualifications" value={viewModal.qualifications.join(', ')} />
            )}
            <Detail label="Availability"   value={viewModal.availability} />
          </div>
        </Modal>
      )}
    </Layout>
  );
}

// Small composables (Same as your Patients file) ──────────────────────────
function Section({ title, children }) {
  return (
    <fieldset className="rounded-lg border border-gray-100 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</legend>
      <div className="space-y-3 mt-2">{children}</div>
    </fieldset>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <input
        type={type} value={value} required={required} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
      />
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="w-36 shrink-0 font-medium text-gray-500">{label}</span>
      <span className="text-gray-800">{value || '—'}</span>
    </div>
  );
}