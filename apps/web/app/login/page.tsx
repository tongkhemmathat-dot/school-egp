export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow">
      <h2 className="text-2xl font-semibold">เข้าสู่ระบบ</h2>
      <p className="mt-2 text-sm text-slate-500">ใช้บัญชีที่ผู้ดูแลระบบสร้างไว้</p>
      <form className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">อีเมล</label>
          <input className="mt-1 w-full rounded border px-3 py-2" placeholder="admin@school.local" />
        </div>
        <div>
          <label className="text-sm font-medium">รหัสผ่าน</label>
          <input type="password" className="mt-1 w-full rounded border px-3 py-2" placeholder="••••••" />
        </div>
        <button className="w-full rounded bg-blue-600 px-4 py-2 text-white">เข้าสู่ระบบ</button>
      </form>
    </div>
  );
}
