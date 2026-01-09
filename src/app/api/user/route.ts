import { NextResponse } from "next/server";
import { updateActiveUsers } from "../stats/route"; // Import the active users function

export async function GET() {
  // For simplicity, we assume one active user per session (you can improve with cookies/sessions)
  updateActiveUsers(1); // Always increment for each request

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  // If you have a logout or disconnect event, use this to decrement active users
  updateActiveUsers(0); // Decrement or set active users count to zero

  return NextResponse.json({ success: true });
}
