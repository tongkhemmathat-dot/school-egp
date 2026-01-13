import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";
import { LoginRequestSchema } from "@school-egp/shared";
import { parseSchema } from "../../common/validation";
import { AuthService } from "./auth.service";
import { AUTH_COOKIE_NAME, authCookieOptions } from "./auth.constants";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const payload = parseSchema(LoginRequestSchema, body);
    const result = await this.authService.login(payload.email, payload.password);
    res.cookie(AUTH_COOKIE_NAME, result.accessToken, authCookieOptions(process.env.NODE_ENV === "production"));
    return result;
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  async me(@Req() req: any) {
    return this.authService.me(req.user.sub);
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions(process.env.NODE_ENV === "production"));
    return { ok: true };
  }
}
