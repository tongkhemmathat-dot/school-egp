# RBAC Roles

- **Admin**: Full access to admin/master data, users, templates, and all modules.
- **ProcurementOfficer**: Manage cases, documents, inventory, and assets.
- **Approver**: Submit/approve/reject cases and view reports.
- **Viewer**: Read-only access to reports and case summaries.

## Permission map
- Admin: `admin:manage`, `cases:manage`, `inventory:manage`, `assets:manage`, `reports:view`
- ProcurementOfficer: `cases:manage`, `inventory:manage`, `assets:manage`, `reports:view`
- Approver: `cases:approve`, `reports:view`
- Viewer: `reports:view`

## Enforcement
- API: JWT role claims + `RolesGuard`.
- Web: Next.js middleware blocks unauthenticated access and non-admin access to `/admin`, plus UI hides restricted nav/actions.
