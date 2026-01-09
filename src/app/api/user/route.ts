import { NextResponse } from "next/server";

// Remove the stats import and function calls

export async function GET() {
  // Your logic for the GET request
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  // Your logic for the DELETE request
  return NextResponse.json({ success: true });
}
