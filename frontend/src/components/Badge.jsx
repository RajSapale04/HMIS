const COLOR = {
  scheduled:  'bg-blue-100 text-blue-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  'no-show':  'bg-gray-100 text-gray-600',
  pending:    'bg-amber-100 text-amber-700',
  paid:       'bg-green-100 text-green-700',
  partial:    'bg-blue-100 text-blue-700',
  waived:     'bg-purple-100 text-purple-700',
  admin:      'bg-violet-100 text-violet-700',
  doctor:     'bg-blue-100 text-blue-700',
  patient:    'bg-teal-100 text-teal-700',
  staff:      'bg-amber-100 text-amber-700',
};

export default function Badge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${COLOR[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}