// src/app/stats/route.ts

let activeUsers = 0; // Simple in-memory storage for active users

// This function updates the active users count
export const updateActiveUsers = (count: number) => {
  if (count === 1) {
    activeUsers++; // Increment active users
  } else if (count === 0) {
    activeUsers = 0; // Reset active users count to zero
  }

  console.log(`Active users: ${activeUsers}`); // Logs the current active users count
};
