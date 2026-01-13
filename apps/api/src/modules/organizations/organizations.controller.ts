import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { OrganizationsService } from "./organizations.service";

@Controller("admin")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Get("organizations")
  @Roles("Admin")
  listOrgs() {
    return this.orgs.listOrgs();
  }

  @Post("users")
  @Roles("Admin")
  createUser(@Req() req: any, @Body() body: { name: string; email: string; password: string; role: string }) {
    return this.orgs.createUser(req.user.orgId, req.user.sub, body);
  }
}
