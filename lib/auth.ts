/**
 * BhoomiSetu — Auth Helper
 * Bridges Clerk authentication with the raw SQL users table.
 */

import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, upsertUser, type User } from '@/lib/db/queries/users';

/**
 * Get the current authenticated user from the database.
 * Returns null if not authenticated or user doesn't exist yet.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    return getUserByClerkId(userId);
  } catch {
    return null;
  }
}

/**
 * Ensure the authenticated Clerk user exists in our database.
 * Call this on first login / protected page access.
 */
export async function ensureUser(clerkId: string, email: string): Promise<User> {
  return upsertUser(clerkId, email);
}

/**
 * Check if the current user has one of the required roles.
 * Used for API route authorization.
 */
export async function requireRole(
  ...allowedRoles: User['role'][]
): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: Not authenticated');
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Required role(s): ${allowedRoles.join(', ')}`);
  }
  return user;
}
