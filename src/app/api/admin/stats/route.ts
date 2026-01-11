import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const server = {
      node: process.version,
      env: process.env.NODE_ENV || "development",
      uptimeSec: Math.round(process.uptime()),
      memoryMB: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      time: new Date().toLocaleString(),
    };

    return NextResponse.json({ ok: true, server });
  } catch (err: any) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}