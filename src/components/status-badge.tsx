import type { ApprovalStatus, VisitStatus } from "@prisma/client";
import { approvalLabel, visitStatusLabel } from "@/lib/format";

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const styles = { PENDING: "amber", APPROVED: "green", REJECTED: "red", WAIT: "blue" }[status];
  return <span className={`status-badge ${styles}`}><span className="status-dot" />{approvalLabel(status)}</span>;
}
export function VisitBadge({ status }: { status: VisitStatus }) {
  const styles = { EXPECTED: "slate", CHECKED_IN: "green", CHECKED_OUT: "slate", CANCELLED: "red" }[status];
  return <span className={`status-badge ${styles}`}><span className="status-dot" />{visitStatusLabel(status)}</span>;
}
export function ActiveBadge({ active }: { active: boolean }) {
  return <span className={`status-badge ${active ? "green" : "slate"}`}><span className="status-dot" />{active ? "Active" : "Inactive"}</span>;
}
