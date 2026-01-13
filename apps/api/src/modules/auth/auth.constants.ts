export const AUTH_COOKIE_NAME = "school-egp.token";

export const authCookieOptions = (isProduction: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/"
});
