"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { Organization } from "../../lib/types";

export default function AdminPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ProcurementOfficer"
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<Organization[]>("admin/organizations")
      .then((data) => {
        if (!active) return;
        setOrgs(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load organizations");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("admin/users", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setSuccess("User created.");
      setForm({ name: "", email: "", password: "", role: form.role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Admin</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Organizations</h3>
          {loading ? <p className="mt-3 text-sm text-slate-500">Loading...</p> : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {orgs.map((org) => (
              <li key={org.id} className="rounded border px-3 py-2">
                <div className="font-medium text-slate-800">{org.name}</div>
                <div className="text-xs text-slate-400">{org.id}</div>
              </li>
            ))}
            {!loading && orgs.length === 0 ? <li>No organizations.</li> : null}
          </ul>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Create User</h3>
          <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
                type="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                type="password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="Admin">Admin</option>
                <option value="ProcurementOfficer">ProcurementOfficer</option>
                <option value="Approver">Approver</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            {success ? <p className="text-sm text-green-600">{success}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : "Create User"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
