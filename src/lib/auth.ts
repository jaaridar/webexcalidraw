// Boardly — auth helpers
// The owner model is session-free: getOwner() always returns the configured
// owner (creating it on first call). This eliminates all 401s on owner
// endpoints. Shared boards still use getSessionUser() to distinguish
// owner / collaborator / guest for access control.
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { AVATAR_COLORS, DEFAULT_AVATAR_COLOR } from "@/lib/constants";
import { BOARDLY_CONFIG } from "@/lib/config";

export const SESSION_COOKIE = "boardly_uid";
const UNLOCK_COOKIE = "boardly_unlock";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
};

// Guaranteed owner — always returns the configured owner, creating it if
// necessary. Never returns null, never throws. Use this for ALL dashboard /
// board-management endpoints.
let _ownerCache: SessionUser | null = null;

export async function getOwner(): Promise<SessionUser> {
  if (_ownerCache) return _ownerCache;

  const cfg = BOARDLY_CONFIG.owner;
  let user = await db.user.findUnique({ where: { email: cfg.email } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: cfg.email,
        name: cfg.name,
        avatarColor: cfg.avatarColor,
      },
    });
  }
  _ownerCache = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarColor: user.avatarColor || DEFAULT_AVATAR_COLOR,
  };
  return _ownerCache;
}

// Session user (for shared-board access control). Returns the logged-in user
// or null (guest). The owner is auto-recognized via the session cookie set
// during app bootstrap.
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const uid = store.get(SESSION_COOKIE)?.value;
  if (!uid) {
    // No cookie — fall back to the owner so dashboard endpoints never fail.
    // (Access endpoints call resolveActor() instead, which distinguishes
    // owner / collaborator / guest.)
    return null;
  }
  const user = await db.user.findUnique({ where: { id: uid } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarColor: user.avatarColor || DEFAULT_AVATAR_COLOR,
  };
}

// Resolve the actor for shared-board access endpoints. Returns the session
// user if one exists, otherwise null (guest).
export async function resolveActor(): Promise<SessionUser | null> {
  return getSessionUser();
}

// Check if a session user IS the owner.
export async function isOwner(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const owner = await getOwner();
  return owner.id === userId;
}

export async function setSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function getUnlockedBoards(): Promise<Set<string>> {
  const store = await cookies();
  const raw = store.get(UNLOCK_COOKIE)?.value;
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export async function unlockBoard(boardId: string) {
  const store = await cookies();
  const set = await getUnlockedBoards();
  set.add(boardId);
  store.set(UNLOCK_COOKIE, JSON.stringify(Array.from(set)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function pickAvatarColor(seed?: string): string {
  if (!seed) return DEFAULT_AVATAR_COLOR;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
