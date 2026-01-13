import { Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcryptjs";
import type { Role } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listOrgs() {
    return this.prisma.organization.findMany({ orderBy: { createdAt: "desc" } });
  }

  async createOrg(userId: string, data: { name: string }, meta?: { ip?: string | null; userAgent?: string | null }) {
    const org = await this.prisma.organization.create({ data: { name: data.name } });
    await this.audit.record({
      orgId: org.id,
      userId,
      action: "CREATE",
      entity: "organization",
      entityId: org.id,
      after: org,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return org;
  }

  async updateOrg(
    orgId: string,
    userId: string,
    data: { name?: string },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!before) throw new NotFoundException("Organization not found");
    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data
    });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "organization",
      entityId: orgId,
      before,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return updated;
  }

  async deleteOrg(orgId: string, userId: string, meta?: { ip?: string | null; userAgent?: string | null }) {
    const before = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!before) throw new NotFoundException("Organization not found");
    await this.prisma.organization.delete({ where: { id: orgId } });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "organization",
      entityId: orgId,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async listUsers(orgId: string) {
    return this.prisma.user.findMany({
      where: { orgId },
      select: { id: true, orgId: true, name: true, email: true, role: true, createdAt: true }
    });
  }

  async createUser(
    orgId: string,
    userId: string,
    data: { name: string; email: string; password: string; role: Role },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const user = await this.prisma.user.create({
      data: {
        orgId,
        name: data.name,
        email: data.email,
        passwordHash: await hash(data.password, 10),
        role: data.role
      }
    });
    const { passwordHash, ...safeUser } = user;
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "user",
      entityId: user.id,
      after: safeUser,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return safeUser;
  }

  async updateUser(
    orgId: string,
    userId: string,
    targetUserId: string,
    data: { name?: string; role?: Role },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.user.findFirst({ where: { id: targetUserId, orgId } });
    if (!before) throw new NotFoundException("User not found");
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data
    });
    const { passwordHash, ...safeUser } = updated;
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "user",
      entityId: targetUserId,
      before,
      after: safeUser,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return safeUser;
  }

  async deleteUser(
    orgId: string,
    userId: string,
    targetUserId: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.user.findFirst({ where: { id: targetUserId, orgId } });
    if (!before) throw new NotFoundException("User not found");
    await this.prisma.user.delete({ where: { id: targetUserId } });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "user",
      entityId: targetUserId,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async listVendors(orgId: string) {
    return this.prisma.vendor.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } });
  }

  async createVendor(
    orgId: string,
    userId: string,
    data: { name: string; taxId?: string | null; address?: string | null; phone?: string | null },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const vendor = await this.prisma.vendor.create({
      data: {
        orgId,
        name: data.name,
        taxId: data.taxId ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null
      }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "vendor",
      entityId: vendor.id,
      after: vendor,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return vendor;
  }

  async updateVendor(
    orgId: string,
    userId: string,
    vendorId: string,
    data: { name?: string; taxId?: string | null; address?: string | null; phone?: string | null },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.vendor.findFirst({ where: { id: vendorId, orgId } });
    if (!before) throw new NotFoundException("Vendor not found");
    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data
    });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "vendor",
      entityId: vendorId,
      before,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return updated;
  }

  async deleteVendor(
    orgId: string,
    userId: string,
    vendorId: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.vendor.findFirst({ where: { id: vendorId, orgId } });
    if (!before) throw new NotFoundException("Vendor not found");
    await this.prisma.vendor.delete({ where: { id: vendorId } });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "vendor",
      entityId: vendorId,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async listUnits(orgId: string) {
    return this.prisma.unit.findMany({ where: { orgId }, orderBy: { name: "asc" } });
  }

  async createUnit(
    orgId: string,
    userId: string,
    data: { name: string },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const unit = await this.prisma.unit.create({ data: { orgId, name: data.name } });
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "unit",
      entityId: unit.id,
      after: unit,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return unit;
  }

  async updateUnit(
    orgId: string,
    userId: string,
    unitId: string,
    data: { name?: string },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.unit.findFirst({ where: { id: unitId, orgId } });
    if (!before) throw new NotFoundException("Unit not found");
    const updated = await this.prisma.unit.update({ where: { id: unitId }, data });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "unit",
      entityId: unitId,
      before,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return updated;
  }

  async deleteUnit(
    orgId: string,
    userId: string,
    unitId: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.unit.findFirst({ where: { id: unitId, orgId } });
    if (!before) throw new NotFoundException("Unit not found");
    await this.prisma.unit.delete({ where: { id: unitId } });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "unit",
      entityId: unitId,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async listCategories(orgId: string) {
    return this.prisma.category.findMany({ where: { orgId }, orderBy: { name: "asc" } });
  }

  async createCategory(
    orgId: string,
    userId: string,
    data: { name: string },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const category = await this.prisma.category.create({ data: { orgId, name: data.name } });
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "category",
      entityId: category.id,
      after: category,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return category;
  }

  async updateCategory(
    orgId: string,
    userId: string,
    categoryId: string,
    data: { name?: string },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.category.findFirst({ where: { id: categoryId, orgId } });
    if (!before) throw new NotFoundException("Category not found");
    const updated = await this.prisma.category.update({ where: { id: categoryId }, data });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "category",
      entityId: categoryId,
      before,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return updated;
  }

  async deleteCategory(
    orgId: string,
    userId: string,
    categoryId: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.category.findFirst({ where: { id: categoryId, orgId } });
    if (!before) throw new NotFoundException("Category not found");
    await this.prisma.category.delete({ where: { id: categoryId } });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "category",
      entityId: categoryId,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async listWarehouses(orgId: string) {
    return this.prisma.warehouse.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } });
  }

  async createWarehouse(
    orgId: string,
    userId: string,
    data: { name: string; location?: string | null },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const warehouse = await this.prisma.warehouse.create({
      data: { orgId, name: data.name, location: data.location ?? null }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "warehouse",
      entityId: warehouse.id,
      after: warehouse,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return warehouse;
  }

  async updateWarehouse(
    orgId: string,
    userId: string,
    warehouseId: string,
    data: { name?: string; location?: string | null },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.warehouse.findFirst({ where: { id: warehouseId, orgId } });
    if (!before) throw new NotFoundException("Warehouse not found");
    const updated = await this.prisma.warehouse.update({ where: { id: warehouseId }, data });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "warehouse",
      entityId: warehouseId,
      before,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return updated;
  }

  async deleteWarehouse(
    orgId: string,
    userId: string,
    warehouseId: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.warehouse.findFirst({ where: { id: warehouseId, orgId } });
    if (!before) throw new NotFoundException("Warehouse not found");
    await this.prisma.warehouse.delete({ where: { id: warehouseId } });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "warehouse",
      entityId: warehouseId,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async listItems(orgId: string) {
    return this.prisma.item.findMany({
      where: { orgId },
      include: { unit: true, category: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async createItem(
    orgId: string,
    userId: string,
    data: { name: string; sku?: string | null; unitId: string; categoryId?: string | null },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const item = await this.prisma.item.create({
      data: {
        orgId,
        name: data.name,
        sku: data.sku ?? null,
        unitId: data.unitId,
        categoryId: data.categoryId ?? null
      }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "item",
      entityId: item.id,
      after: item,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return item;
  }

  async updateItem(
    orgId: string,
    userId: string,
    itemId: string,
    data: { name?: string; sku?: string | null; unitId?: string; categoryId?: string | null },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.item.findFirst({ where: { id: itemId, orgId } });
    if (!before) throw new NotFoundException("Item not found");
    const updated = await this.prisma.item.update({ where: { id: itemId }, data });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "item",
      entityId: itemId,
      before,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return updated;
  }

  async deleteItem(
    orgId: string,
    userId: string,
    itemId: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.item.findFirst({ where: { id: itemId, orgId } });
    if (!before) throw new NotFoundException("Item not found");
    await this.prisma.item.delete({ where: { id: itemId } });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "item",
      entityId: itemId,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }
}
