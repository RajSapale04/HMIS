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
  // Patient fields
  dateOfBirth: '', gender: '', bloodGroup: '', phone: '', address: '',
  emergencyName: '', emergencyPhone: '', emergencyRelation: '',
  insuranceProvider: '', policyNo: '',
  medicalHistory: '', allergies: '',
};

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [viewModal, setViewModal]   = useState(null); // patient object
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients', { params: { search } });
      setPatients(data.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const field = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/patients', {
        name: form.name, email: form.email, password: form.password,
        dateOfBirth: form.dateOfBirth, gender: form.gender,
        bloodGroup: form.bloodGroup, phone: form.phone, address: form.address,
        emergencyContact: {
          name: form.emergencyName, phone: form.emergencyPhone, relation: form.emergencyRelation,
        },
        insurance: { provider: form.insuranceProvider, policyNo: form.policyNo },
        medicalHistory: form.medicalHistory.split(',').map(s => s.trim()).filter(Boolean),
        allergies:      form.allergies.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'user',      label: 'Name',     render: r => r.user?.name ?? '—' },
    { key: 'phone',     label: 'Phone' },
    { key: 'gender',    label: 'Gender',   render: r => <span className="capitalize">{r.gender}</span> },
    { key: 'bloodGroup',label: 'Blood' },
    { key: 'createdAt', label: 'Registered', render: r => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions',   label: '',
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
          <h1 className="text-xl font-semibold text-gray-800">Patients</h1>
          <p className="text-sm text-gray-500">{patients.length} records</p>
        </div>
        {['admin', 'staff'].includes(user?.role) && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            + Register patient
          </button>
        )}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, phone, email…"
        className="mb-4 w-full max-w-sm rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />

      {loading ? (
        <p className="py-12 text-center text-gray-400">Loading patients…</p>
      ) : (
        <Table columns={columns} data={patients} emptyMessage="No patients registered yet." />
      )}

      {/* Register Modal */}
      {showModal && (
        <Modal title="Register new patient" onClose={() => { setShowModal(false); setError(''); }}>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

            <Section title="Account">
              <Row>
                <Field label="Full name"  value={form.name}     onChange={v => field('name', v)} required />
                <Field label="Email"      value={form.email}    onChange={v => field('email', v)} type="email" required />
              </Row>
              <Field label="Password (min 8 chars)" value={form.password} onChange={v => field('password', v)} type="password" required />
            </Section>

            <Section title="Personal details">
              <Row>
                <Field label="Date of birth" value={form.dateOfBirth} onChange={v => field('dateOfBirth', v)} type="date" required />
                <Select label="Gender" value={form.gender} onChange={v => field('gender', v)} required
                  options={[['male','Male'],['female','Female'],['other','Other']]} />
              </Row>
              <Row>
                <Select label="Blood group" value={form.bloodGroup} onChange={v => field('bloodGroup', v)}
                  options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => [b,b])} />
                <Field label="Phone" value={form.phone} onChange={v => field('phone', v)} required />
              </Row>
              <Field label="Address" value={form.address} onChange={v => field('address', v)} required />
            </Section>

            <Section title="Emergency contact">
              <Row>
                <Field label="Name"     value={form.emergencyName}     onChange={v => field('emergencyName', v)} />
                <Field label="Phone"    value={form.emergencyPhone}    onChange={v => field('emergencyPhone', v)} />
              </Row>
              <Field label="Relation" value={form.emergencyRelation} onChange={v => field('emergencyRelation', v)} />
            </Section>

            <Section title="Insurance">
              <Row>
                <Field label="Provider"  value={form.insuranceProvider} onChange={v => field('insuranceProvider', v)} />
                <Field label="Policy no" value={form.policyNo}          onChange={v => field('policyNo', v)} />
              </Row>
            </Section>

            <Section title="Medical history">
              <Field label="Conditions (comma-separated)" value={form.medicalHistory} onChange={v => field('medicalHistory', v)} />
              <Field label="Allergies (comma-separated)"  value={form.allergies}      onChange={v => field('allergies', v)} />
            </Section>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60">
                {submitting ? 'Registering…' : 'Register patient'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Patient Modal */}
      {viewModal && (
        <Modal title="Patient details" onClose={() => setViewModal(null)}>
          <div className="space-y-4 text-sm">
            <Detail label="Name"        value={viewModal.user?.name} />
            <Detail label="Email"       value={viewModal.user?.email} />
            <Detail label="Phone"       value={viewModal.phone} />
            <Detail label="Gender"      value={viewModal.gender} />
            <Detail label="Blood group" value={viewModal.bloodGroup} />
            <Detail label="DOB"         value={new Date(viewModal.dateOfBirth).toLocaleDateString()} />
            <Detail label="Address"     value={viewModal.address} />
            {viewModal.medicalHistory?.length > 0 && (
              <Detail label="Medical history" value={viewModal.medicalHistory.join(', ')} />
            )}
            {viewModal.allergies?.length > 0 && (
              <Detail label="Allergies" value={viewModal.allergies.join(', ')} />
            )}
            {viewModal.emergencyContact?.name && (
              <Detail label="Emergency contact"
                value={`${viewModal.emergencyContact.name} (${viewModal.emergencyContact.relation}) — ${viewModal.emergencyContact.phone}`} />
            )}
            {viewModal.insurance?.provider && (
              <Detail label="Insurance" value={`${viewModal.insurance.provider} · ${viewModal.insurance.policyNo}`} />
            )}
          </div>
        </Modal>
      )}
    </Layout>
  );
}

// Small composables ─────────────────────────────────────────────────────────
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

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <input
        type={type} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
      />
    </div>
  );
}

function Select({ label, value, onChange, options = [], required = false }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <select
        value={value} required={required}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 bg-white"
      >
        <option value="">Select…</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
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