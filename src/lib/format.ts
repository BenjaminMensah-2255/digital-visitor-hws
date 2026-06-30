import { ApprovalStatus, UserRole, VisitStatus } from "@prisma/client";

export function roleLabel(role: UserRole) {
  return {
    SYSTEM_ADMIN: "System Admin",
    COMPANY_ADMIN: "Company Admin",
    RECEPTION: "Reception",
    STAFF: "Staff",
  }[role];
}

export function approvalLabel(status: ApprovalStatus) {
  return status === "WAIT" ? "Please wait" : status.charAt(0) + status.slice(1).toLowerCase();
}

export function visitStatusLabel(status: VisitStatus) {
  return status.split("_").map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value: Date | string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function initials(name: string) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}
