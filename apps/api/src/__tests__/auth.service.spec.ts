import { AuthService } from "../modules/auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import { hash } from "bcryptjs";

describe("AuthService", () => {
  it("login returns access token and safe user", async () => {
    const passwordHash = await hash("secret123", 4);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "user-1",
          orgId: "org-1",
          name: "Admin",
          email: "admin@example.com",
          role: "Admin",
          passwordHash
        })
      }
    } as any;
    const jwt = {
      signAsync: jest.fn().mockResolvedValue("token")
    } as unknown as JwtService;

    const service = new AuthService(prisma, jwt);
    const result = await service.login("admin@example.com", "secret123");

    expect(result.accessToken).toBe("token");
    expect(result.user).toEqual(
      expect.objectContaining({
        id: "user-1",
        email: "admin@example.com",
        role: "Admin"
      })
    );
    expect((result.user as any).passwordHash).toBeUndefined();
    expect(jwt.signAsync).toHaveBeenCalled();
  });
});
