export default function AdminPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Admin</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Master Data</h3>
          <p className="text-sm text-slate-500">จัดการข้อมูลพื้นฐานและเทมเพลต</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Users & Roles</h3>
          <p className="text-sm text-slate-500">กำหนดสิทธิ์การเข้าถึง</p>
        </div>
      </div>
    </div>
  );
}
