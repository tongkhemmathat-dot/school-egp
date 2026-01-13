import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AUTH_COOKIE_NAME } from "./auth.constants";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          if (!req) return null;
          const cookies = (req as { cookies?: Record<string, string> }).cookies;
          return cookies?.[AUTH_COOKIE_NAME] || null;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "dev-secret"
    });
  }

  async validate(payload: { sub: string; role: string; orgId: string }) {
    return payload;
  }
}
