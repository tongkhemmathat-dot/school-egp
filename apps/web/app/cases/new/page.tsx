export default function NewCasePage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold">Create Procurement Case</h2>
      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Case Title</label>
            <input className="mt-1 w-full rounded border px-3 py-2" placeholder="จัดจ้างทั่วไป" />
          </div>
          <div>
            <label className="text-sm font-medium">Case Type</label>
            <select className="mt-1 w-full rounded border px-3 py-2">
              <option>HIRE</option>
              <option>PURCHASE</option>
              <option>LUNCH</option>
              <option>INTERNET</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Backdated Case</label>
            <select className="mt-1 w-full rounded border px-3 py-2">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Requested By</label>
            <input className="mt-1 w-full rounded border px-3 py-2" placeholder="เจ้าหน้าที่พัสดุ" />
          </div>
        </div>
        <button className="mt-6 rounded bg-blue-600 px-4 py-2 text-white">Create Case</button>
      </div>
    </div>
  );
}
