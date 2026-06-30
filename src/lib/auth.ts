import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "dvl_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({ data: { tokenHash: tokenHash(token), userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  cookieStore.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: {
      user: {
        include: { company: true, staffProfile: true },
      },
    },
  });

  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.active ||
    (session.user.company && !session.user.company.active)
  ) {
    return null;
  }

  return session.user;
});

export async function requireUser(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) redirect("/dashboard?error=forbidden");
  return user;
}

export function tenantId(user: Awaited<ReturnType<typeof requireUser>>) {
  if (!user.companyId) throw new Error("Your account is not assigned to a company.");
  return user.companyId;
}
