# RBAC Roles

- **Admin**: Full access to admin/master data, users, templates.
- **ProcurementOfficer**: Manage cases, generate documents, inventory, assets.
- **Approver**: View cases, documents, approvals.
- **Viewer**: Read-only access to cases and reports.

Enforcement uses JWT role claims and `RolesGuard` in the API.
