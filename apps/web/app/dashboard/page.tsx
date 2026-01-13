export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { label: "Active Cases", value: "12" },
          { label: "Pending Approvals", value: "4" },
          { label: "Generated Docs", value: "58" }
        ].map((card) => (
          <div key={card.label} className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
