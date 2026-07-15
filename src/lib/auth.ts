// Boardly — lightweight cookie-based session auth
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { AVATAR_COLORS, DEFAULT_AVATAR_COLOR } from "@/lib/constants";

export const SESSION_COOKIE = "boardly_uid";
const UNLOCK_COOKIE = "boardly_unlock";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const uid = store.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  const user = await db.user.findUnique({ where: { id: uid } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarColor: user.avatarColor || DEFAULT_AVATAR_COLOR,
  };
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
