import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    
    // Get IP address from various headers (supports proxies/CDNs)
    const ip = 
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") || // Cloudflare
      "Unknown";
    
    const userAgent = headersList.get("user-agent") || "Unknown";
    
    return NextResponse.json({
      ok: true,
      ip,
      userAgent,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Visit tracking error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}