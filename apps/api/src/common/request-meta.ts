export function getRequestMeta(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }) {
  const raw = req.headers?.["user-agent"];
  const userAgent = Array.isArray(raw) ? raw.join(";") : raw;
  return {
    ip: req.ip || null,
    userAgent: userAgent || null
  };
}
