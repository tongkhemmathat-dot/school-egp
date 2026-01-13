const cases = [
  { id: "CASE-001", title: "ซื้อวัสดุสำนักงาน", type: "PURCHASE", status: "DRAFT" },
  { id: "CASE-002", title: "จัดจ้างทั่วไป", type: "HIRE", status: "IN_PROGRESS" }
];

export default function CasesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Cases</h2>
        <a className="rounded bg-blue-600 px-4 py-2 text-white" href="/cases/new">
          New Case
        </a>
      </div>
      <div className="mt-6 rounded-lg bg-white p-4 shadow">
        <div className="mb-4 flex gap-2">
          <input className="w-64 rounded border px-3 py-2" placeholder="Search cases" />
          <select className="rounded border px-3 py-2">
            <option>All Types</option>
            <option>HIRE</option>
            <option>PURCHASE</option>
          </select>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-sm text-slate-500">
              <th className="py-2">Case ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">
                  <a className="text-blue-600" href={`/cases/${item.id}`}>
                    {item.id}
                  </a>
                </td>
                <td>{item.title}</td>
                <td>{item.type}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
