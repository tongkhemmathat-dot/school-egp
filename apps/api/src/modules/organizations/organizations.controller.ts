import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  CreateCategorySchema,
  CreateItemSchema,
  CreateOrganizationSchema,
  CreateStaffMemberSchema,
  CreateUnitSchema,
  CreateUserSchema,
  CreateVendorSchema,
  CreateWarehouseSchema,
  UpdateCategorySchema,
  UpdateItemSchema,
  UpdateOrganizationSchema,
  UpdateStaffMemberSchema,
  UpdateUnitSchema,
  UpdateUserSchema,
  UpdateVendorSchema,
  UpdateWarehouseSchema
} from "@school-egp/shared";
import { parseSchema } from "../../common/validation";
import { getRequestMeta } from "../../common/request-meta";
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

  @Post("organizations")
  @Roles("Admin")
  createOrg(
    @Req() req: any,
    @Body()
    body: {
      name: string;
      address?: string;
      affiliation?: string;
      studentCount?: number;
      officerName?: string;
      headOfficerName?: string;
      financeOfficerName?: string;
      directorName?: string;
    }
  ) {
    const payload = parseSchema(CreateOrganizationSchema, body);
    return this.orgs.createOrg(req.user.sub, payload, getRequestMeta(req));
  }

  @Patch("organizations/:id")
  @Roles("Admin")
  updateOrg(
    @Req() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      address?: string;
      affiliation?: string;
      studentCount?: number;
      officerName?: string;
      headOfficerName?: string;
      financeOfficerName?: string;
      directorName?: string;
    }
  ) {
    const payload = parseSchema(UpdateOrganizationSchema, body);
    return this.orgs.updateOrg(id, req.user.sub, payload, getRequestMeta(req));
  }

  @Get("organization")
  @Roles("Admin", "ProcurementOfficer")
  getCurrentOrg(@Req() req: any) {
    return this.orgs.getOrg(req.user.orgId);
  }

  @Patch("organization")
  @Roles("Admin", "ProcurementOfficer")
  updateCurrentOrg(
    @Req() req: any,
    @Body()
    body: {
      name?: string;
      address?: string;
      affiliation?: string;
      studentCount?: number;
      officerName?: string;
      headOfficerName?: string;
      financeOfficerName?: string;
      directorName?: string;
    }
  ) {
    const payload = parseSchema(UpdateOrganizationSchema, body);
    return this.orgs.updateOrg(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Delete("organizations/:id")
  @Roles("Admin")
  async deleteOrg(@Req() req: any, @Param("id") id: string) {
    await this.orgs.deleteOrg(id, req.user.sub, getRequestMeta(req));
    return { ok: true };
  }

  @Get("users")
  @Roles("Admin")
  listUsers(@Req() req: any) {
    return this.orgs.listUsers(req.user.orgId);
  }

  @Post("users")
  @Roles("Admin")
  createUser(@Req() req: any, @Body() body: { name: string; email: string; password: string; role: string }) {
    const payload = parseSchema(CreateUserSchema, body);
    return this.orgs.createUser(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Patch("users/:id")
  @Roles("Admin")
  updateUser(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { name?: string; role?: string }
  ) {
    const payload = parseSchema(UpdateUserSchema, body);
    return this.orgs.updateUser(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete("users/:id")
  @Roles("Admin")
  async deleteUser(@Req() req: any, @Param("id") id: string) {
    await this.orgs.deleteUser(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Get("vendors")
  @Roles("Admin", "ProcurementOfficer")
  listVendors(@Req() req: any) {
    return this.orgs.listVendors(req.user.orgId);
  }

  @Post("vendors")
  @Roles("Admin", "ProcurementOfficer")
  createVendor(
    @Req() req: any,
    @Body()
    body: {
      code?: string;
      name: string;
      taxId?: string;
      citizenId?: string;
      address?: string;
      phone?: string;
      bankAccount?: string;
      bankAccountName?: string;
      bankName?: string;
      bankBranch?: string;
    }
  ) {
    const payload = parseSchema(CreateVendorSchema, body);
    return this.orgs.createVendor(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Patch("vendors/:id")
  @Roles("Admin", "ProcurementOfficer")
  updateVendor(
    @Req() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      code?: string;
      name?: string;
      taxId?: string;
      citizenId?: string;
      address?: string;
      phone?: string;
      bankAccount?: string;
      bankAccountName?: string;
      bankName?: string;
      bankBranch?: string;
    }
  ) {
    const payload = parseSchema(UpdateVendorSchema, body);
    return this.orgs.updateVendor(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete("vendors/:id")
  @Roles("Admin", "ProcurementOfficer")
  async deleteVendor(@Req() req: any, @Param("id") id: string) {
    await this.orgs.deleteVendor(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Get("staff")
  @Roles("Admin", "ProcurementOfficer")
  listStaff(@Req() req: any) {
    return this.orgs.listStaffMembers(req.user.orgId);
  }

  @Post("staff")
  @Roles("Admin", "ProcurementOfficer")
  createStaff(@Req() req: any, @Body() body: { name: string; position: string }) {
    const payload = parseSchema(CreateStaffMemberSchema, body);
    return this.orgs.createStaffMember(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Patch("staff/:id")
  @Roles("Admin", "ProcurementOfficer")
  updateStaff(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { name?: string; position?: string }
  ) {
    const payload = parseSchema(UpdateStaffMemberSchema, body);
    return this.orgs.updateStaffMember(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete("staff/:id")
  @Roles("Admin", "ProcurementOfficer")
  async deleteStaff(@Req() req: any, @Param("id") id: string) {
    await this.orgs.deleteStaffMember(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Get("units")
  @Roles("Admin", "ProcurementOfficer")
  listUnits(@Req() req: any) {
    return this.orgs.listUnits(req.user.orgId);
  }

  @Post("units")
  @Roles("Admin", "ProcurementOfficer")
  createUnit(@Req() req: any, @Body() body: { name: string }) {
    const payload = parseSchema(CreateUnitSchema, body);
    return this.orgs.createUnit(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Patch("units/:id")
  @Roles("Admin", "ProcurementOfficer")
  updateUnit(@Req() req: any, @Param("id") id: string, @Body() body: { name?: string }) {
    const payload = parseSchema(UpdateUnitSchema, body);
    return this.orgs.updateUnit(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete("units/:id")
  @Roles("Admin", "ProcurementOfficer")
  async deleteUnit(@Req() req: any, @Param("id") id: string) {
    await this.orgs.deleteUnit(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Get("categories")
  @Roles("Admin", "ProcurementOfficer")
  listCategories(@Req() req: any) {
    return this.orgs.listCategories(req.user.orgId);
  }

  @Post("categories")
  @Roles("Admin", "ProcurementOfficer")
  createCategory(@Req() req: any, @Body() body: { name: string }) {
    const payload = parseSchema(CreateCategorySchema, body);
    return this.orgs.createCategory(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Patch("categories/:id")
  @Roles("Admin", "ProcurementOfficer")
  updateCategory(@Req() req: any, @Param("id") id: string, @Body() body: { name?: string }) {
    const payload = parseSchema(UpdateCategorySchema, body);
    return this.orgs.updateCategory(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete("categories/:id")
  @Roles("Admin", "ProcurementOfficer")
  async deleteCategory(@Req() req: any, @Param("id") id: string) {
    await this.orgs.deleteCategory(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Get("warehouses")
  @Roles("Admin", "ProcurementOfficer")
  listWarehouses(@Req() req: any) {
    return this.orgs.listWarehouses(req.user.orgId);
  }

  @Post("warehouses")
  @Roles("Admin", "ProcurementOfficer")
  createWarehouse(@Req() req: any, @Body() body: { name: string }) {
    const payload = parseSchema(CreateWarehouseSchema, body);
    return this.orgs.createWarehouse(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Patch("warehouses/:id")
  @Roles("Admin", "ProcurementOfficer")
  updateWarehouse(@Req() req: any, @Param("id") id: string, @Body() body: { name?: string }) {
    const payload = parseSchema(UpdateWarehouseSchema, body);
    return this.orgs.updateWarehouse(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete("warehouses/:id")
  @Roles("Admin", "ProcurementOfficer")
  async deleteWarehouse(@Req() req: any, @Param("id") id: string) {
    await this.orgs.deleteWarehouse(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Get("items")
  @Roles("Admin", "ProcurementOfficer")
  listItems(@Req() req: any) {
    return this.orgs.listItems(req.user.orgId);
  }

  @Post("items")
  @Roles("Admin", "ProcurementOfficer")
  createItem(@Req() req: any, @Body() body: { name: string }) {
    const payload = parseSchema(CreateItemSchema, body);
    return this.orgs.createItem(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Patch("items/:id")
  @Roles("Admin", "ProcurementOfficer")
  updateItem(@Req() req: any, @Param("id") id: string, @Body() body: { name?: string }) {
    const payload = parseSchema(UpdateItemSchema, body);
    return this.orgs.updateItem(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete("items/:id")
  @Roles("Admin", "ProcurementOfficer")
  async deleteItem(@Req() req: any, @Param("id") id: string) {
    await this.orgs.deleteItem(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }
}
