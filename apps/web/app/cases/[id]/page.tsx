const tabs = ["summary", "lines", "documents", "approvals", "audit"];

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Case {params.id}</h2>
      <div className="mt-4 flex gap-2">
        {tabs.map((tab) => (
          <button key={tab} className="rounded border px-3 py-1 text-sm capitalize">
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Summary</h3>
          <p className="mt-2 text-sm text-slate-500">รายละเอียดคดีจัดซื้อ/จัดจ้าง</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Documents</h3>
          <p className="mt-2 text-sm text-slate-500">แสดงรายการ PDF และ ZIP สำหรับดาวน์โหลด</p>
          <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white">Generate Document Pack</button>
        </div>
      </div>
    </div>
  );
}
