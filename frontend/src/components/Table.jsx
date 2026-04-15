export default function Table({ columns, data, emptyMessage = 'No records found.' }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-gray-400">{emptyMessage}</td>
            </tr>
          ) : data.map((row, i) => (
            <tr key={row._id ?? i} className="transition hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-gray-700">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}