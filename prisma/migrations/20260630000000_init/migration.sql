CREATE TYPE "UserRole" AS ENUM ('SYSTEM_ADMIN', 'COMPANY_ADMIN', 'RECEPTION', 'STAFF');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WAIT');
CREATE TYPE "VisitStatus" AS ENUM ('EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

CREATE TABLE "Company" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "email" TEXT,
  "phone" TEXT, "address" TEXT, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "User" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "companyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StaffProfile" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "companyId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "email" TEXT NOT NULL, "phone" TEXT, "department" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Visitor" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "fullName" TEXT NOT NULL, "phone" TEXT NOT NULL,
  "email" TEXT, "idType" TEXT, "idNumber" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Visit" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "visitorId" TEXT NOT NULL, "hostStaffId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL, "arrivalTime" TIMESTAMP(3) NOT NULL,
  "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "status" "VisitStatus" NOT NULL DEFAULT 'EXPECTED', "decisionTime" TIMESTAMP(3),
  "responseMessage" TEXT, "checkInTime" TIMESTAMP(3), "checkOutTime" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Attendance" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "staffId" TEXT NOT NULL, "date" DATE NOT NULL,
  "loginTime" TIMESTAMP(3) NOT NULL, "logoutTime" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Session" (
  "id" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL, "companyId" TEXT, "actorId" TEXT, "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL, "entityId" TEXT, "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_companyId_role_active_idx" ON "User"("companyId", "role", "active");
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");
CREATE UNIQUE INDEX "StaffProfile_companyId_email_key" ON "StaffProfile"("companyId", "email");
CREATE INDEX "StaffProfile_companyId_active_idx" ON "StaffProfile"("companyId", "active");
CREATE INDEX "Visitor_companyId_fullName_idx" ON "Visitor"("companyId", "fullName");
CREATE INDEX "Visit_companyId_arrivalTime_idx" ON "Visit"("companyId", "arrivalTime");
CREATE INDEX "Visit_companyId_approvalStatus_idx" ON "Visit"("companyId", "approvalStatus");
CREATE INDEX "Visit_hostStaffId_approvalStatus_idx" ON "Visit"("hostStaffId", "approvalStatus");
CREATE UNIQUE INDEX "Attendance_staffId_date_key" ON "Attendance"("staffId", "date");
CREATE INDEX "Attendance_companyId_date_idx" ON "Attendance"("companyId", "date");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_hostStaffId_fkey" FOREIGN KEY ("hostStaffId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
