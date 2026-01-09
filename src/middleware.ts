import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect only /admin (and anything under it)
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // If no password set, don't block (useful in dev). Set it on Vercel for real protection.
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return NextResponse.next();

  const auth = req.headers.get("authorization") || "";
  const isBasic = auth.toLowerCase().startsWith("basic ");

  if (!isBasic) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    });
  }

  const base64 = auth.split(" ")[1] || "";
  let decoded = "";
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    decoded = "";
  }

  // Format is username:password (we accept any username)
  const parts = decoded.split(":");
  const pass = parts.slice(1).join(":"); // support ":" inside password

  if (pass !== adminPassword) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
