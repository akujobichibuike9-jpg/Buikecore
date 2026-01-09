import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));

  const adminPw = process.env.ADMIN_PASSWORD || "";
  if (!adminPw) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD is not set in .env.local" },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || password !== adminPw) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
