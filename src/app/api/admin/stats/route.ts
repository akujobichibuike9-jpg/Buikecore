import { NextResponse } from "next/server";

// Simple in-memory stats tracking
let stats = {
  requestsReceived: 0,
  activeUsers: 0, // Active users (you can improve tracking with session cookies)
};

// Increment request count on each tutor API request
export function trackRequest() {
  stats.requestsReceived += 1;
}

// Increment active user count (this is a very basic version)
export function trackActiveUser() {
  stats.activeUsers += 1;
}

// Reset or update active user count
export function updateActiveUsers(count: number) {
  stats.activeUsers = count;
}

export async function GET() {
  return NextResponse.json({ stats });
}
