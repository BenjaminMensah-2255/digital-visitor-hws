import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable", database: "disconnected", timestamp: new Date().toISOString() }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
