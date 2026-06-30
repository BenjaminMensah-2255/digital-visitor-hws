"use server";

import { ApprovalStatus, Prisma, UserRole, VisitStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, deleteSession, requireUser, tenantId } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export type ActionState = { success?: string; error?: string } | undefined;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function required(value: string, label: string, minimum = 2) {
  if (value.length < minimum) throw new Error(`${label} must be at least ${minimum} characters.`);
  return value;
}

function email(value: string, label = "Email") {
  if (!emailPattern.test(value)) throw new Error(`${label} must be a valid email address.`);
  return value.toLowerCase();
}

function password(value: string, label = "Password") {
  if (value.length < 8) throw new Error(`${label} must be at least 8 characters.`);
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) throw new Error(`${label} must include at least one letter and one number.`);
  return value;
}

function friendlyError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "That email address or identifier is already in use.";
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

async function audit(actorId: string, companyId: string | null, action: string, entity: string, entityId?: string, details?: Prisma.InputJsonValue) {
  await db.auditLog.create({ data: { actorId, companyId, action, entity, entityId, details } });
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const emailAddress = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  if (!emailAddress || !password) return { error: "Enter both your email and password." };

  const user = await db.user.findUnique({ where: { email: emailAddress }, include: { company: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Email or password is incorrect." };
  if (!user.active) return { error: "This account is inactive. Contact an administrator." };
  if (user.company && !user.company.active) return { error: "This company is inactive. Contact the system administrator." };

  await createSession(user.id);
  await audit(user.id, user.companyId, "LOGIN", "Session");
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

export async function createCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser([UserRole.SYSTEM_ADMIN]);
    const name = required(text(formData, "name"), "Company name");
    const proposedSlug = text(formData, "slug") || name;
    const slug = proposedSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (slug.length < 2) throw new Error("Company slug must contain letters or numbers.");
    const emailAddress = optional(formData, "email");
    if (emailAddress) email(emailAddress);
    const adminName = required(text(formData, "adminName"), "Administrator name");
    const adminEmail = email(text(formData, "adminEmail"), "Administrator email");
    const adminPasswordHash = await hashPassword(password(text(formData, "adminPassword"), "Administrator password"));
    const adminDepartment = required(text(formData, "adminDepartment") || "Administration", "Administrator department");
    const adminPhone = optional(formData, "adminPhone");

    const company = await db.$transaction(async (tx) => {
      const createdCompany = await tx.company.create({ data: { name, slug, email: emailAddress?.toLowerCase(), phone: optional(formData, "phone"), address: optional(formData, "address") } });
      const admin = await tx.user.create({ data: { name: adminName, email: adminEmail, passwordHash: adminPasswordHash, role: UserRole.COMPANY_ADMIN, companyId: createdCompany.id } });
      await tx.staffProfile.create({ data: { userId: admin.id, companyId: createdCompany.id, name: adminName, email: adminEmail, phone: adminPhone, department: adminDepartment } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CREATE", entity: "Company", entityId: createdCompany.id, details: { name, adminEmail } } });
      return createdCompany;
    });
    revalidatePath("/companies");
    return { success: `${company.name} was created with ${adminEmail} as its company administrator.` };
  } catch (error) { return { error: friendlyError(error) }; }
}

export async function updateCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser([UserRole.SYSTEM_ADMIN]);
    const id = text(formData, "id");
    const name = required(text(formData, "name"), "Company name");
    const emailAddress = optional(formData, "email");
    if (emailAddress) email(emailAddress);
    const result = await db.company.updateMany({ where: { id }, data: { name, email: emailAddress?.toLowerCase(), phone: optional(formData, "phone"), address: optional(formData, "address") } });
    if (!result.count) throw new Error("Company not found.");
    await audit(user.id, null, "UPDATE", "Company", id, { name });
    revalidatePath("/companies");
    return { success: `${name} was updated.` };
  } catch (error) { return { error: friendlyError(error) }; }
}

export async function toggleCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser([UserRole.SYSTEM_ADMIN]);
    const id = text(formData, "id");
    const active = text(formData, "active") === "true";
    const result = await db.company.updateMany({ where: { id }, data: { active } });
    if (!result.count) throw new Error("Company not found.");
    if (!active) await db.session.deleteMany({ where: { user: { companyId: id } } });
    await audit(user.id, null, active ? "ACTIVATE" : "DEACTIVATE", "Company", id);
    revalidatePath("/companies");
    return { success: `Company ${active ? "activated" : "deactivated"}.` };
  } catch (error) { return { error: friendlyError(error) }; }
}

const staffRoles: UserRole[] = [UserRole.COMPANY_ADMIN, UserRole.RECEPTION, UserRole.STAFF];

function parseStaffRole(value: string) {
  const role = value as UserRole;
  if (!staffRoles.includes(role)) throw new Error("Select a valid staff role.");
  return role;
}

export async function createStaffAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser([UserRole.COMPANY_ADMIN]);
    const companyId = tenantId(actor);
    const name = required(text(formData, "name"), "Name");
    const emailAddress = email(text(formData, "email"));
    const temporaryPassword = password(text(formData, "password"), "Temporary password");
    const role = parseStaffRole(text(formData, "role"));
    const department = required(text(formData, "department"), "Department");

    const staff = await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name, email: emailAddress, passwordHash: await hashPassword(temporaryPassword), role, companyId } });
      return tx.staffProfile.create({ data: { userId: user.id, companyId, name, email: emailAddress, phone: optional(formData, "phone"), department } });
    });
    await audit(actor.id, companyId, "CREATE", "StaffProfile", staff.id, { name, role });
    revalidatePath("/staff");
    return { success: `${name} was added to the team.` };
  } catch (error) { return { error: friendlyError(error) }; }
}

export async function updateStaffAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser([UserRole.COMPANY_ADMIN]);
    const companyId = tenantId(actor);
    const id = text(formData, "id");
    const name = required(text(formData, "name"), "Name");
    const emailAddress = email(text(formData, "email"));
    const role = parseStaffRole(text(formData, "role"));
    const department = required(text(formData, "department"), "Department");
    const existing = await db.staffProfile.findFirst({ where: { id, companyId }, include: { user: true } });
    if (!existing) throw new Error("Staff member not found.");
    if (existing.user.role === UserRole.COMPANY_ADMIN && role !== UserRole.COMPANY_ADMIN) {
      const activeAdmins = await db.user.count({ where: { companyId, role: UserRole.COMPANY_ADMIN, active: true } });
      if (activeAdmins <= 1) throw new Error("Every active company must retain at least one active company administrator.");
    }

    await db.$transaction([
      db.staffProfile.update({ where: { id }, data: { name, email: emailAddress, phone: optional(formData, "phone"), department } }),
      db.user.update({ where: { id: existing.userId }, data: { name, email: emailAddress, role } }),
    ]);
    await audit(actor.id, companyId, "UPDATE", "StaffProfile", id, { name, role });
    revalidatePath("/staff");
    return { success: `${name} was updated.` };
  } catch (error) { return { error: friendlyError(error) }; }
}

export async function toggleStaffAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser([UserRole.COMPANY_ADMIN]);
    const companyId = tenantId(actor);
    const id = text(formData, "id");
    const active = text(formData, "active") === "true";
    const staff = await db.staffProfile.findFirst({ where: { id, companyId }, include: { user: true } });
    if (!staff) throw new Error("Staff member not found.");
    if (staff.userId === actor.id && !active) throw new Error("You cannot deactivate your own account.");
    if (!active && staff.user.role === UserRole.COMPANY_ADMIN) {
      const activeAdmins = await db.user.count({ where: { companyId, role: UserRole.COMPANY_ADMIN, active: true } });
      if (activeAdmins <= 1) throw new Error("Every active company must retain at least one active company administrator.");
    }
    await db.$transaction([
      db.staffProfile.update({ where: { id }, data: { active } }),
      db.user.update({ where: { id: staff.userId }, data: { active } }),
      ...(!active ? [db.session.deleteMany({ where: { userId: staff.userId } })] : []),
    ]);
    await audit(actor.id, companyId, active ? "ACTIVATE" : "DEACTIVATE", "StaffProfile", id);
    revalidatePath("/staff");
    return { success: `Staff member ${active ? "activated" : "deactivated"}.` };
  } catch (error) { return { error: friendlyError(error) }; }
}

export async function registerVisitorAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser([UserRole.RECEPTION]);
    const companyId = tenantId(actor);
    const fullName = required(text(formData, "fullName"), "Visitor name");
    const phone = required(text(formData, "phone"), "Phone number", 7);
    const emailAddress = optional(formData, "email");
    if (emailAddress) email(emailAddress);
    const purpose = required(text(formData, "purpose"), "Purpose of visit", 3);
    const hostStaffId = text(formData, "hostStaffId");
    const host = await db.staffProfile.findFirst({ where: { id: hostStaffId, companyId, active: true, user: { active: true, role: UserRole.STAFF } } });
    if (!host) throw new Error("Select an active host from your company.");
    const arrivalTime = new Date(text(formData, "arrivalTime"));
    if (Number.isNaN(arrivalTime.getTime())) throw new Error("Enter a valid arrival date and time.");

    const visit = await db.$transaction(async (tx) => {
      const visitor = await tx.visitor.create({ data: { companyId, fullName, phone, email: emailAddress?.toLowerCase(), idType: optional(formData, "idType"), idNumber: optional(formData, "idNumber") } });
      return tx.visit.create({ data: { companyId, visitorId: visitor.id, hostStaffId, purpose, arrivalTime } });
    });
    await audit(actor.id, companyId, "CREATE", "Visit", visit.id, { fullName, hostStaffId });
    revalidatePath("/visitors/new");
    revalidatePath("/requests");
    revalidatePath("/reports");
    return { success: `${fullName} is registered. The host has a pending request.` };
  } catch (error) { return { error: friendlyError(error) }; }
}

export async function decideVisitAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser([UserRole.STAFF]);
    const companyId = tenantId(actor);
    if (!actor.staffProfile) throw new Error("Your staff profile is missing.");
    const id = text(formData, "id");
    const decision = text(formData, "decision") as ApprovalStatus;
    if (!([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED, ApprovalStatus.WAIT] as ApprovalStatus[]).includes(decision)) throw new Error("Select a valid decision.");
    const result = await db.visit.updateMany({
      where: { id, companyId, hostStaffId: actor.staffProfile.id, status: VisitStatus.EXPECTED },
      data: { approvalStatus: decision, decisionTime: new Date(), responseMessage: optional(formData, "responseMessage") },
    });
    if (!result.count) throw new Error("This visit can no longer be changed because it is already in progress or complete.");
    await audit(actor.id, companyId, decision, "Visit", id);
    revalidatePath("/requests");
    revalidatePath("/reports");
    return { success: `Visitor marked ${decision === "WAIT" ? "as waiting" : decision.toLowerCase()}.` };
  } catch (error) { return { error: friendlyError(error) }; }
}

export async function updateVisitStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser([UserRole.RECEPTION]);
    const companyId = tenantId(actor);
    const id = text(formData, "id");
    const status = text(formData, "status") as VisitStatus;
    if (!([VisitStatus.CHECKED_IN, VisitStatus.CHECKED_OUT] as VisitStatus[]).includes(status)) throw new Error("Select a valid visit status.");
    const result = status === VisitStatus.CHECKED_IN
      ? await db.visit.updateMany({ where: { id, companyId, status: VisitStatus.EXPECTED, approvalStatus: ApprovalStatus.APPROVED }, data: { status, checkInTime: new Date() } })
      : await db.visit.updateMany({ where: { id, companyId, status: VisitStatus.CHECKED_IN }, data: { status, checkOutTime: new Date() } });
    if (!result.count) throw new Error(status === VisitStatus.CHECKED_IN ? "Only an approved, expected visitor can be checked in." : "This visitor is not currently checked in.");
    await audit(actor.id, companyId, status, "Visit", id);
    revalidatePath("/visitors/new");
    revalidatePath("/reports");
    return { success: status === VisitStatus.CHECKED_IN ? "Visitor checked in." : "Visitor checked out." };
  } catch (error) { return { error: friendlyError(error) }; }
}

export async function clockAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser([UserRole.STAFF]);
    const companyId = tenantId(actor);
    if (!actor.staffProfile) throw new Error("Your staff profile is missing.");
    const operation = text(formData, "operation");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await db.attendance.findUnique({ where: { staffId_date: { staffId: actor.staffProfile.id, date: today } } });
    if (operation === "in") {
      if (attendance && !attendance.logoutTime) throw new Error("You are already clocked in.");
      if (attendance?.logoutTime) throw new Error("Today’s attendance record is already complete.");
      await db.attendance.create({ data: { companyId, staffId: actor.staffProfile.id, date: today, loginTime: new Date() } });
    } else if (operation === "out") {
      if (!attendance || attendance.logoutTime) throw new Error("You are not currently clocked in.");
      await db.attendance.update({ where: { id: attendance.id }, data: { logoutTime: new Date() } });
    } else throw new Error("Select clock in or clock out.");
    await audit(actor.id, companyId, operation === "in" ? "CLOCK_IN" : "CLOCK_OUT", "Attendance", attendance?.id);
    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    return { success: operation === "in" ? "You are clocked in." : "You are clocked out." };
  } catch (error) { return { error: friendlyError(error) }; }
}

export async function changePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser();
    const currentPassword = text(formData, "currentPassword");
    const newPassword = password(text(formData, "newPassword"), "New password");
    const confirmation = text(formData, "confirmPassword");
    if (newPassword !== confirmation) throw new Error("New password and confirmation do not match.");
    if (currentPassword === newPassword) throw new Error("Choose a new password that is different from your current password.");

    const account = await db.user.findUnique({ where: { id: actor.id }, select: { passwordHash: true } });
    if (!account || !(await verifyPassword(currentPassword, account.passwordHash))) throw new Error("Your current password is incorrect.");
    const passwordHash = await hashPassword(newPassword);

    await db.$transaction([
      db.user.update({ where: { id: actor.id }, data: { passwordHash } }),
      db.session.deleteMany({ where: { userId: actor.id } }),
      db.auditLog.create({ data: { actorId: actor.id, companyId: actor.companyId, action: "CHANGE_PASSWORD", entity: "User", entityId: actor.id } }),
    ]);
    await createSession(actor.id);
    revalidatePath("/profile");
    return { success: "Your password was changed and other sessions were signed out." };
  } catch (error) { return { error: friendlyError(error) }; }
}
