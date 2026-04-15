import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const EMPTY_FORM = {
  patientId: '', appointmentId: '', paymentMethod: 'cash',
  discount: 0, tax: 18,
  items: [{ description: '', quantity: 1, unitPrice: '' }],
};

export default function Billing() {
  const [bills, setBills]           = useState([]);
  const [patients, setPatients]     = useState([]);
  const [appts, setAppts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [viewBill, setViewBill]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [billRes, patRes, apptRes] = await Promise.all([
        api.get('/billing'),
        api.get('/patients'),
        api.get('/appointments'),
      ]);
      setBills(billRes.data.data);
      setPatients(patRes.data.data);
      setAppts(apptRes.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── line-item helpers ────────────────────────────────────────────────────
  const updateItem = (i, key, val) =>
    setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }));

  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, unitPrice: '' }] }));
  const removeItem = i  => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const subtotal = form.items.reduce((s, it) => s + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);
  const total    = subtotal * (1 - form.discount / 100) * (1 + form.tax / 100);

  const handleCreate = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/billing', {
        patient:       form.patientId,
        appointment:   form.appointmentId || undefined,
        items:         form.items.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
        discount:      Number(form.discount),
        tax:           Number(form.tax),
        total:         parseFloat(total.toFixed(2)),
        paymentMethod: form.paymentMethod,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async id => {
    try {
      const bill = bills.find(b => b._id === id);
      await api.patch(`/billing/${id}`, { status: 'paid', amountPaid: bill.total });
      fetchAll();
    } catch { alert('Update failed'); }
  };

  // ── PDF generator (pure browser, no library needed) ────────────────────
  const printBill = bill => {
    const items = bill.items.map(it =>
      `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0">${it.description}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center">${it.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right">₹${Number(it.unitPrice).toFixed(2)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right">₹${(it.quantity * it.unitPrice).toFixed(2)}</td>
      </tr>`
    ).join('');
    const subtotal = bill.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice #${bill._id.slice(-6).toUpperCase()}</title>
      <style>
        body { font-family: sans-serif; color: #1a1a1a; padding: 40px; max-width: 640px; margin: auto; }
        h1   { font-size: 22px; font-weight: 600; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 20px 0; font-size: 13px; color: #555; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
        thead tr { background: #f8f5ff; }
        th { padding: 8px; text-align: left; font-weight: 600; color: #5b21b6; }
        .totals { margin-top: 12px; text-align: right; font-size: 13px; }
        .grand { font-size: 16px; font-weight: 700; color: #5b21b6; margin-top: 4px; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600;
                 background: ${bill.status === 'paid' ? '#d1fae5' : '#fef3c7'};
                 color: ${bill.status === 'paid' ? '#065f46' : '#92400e'}; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h1>Invoice</h1>
          <p style="font-size:13px;color:#888;margin-top:2px">#${bill._id.slice(-6).toUpperCase()}</p>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;font-size:18px;color:#5b21b6">HMIS</div>
          <div style="font-size:12px;color:#888">City Hospital</div>
        </div>
      </div>
      <div class="meta">
        <div><strong>Patient:</strong> ${bill.patient?.user?.name ?? '—'}</div>
        <div><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString()}</div>
        <div><strong>Payment:</strong> ${bill.paymentMethod ?? '—'}</div>
        <div><strong>Status:</strong> <span class="badge">${bill.status}</span></div>
      </div>
      <table>
        <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${items}</tbody>
      </table>
      <div class="totals">
        <div>Subtotal: ₹${subtotal.toFixed(2)}</div>
        <div>Discount: ${bill.discount}%</div>
        <div>Tax (GST): ${bill.tax}%</div>
        <div class="grand">Total: ₹${bill.total.toFixed(2)}</div>
      </div>
      <p style="margin-top:32px;font-size:11px;color:#aaa;text-align:center">Thank you for choosing City Hospital · This is a computer-generated invoice</p>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const columns = [
    { key: 'patient',   label: 'Patient',        render: r => r.patient?.user?.name ?? '—' },
    { key: 'total',     label: 'Total',           render: r => `₹${r.total.toLocaleString()}` },
    { key: 'status',    label: 'Status',          render: r => <Badge status={r.status} /> },
    { key: 'method',    label: 'Payment method',  render: r => r.paymentMethod ?? '—' },
    { key: 'createdAt', label: 'Date',            render: r => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions', label: '',
      render: r => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewBill(r)}
            className="rounded px-2 py-1 text-xs text-violet-600 hover:bg-violet-50">
            View
          </button>
          <button onClick={() => printBill(r)}
            className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">
            Print
          </button>
          {r.status !== 'paid' && (
            <button onClick={() => markPaid(r._id)}
              className="rounded px-2 py-1 text-xs text-green-700 hover:bg-green-50">
              Mark paid
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Billing</h1>
          <p className="text-sm text-gray-500">{bills.length} invoices</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          + New invoice
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-gray-400">Loading bills…</p>
      ) : (
        <Table columns={columns} data={bills} emptyMessage="No invoices yet." />
      )}

      {/* Create bill modal */}
      {showModal && (
        <Modal title="New invoice" onClose={() => { setShowModal(false); setError(''); }}>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleCreate} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Patient</label>
                <select required value={form.patientId} onChange={e => setForm(p => ({ ...p, patientId: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white">
                  <option value="">Select…</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.user?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Appointment (optional)</label>
                <select value={form.appointmentId} onChange={e => setForm(p => ({ ...p, appointmentId: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white">
                  <option value="">None</option>
                  {appts.filter(a => a.status === 'completed').map(a => (
                    <option key={a._id} value={a._id}>
                      {new Date(a.date).toLocaleDateString()} · Dr. {a.doctor?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Line items</span>
                <button type="button" onClick={addItem}
                  className="text-xs text-violet-600 hover:underline">+ Add item</button>
              </div>
              <div className="space-y-2">
                {form.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input placeholder="Description" value={it.description}
                      onChange={e => updateItem(i, 'description', e.target.value)} required
                      className="col-span-6 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
                    <input type="number" placeholder="Qty" value={it.quantity} min={1}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                      className="col-span-2 rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-violet-400" />
                    <input type="number" placeholder="₹ Price" value={it.unitPrice} min={0}
                      onChange={e => updateItem(i, 'unitPrice', e.target.value)} required
                      className="col-span-3 rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-violet-400" />
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)}
                        className="col-span-1 text-gray-300 hover:text-red-400 text-lg leading-none">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Discount %</label>
                <input type="number" min={0} max={100} value={form.discount}
                  onChange={e => setForm(p => ({ ...p, discount: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Tax %</label>
                <input type="number" min={0} max={100} value={form.tax}
                  onChange={e => setForm(p => ({ ...p, tax: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Payment method</label>
                <select value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white">
                  {['cash','card','insurance','upi'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Total preview */}
            <div className="rounded-lg bg-violet-50 px-4 py-3 text-right text-sm">
              <span className="text-gray-500">Subtotal ₹{subtotal.toFixed(2)} · After discount &amp; tax: </span>
              <span className="text-base font-bold text-violet-700">₹{total.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60">
                {submitting ? 'Creating…' : 'Create invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View bill modal */}
      {viewBill && (
        <Modal title={`Invoice #${viewBill._id.slice(-6).toUpperCase()}`} onClose={() => setViewBill(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Patient</span><span>{viewBill.patient?.user?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge status={viewBill.status} /></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{viewBill.paymentMethod}</span></div>
            <div className="border-t border-gray-100 pt-3">
              {viewBill.items.map((it, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span>{it.description} × {it.quantity}</span>
                  <span>₹{(it.quantity * it.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1">
              <div className="flex justify-between text-gray-500"><span>Discount</span><span>{viewBill.discount}%</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax</span><span>{viewBill.tax}%</span></div>
              <div className="flex justify-between font-semibold text-base"><span>Total</span><span className="text-violet-700">₹{viewBill.total.toFixed(2)}</span></div>
            </div>
            <button onClick={() => printBill(viewBill)}
              className="mt-2 w-full rounded-lg border border-violet-200 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50">
              Print / Save as PDF
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}