# Troubleshooting

## Login redirects back to /login
- Ensure `JWT_SECRET` is identical for API and web middleware.
- Clear browser cookies for `school-egp.token` and try logging in again.

## Document generation fails
- Confirm the converter service is running (`http://localhost:5000`).
- Check `/templates/<packId>/template.xlsm` exists and matches `pack.json`.
- Verify the API container can write to `/data`.

## Missing PDFs in output
- Ensure the template sheets listed in `pack.json` are printable.
- For per-sheet exports, confirm sheet order matches the expected output order.

## Prisma errors in CI
- Run `npm run prisma:generate --workspace apps/api`.
- Ensure `DATABASE_URL` points to a reachable Postgres instance.

## “Not signed in” in UI
- Refresh the page to let the session restore from cookies.
- Ensure the API set-cookie response is not blocked by browser settings.
