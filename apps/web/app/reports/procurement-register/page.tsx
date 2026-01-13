export default function ProcurementRegisterReport() {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Procurement Register</h2>
      <div className="mt-4 rounded-lg bg-white p-6 shadow">
        <div className="flex flex-wrap gap-2">
          <input className="w-64 rounded border px-3 py-2" placeholder="Search" />
          <select className="rounded border px-3 py-2">
            <option>All Types</option>
            <option>HIRE</option>
            <option>PURCHASE</option>
          </select>
          <button className="rounded bg-blue-600 px-4 py-2 text-white">Export XLSX</button>
        </div>
        <p className="mt-4 text-sm text-slate-500">แสดงผลรายงานทะเบียนพัสดุ</p>
      </div>
    </div>
  );
}
