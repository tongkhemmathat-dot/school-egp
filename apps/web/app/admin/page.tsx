"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type {
  Category,
  Item,
  Organization,
  TemplatePack,
  Unit,
  User,
  Vendor,
  Warehouse
} from "../../lib/types";

export default function AdminPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [packs, setPacks] = useState<TemplatePack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [orgForm, setOrgForm] = useState({ name: "" });
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ProcurementOfficer"
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [vendorForm, setVendorForm] = useState({ name: "", taxId: "", address: "", phone: "" });
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  const [unitForm, setUnitForm] = useState({ name: "" });
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [warehouseForm, setWarehouseForm] = useState({ name: "", location: "" });
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);

  const [itemForm, setItemForm] = useState({ name: "", sku: "", unitId: "", categoryId: "" });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [
        orgData,
        userData,
        vendorData,
        itemData,
        warehouseData,
        categoryData,
        unitData,
        packData
      ] = await Promise.all([
        apiFetch<Organization[]>("admin/organizations"),
        apiFetch<User[]>("admin/users"),
        apiFetch<Vendor[]>("admin/vendors"),
        apiFetch<Item[]>("admin/items"),
        apiFetch<Warehouse[]>("admin/warehouses"),
        apiFetch<Category[]>("admin/categories"),
        apiFetch<Unit[]>("admin/units"),
        apiFetch<TemplatePack[]>("templates")
      ]);
      setOrgs(orgData);
      setUsers(userData);
      setVendors(vendorData);
      setItems(itemData);
      setWarehouses(warehouseData);
      setCategories(categoryData);
      setUnits(unitData);
      setPacks(packData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOrgSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (editingOrgId) {
        await apiFetch(`admin/organizations/${editingOrgId}`, {
          method: "PATCH",
          body: JSON.stringify({ name: orgForm.name })
        });
      } else {
        await apiFetch("admin/organizations", { method: "POST", body: JSON.stringify(orgForm) });
      }
      setOrgForm({ name: "" });
      setEditingOrgId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save organization");
    } finally {
      setLoading(false);
    }
  };

  const handleOrgDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`admin/organizations/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete organization");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (editingUserId) {
        await apiFetch(`admin/users/${editingUserId}`, {
          method: "PATCH",
          body: JSON.stringify({ name: userForm.name, role: userForm.role })
        });
      } else {
        await apiFetch("admin/users", { method: "POST", body: JSON.stringify(userForm) });
      }
      setUserForm({ name: "", email: "", password: "", role: "ProcurementOfficer" });
      setEditingUserId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleUserDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`admin/users/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: vendorForm.name,
        taxId: vendorForm.taxId || null,
        address: vendorForm.address || null,
        phone: vendorForm.phone || null
      };
      if (editingVendorId) {
        await apiFetch(`admin/vendors/${editingVendorId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("admin/vendors", { method: "POST", body: JSON.stringify(payload) });
      }
      setVendorForm({ name: "", taxId: "", address: "", phone: "" });
      setEditingVendorId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleVendorDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`admin/vendors/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleUnitSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (editingUnitId) {
        await apiFetch(`admin/units/${editingUnitId}`, {
          method: "PATCH",
          body: JSON.stringify(unitForm)
        });
      } else {
        await apiFetch("admin/units", { method: "POST", body: JSON.stringify(unitForm) });
      }
      setUnitForm({ name: "" });
      setEditingUnitId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save unit");
    } finally {
      setLoading(false);
    }
  };

  const handleUnitDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`admin/units/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete unit");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (editingCategoryId) {
        await apiFetch(`admin/categories/${editingCategoryId}`, {
          method: "PATCH",
          body: JSON.stringify(categoryForm)
        });
      } else {
        await apiFetch("admin/categories", { method: "POST", body: JSON.stringify(categoryForm) });
      }
      setCategoryForm({ name: "" });
      setEditingCategoryId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`admin/categories/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { name: warehouseForm.name, location: warehouseForm.location || null };
      if (editingWarehouseId) {
        await apiFetch(`admin/warehouses/${editingWarehouseId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("admin/warehouses", { method: "POST", body: JSON.stringify(payload) });
      }
      setWarehouseForm({ name: "", location: "" });
      setEditingWarehouseId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save warehouse");
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`admin/warehouses/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete warehouse");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: itemForm.name,
        sku: itemForm.sku || null,
        unitId: itemForm.unitId,
        categoryId: itemForm.categoryId || null
      };
      if (editingItemId) {
        await apiFetch(`admin/items/${editingItemId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("admin/items", { method: "POST", body: JSON.stringify(payload) });
      }
      setItemForm({ name: "", sku: "", unitId: "", categoryId: "" });
      setEditingItemId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  const handleItemDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`admin/items/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePack = async (packId: string, isActive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`templates/${packId}`, { method: "PATCH", body: JSON.stringify({ isActive }) });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update template pack");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Admin</h2>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Organizations</h3>
          <div className="mt-3 space-y-2">
            {orgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <div className="font-medium text-slate-800">{org.name}</div>
                  <div className="text-xs text-slate-400">{org.id}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    type="button"
                    onClick={() => {
                      setEditingOrgId(org.id);
                      setOrgForm({ name: org.name });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded border px-2 py-1 text-xs text-red-600"
                    type="button"
                    onClick={() => handleOrgDelete(org.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {orgs.length === 0 ? <p className="text-sm text-slate-500">No organizations.</p> : null}
          </div>
          <div className="mt-4 space-y-2">
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Organization name"
              value={orgForm.name}
              onChange={(event) => setOrgForm({ name: event.target.value })}
            />
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={handleOrgSave}
            >
              {editingOrgId ? "Update" : "Create"}
            </button>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Users</h3>
          <div className="mt-3 space-y-2 text-sm">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="font-medium text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                  <div className="text-xs text-slate-400">{user.role}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    type="button"
                    onClick={() => {
                      setEditingUserId(user.id);
                      setUserForm({ name: user.name, email: user.email, password: "", role: user.role });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded border px-2 py-1 text-xs text-red-600"
                    type="button"
                    onClick={() => handleUserDelete(user.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 ? <p className="text-sm text-slate-500">No users.</p> : null}
          </div>
          <div className="mt-4 space-y-2">
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Name"
              value={userForm.name}
              onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Email"
              value={userForm.email}
              onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={Boolean(editingUserId)}
            />
            {!editingUserId ? (
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Password"
                type="password"
                value={userForm.password}
                onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            ) : null}
            <select
              className="w-full rounded border px-3 py-2"
              value={userForm.role}
              onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="Admin">Admin</option>
              <option value="ProcurementOfficer">ProcurementOfficer</option>
              <option value="Approver">Approver</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={handleUserSave}
            >
              {editingUserId ? "Update" : "Create"}
            </button>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Vendors</h3>
          <div className="mt-3 space-y-2 text-sm">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between border-b pb-2">
                <span>{vendor.name}</span>
                <div className="flex gap-2">
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    type="button"
                    onClick={() => {
                      setEditingVendorId(vendor.id);
                      setVendorForm({ name: vendor.name, taxId: "", address: "", phone: "" });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded border px-2 py-1 text-xs text-red-600"
                    type="button"
                    onClick={() => handleVendorDelete(vendor.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {vendors.length === 0 ? <p className="text-sm text-slate-500">No vendors.</p> : null}
          </div>
          <div className="mt-4 space-y-2">
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Vendor name"
              value={vendorForm.name}
              onChange={(event) => setVendorForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={handleVendorSave}
            >
              {editingVendorId ? "Update" : "Create"}
            </button>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Items</h3>
          <div className="mt-3 space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2">
                <span>{item.name}</span>
                <div className="flex gap-2">
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    type="button"
                    onClick={() => {
                      setEditingItemId(item.id);
                      setItemForm({
                        name: item.name,
                        sku: item.sku || "",
                        unitId: item.unitId,
                        categoryId: item.categoryId || ""
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded border px-2 py-1 text-xs text-red-600"
                    type="button"
                    onClick={() => handleItemDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 ? <p className="text-sm text-slate-500">No items.</p> : null}
          </div>
          <div className="mt-4 space-y-2">
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Item name"
              value={itemForm.name}
              onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="SKU"
              value={itemForm.sku}
              onChange={(event) => setItemForm((prev) => ({ ...prev, sku: event.target.value }))}
            />
            <select
              className="w-full rounded border px-3 py-2"
              value={itemForm.unitId}
              onChange={(event) => setItemForm((prev) => ({ ...prev, unitId: event.target.value }))}
            >
              <option value="">Select unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded border px-3 py-2"
              value={itemForm.categoryId}
              onChange={(event) => setItemForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={handleItemSave}
            >
              {editingItemId ? "Update" : "Create"}
            </button>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Warehouses</h3>
          <div className="mt-3 space-y-2 text-sm">
            {warehouses.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between border-b pb-2">
                <span>{wh.name}</span>
                <div className="flex gap-2">
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    type="button"
                    onClick={() => {
                      setEditingWarehouseId(wh.id);
                      setWarehouseForm({ name: wh.name, location: wh.location || "" });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded border px-2 py-1 text-xs text-red-600"
                    type="button"
                    onClick={() => handleWarehouseDelete(wh.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {warehouses.length === 0 ? <p className="text-sm text-slate-500">No warehouses.</p> : null}
          </div>
          <div className="mt-4 space-y-2">
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Warehouse name"
              value={warehouseForm.name}
              onChange={(event) => setWarehouseForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Location"
              value={warehouseForm.location}
              onChange={(event) => setWarehouseForm((prev) => ({ ...prev, location: event.target.value }))}
            />
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={handleWarehouseSave}
            >
              {editingWarehouseId ? "Update" : "Create"}
            </button>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">Categories & Units</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold">Categories</h4>
              <div className="mt-2 space-y-2 text-sm">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between border-b pb-1">
                    <span>{cat.name}</span>
                    <div className="flex gap-2">
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(cat.id);
                          setCategoryForm({ name: cat.name });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-xs text-red-600"
                        type="button"
                        onClick={() => handleCategoryDelete(cat.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 ? <p className="text-sm text-slate-500">No categories.</p> : null}
              </div>
              <input
                className="mt-2 w-full rounded border px-3 py-2"
                placeholder="Category name"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm({ name: event.target.value })}
              />
              <button
                className="mt-2 rounded border px-3 py-2 text-sm"
                type="button"
                disabled={loading}
                onClick={handleCategorySave}
              >
                {editingCategoryId ? "Update" : "Add"}
              </button>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Units</h4>
              <div className="mt-2 space-y-2 text-sm">
                {units.map((unit) => (
                  <div key={unit.id} className="flex items-center justify-between border-b pb-1">
                    <span>{unit.name}</span>
                    <div className="flex gap-2">
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        type="button"
                        onClick={() => {
                          setEditingUnitId(unit.id);
                          setUnitForm({ name: unit.name });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-xs text-red-600"
                        type="button"
                        onClick={() => handleUnitDelete(unit.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {units.length === 0 ? <p className="text-sm text-slate-500">No units.</p> : null}
              </div>
              <input
                className="mt-2 w-full rounded border px-3 py-2"
                placeholder="Unit name"
                value={unitForm.name}
                onChange={(event) => setUnitForm({ name: event.target.value })}
              />
              <button
                className="mt-2 rounded border px-3 py-2 text-sm"
                type="button"
                disabled={loading}
                onClick={handleUnitSave}
              >
                {editingUnitId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg bg-white p-4 shadow">
        <h3 className="text-lg font-semibold">Template Packs</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-slate-500">
              <th className="py-2">Pack ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Subtype</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {packs.map((pack) => (
              <tr key={pack.id} className="border-b">
                <td className="py-2">{pack.id}</td>
                <td>{pack.name_th}</td>
                <td>{pack.caseType}</td>
                <td>{pack.subtype || "-"}</td>
                <td>
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    type="button"
                    onClick={() => handleTogglePack(pack.id, !pack.isActive)}
                  >
                    {pack.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
              </tr>
            ))}
            {packs.length === 0 ? (
              <tr>
                <td className="py-4 text-sm text-slate-500" colSpan={5}>
                  No template packs.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
