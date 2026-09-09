/**
 * BhoomiSetu — Users Query Module (Raw SQL)
 * User lookup and upsert from Clerk authentication.
 */

import { query } from '../pool';

// ============================================================
// Types
// ============================================================
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  role: 'lrb' | 'collector' | 'state_admin' | 'central_ministry' | 'citizen';
  jurisdiction: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Queries
// ============================================================

/** Get user by Clerk ID */
export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const { rows } = await query<User>(
    'SELECT * FROM users WHERE clerk_id = $1',
    [clerkId]
  );
  return rows[0] || null;
}

/** Get user by internal ID */
export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

/**
 * Upsert user from Clerk authentication.
 * Creates the user on first login, or updates email if it changed.
 * New users default to 'collector' role — admin can reassign.
 */
export async function upsertUser(clerkId: string, email: string): Promise<User> {
  const { rows } = await query<User>(
    `INSERT INTO users (clerk_id, email, role)
     VALUES ($1, $2, 'collector')
     ON CONFLICT (clerk_id) DO UPDATE SET email = $2, updated_at = now()
     RETURNING *`,
    [clerkId, email]
  );
  return rows[0];
}

/** Update user role (admin action) */
export async function updateUserRole(
  userId: string,
  role: User['role'],
  jurisdiction?: string
): Promise<User> {
  const { rows } = await query<User>(
    `UPDATE users SET role = $1, jurisdiction = $2, updated_at = now()
     WHERE id = $3
     RETURNING *`,
    [role, jurisdiction || null, userId]
  );
  if (rows.length === 0) {
    throw new Error(`User not found: ${userId}`);
  }
  return rows[0];
}

/** List all users (admin view) */
export async function listUsers(): Promise<User[]> {
  const { rows } = await query<User>(
    'SELECT * FROM users ORDER BY created_at DESC'
  );
  return rows;
}
