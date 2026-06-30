# MVP requirements coverage

This checklist maps the boss-provided `Digital_Visitors_Log_Team_Document.docx` and the agreed MVP brief to the delivered application.

| Requirement | Status | Implementation |
| --- | --- | --- |
| Login/logout and password hashing | Complete | Salted `scrypt` hashes, constant-time comparison, HTTP-only opaque sessions, password change |
| Four access roles | Complete | System Admin, Company Admin, Reception, and Staff enforced in pages and server actions |
| Protected routes | Complete | Optimistic Proxy check plus authoritative database authorization in layouts/actions/endpoints |
| Company management | Complete | Create with first company admin, view, edit, activate, and soft-deactivate |
| Multi-company isolation | Complete | `companyId` relations, tenant-scoped reads/writes, and tenant-filtered CSV export |
| Staff management | Complete | Add, edit, role/department assignment, and soft-deactivation with retained history |
| Visitor registration | Complete | Required contact/purpose/host/arrival fields with optional email and ID details |
| Host decision workflow | Complete | Pending inbox; approve, reject, or wait; optional response and decision timestamp |
| Reception status visibility | Complete | Approval state and host response refresh automatically every 10 seconds across devices |
| Visitor check-in/check-out | Complete | State-guarded, timestamped transitions; only approved expected visits can enter |
| Staff attendance | Complete | Daily clock-in/out with staff/company/date and company-admin history |
| Dashboard cards | Complete | Today, pending, approved, rejected, and currently clocked-in totals |
| Visitor reports | Complete | Date range, visitor, host, and status filtering with safe CSV export |
| Seed/demo data | Complete | Two companies, an admin for each company, all roles, visits in every decision state, attendance |
| Setup/deployment support | Complete | Migration, seed, environment example, Docker Compose, Neon guidance, health endpoint |

## Deliberately outside the MVP

The source document presents these as advanced or future capabilities, and the agreed brief explicitly excludes them from this build: OCR/ID scanning, visitor photos, QR passes, voice transcription, AI receptionist, SMS, WhatsApp, multilingual UI, advanced analytics, subscriptions/billing, and PDF/Excel exports. Email delivery is also deferred; the MVP provides an authenticated in-app request inbox and immediate shared status instead.
