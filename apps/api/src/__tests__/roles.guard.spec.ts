import { RolesGuard } from "../modules/auth/roles.guard";

describe("RolesGuard", () => {
  it("allows admin to pass any role", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["ProcurementOfficer"])
    } as any;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: "Admin" } }) })
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("blocks roles not in allowlist", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["Approver"])
    } as any;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: "Viewer" } }) })
    } as any;

    expect(guard.canActivate(context)).toBe(false);
  });

  it("allows when no roles metadata is present", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined)
    } as any;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: "Viewer" } }) })
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });
});
