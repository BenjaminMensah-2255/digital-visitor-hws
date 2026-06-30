# Visentry — Digital Visitors Log

Visentry is a clean, role-based visitor and staff attendance system built as a lecturer-friendly MVP. It uses Next.js 16, React 19, TypeScript, Tailwind CSS 4, PostgreSQL, and Prisma.

## MVP scope

Implemented:

- Secure email/password login and logout with `scrypt` password hashing
- Revocable, opaque database sessions in HTTP-only cookies
- Backend and UI role checks for System Admin, Company Admin, Reception, and Staff
- Multi-tenant company isolation through `companyId` on company-owned records
- Company creation with an initial administrator, editing, activation, and soft deactivation
- Staff creation, editing, role assignment, and soft deactivation
- Visitor registration with optional identity details and a selected staff host
- Staff approval, rejection, or “please wait” decisions with timestamps, messages, and automatic cross-device refresh
- Reception check-in/check-out with approval checks
- Staff clock-in/clock-out and company attendance history
- Visitor dashboard metrics, searchable history, and filtered CSV export
- Audit entries for sign-in and important write operations
- Self-service password changes that revoke other sessions
- Responsive dashboard, realistic sample data, migration, and seed script

See the full [MVP requirements coverage](docs/mvp-requirements.md) for traceability to the supplied project document.

Intentionally reserved for future versions: OCR/document scanning, QR passes, voice transcription, SMS or WhatsApp notifications, AI receptionist features, multilingual support, password reset/email delivery, multi-factor authentication, visitor preregistration links, badge printing, and advanced analytics.

## Requirements

- Node.js 20.9 or newer
- npm
- PostgreSQL 14 or newer, or Docker Desktop for the included Compose setup

## Quick setup

1. Install packages:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   On PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Start PostgreSQL. The included development database is optional but convenient:

   ```bash
   docker compose up -d
   ```

4. Generate the client, apply the included migration, and load demo data:

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. Start the app and open [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

> `npm run db:seed` clears existing application records before inserting the demo dataset. Use it only on a development database.

## Demo credentials

Every seeded account uses the password `Demo@123`.

| Role | Email | Best page to demo |
| --- | --- | --- |
| System Admin | `system@visentry.demo` | Companies |
| Company Admin | `admin@acme.demo` | Staff, reports, attendance |
| Reception | `reception@acme.demo` | Visitor desk, reports |
| Staff | `staff@acme.demo` | Visit requests, attendance |

An additional seeded staff host is available at `alex@acme.demo` with the same password.
The second sample tenant has a company administrator at `admin@northstar.demo`.

## Role flows

- **System Admin:** manages tenant companies and can suspend a company. A suspended company’s users are signed out and cannot authenticate.
- **Company Admin:** manages only staff in their own company, reviews attendance, and views visitor reports.
- **Reception:** registers visitors, sees host decisions, checks approved visitors in and on-site visitors out, and exports reports.
- **Staff:** sees only requests assigned to their staff profile, records a decision/message, and manages their own attendance.

Routes are protected in two layers: Next.js Proxy performs an early session-cookie check, while every dashboard page, server action, and export endpoint verifies the database session, user role, account/company active state, and tenant ownership.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Apply/create development migrations |
| `npm run db:deploy` | Apply committed migrations in hosted/production environments |
| `npm run db:seed` | Reset and seed demo records |
| `npm run db:verify` | Check database connectivity, demo roles, and tenant admins |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```text
prisma/
  migrations/             PostgreSQL migration history
  schema.prisma           Tenant-aware data model
  seed.ts                 Demo organizations and role flows
src/
  app/
    (dashboard)/          Protected role pages
    api/reports/          Authorized CSV endpoint
    actions.ts            Validated, authorized server actions
    login/                Public authentication screen
  components/             Dashboard UI primitives
  lib/                    Auth, Prisma, hashing, and formatting
  proxy.ts                Optimistic protected-route redirect
```

## Data and security notes

- The browser receives a random session token; only its SHA-256 digest is stored in PostgreSQL.
- Passwords are salted and hashed with Node.js `scrypt` and compared in constant time.
- Every company-owned mutation includes `companyId` in its database predicate. Client-submitted record IDs are never trusted as authorization.
- Staff and companies use active flags rather than destructive deletion, preserving visitor and attendance history.
- CSV responses are private and uncached, and only Company Admin or Reception roles can export their own company’s records.
- For production, serve over HTTPS, set `SESSION_COOKIE_SECURE=true`, use a managed PostgreSQL database, rotate demo passwords, and add rate limiting at the reverse proxy or hosting platform.

## Environment variables

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digital_visitors?schema=public"
SESSION_COOKIE_SECURE="false"
```

Set `SESSION_COOKIE_SECURE=true` in production. Do not commit a real `.env` file.

### Using Neon

You can use the pooled connection string copied from Neon instead of local Docker. The application automatically adds a 15-second connection timeout so a suspended Neon compute has time to wake up. With Neon configured, skip `docker compose up -d`. Use a direct, non-pooled Neon connection for schema migrations if your pooled endpoint rejects migration operations.
