// Boardly — board access logic & serialization
// Simplified model: Private (owner-only) | Public (anyone with link).
// Public boards can be Edit or Read-only. No "invite-only" mode.
import { db } from "@/lib/db";
import { ACCESS_MODE, ROLE, VISIBILITY, type Role } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

export type AccessResult = {
  canView: boolean;
  canEdit: boolean;
  role: Role | "GUEST";
  requiresPassword: boolean;
  passwordVerified: boolean;
  isOwner: boolean;
  denied: boolean;
  reason?: string;
};

export async function getBoardWithCollaborators(boardId: string) {
  return db.board.findUnique({
    where: { id: boardId },
    include: { collaborators: { include: { user: true } }, owner: true },
  });
}

export function getCollaboratorRole(
  board: { ownerId: string; collaborators?: { userId: string; role: string }[] },
  user: SessionUser | null
): Role | null {
  if (!user) return null;
  if (board.ownerId === user.id) return ROLE.OWNER;
  const c = board.collaborators?.find((c) => c.userId === user.id);
  return (c?.role as Role) ?? null;
}

export function evaluateAccess(
  board: {
    id: string;
    ownerId: string;
    visibility: string;
    accessMode: string;
    passwordEnabled: boolean;
    collaborators?: { userId: string; role: string }[];
  },
  user: SessionUser | null,
  unlocked: Set<string>
): AccessResult {
  const isOwner = !!user && board.ownerId === user.id;
  if (isOwner) {
    return { canView: true, canEdit: true, role: ROLE.OWNER, requiresPassword: false, passwordVerified: true, isOwner: true, denied: false };
  }

  // Explicit collaborator role always grants access
  const collabRole = getCollaboratorRole(board, user);
  if (collabRole === ROLE.EDITOR) {
    return { canView: true, canEdit: true, role: ROLE.EDITOR, requiresPassword: false, passwordVerified: true, isOwner: false, denied: false };
  }
  if (collabRole === ROLE.VIEWER) {
    return { canView: true, canEdit: false, role: ROLE.VIEWER, requiresPassword: false, passwordVerified: true, isOwner: false, denied: false };
  }

  // Private board — only owner & explicit collaborators
  if (board.visibility !== VISIBILITY.PUBLIC) {
    return { canView: false, canEdit: false, role: "GUEST", requiresPassword: false, passwordVerified: false, isOwner: false, denied: true, reason: "PRIVATE" };
  }

  // Public board — anyone with the link (optionally password-protected)
  const requiresPassword = board.passwordEnabled;
  const passwordVerified = unlocked.has(board.id) || !requiresPassword;

  if (requiresPassword && !passwordVerified) {
    return { canView: false, canEdit: false, role: "GUEST", requiresPassword: true, passwordVerified: false, isOwner: false, denied: false, reason: "PASSWORD_REQUIRED" };
  }

  const canEdit = board.accessMode === ACCESS_MODE.EDIT;
  return {
    canView: true,
    canEdit,
    role: canEdit ? ROLE.EDITOR : ROLE.VIEWER,
    requiresPassword: false,
    passwordVerified: true,
    isOwner: false,
    denied: false,
  };
}

// Public-facing board payload
export function serializeBoard(
  board: NonNullable<Awaited<ReturnType<typeof getBoardWithCollaborators>>>,
  opts?: { includeElements?: boolean }
) {
  const includeElements = opts?.includeElements ?? false;
  return {
    id: board.id,
    title: board.title,
    description: board.description,
    visibility: board.visibility,
    accessMode: board.accessMode,
    shareMode: board.shareMode,
    passwordEnabled: board.passwordEnabled,
    allowReshare: board.allowReshare,
    allowExport: board.allowExport,
    allowDuplicate: board.allowDuplicate,
    category: board.category,
    archived: board.archived,
    favorited: board.favorited,
    thumbnail: board.thumbnail,
    elements: includeElements ? board.elements : undefined,
    appState: includeElements ? board.appState : undefined,
    ownerId: board.ownerId,
    owner: board.owner ? { id: board.owner.id, name: board.owner.name, email: board.owner.email, avatarColor: board.owner.avatarColor } : null,
    collaborators: (board.collaborators ?? []).map((c) => ({
      userId: c.userId,
      role: c.role,
      createdAt: c.createdAt,
      user: { id: c.user.id, name: c.user.name, email: c.user.email, avatarColor: c.user.avatarColor },
    })),
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

// Lightweight payload for sidebar list
export function serializeBoardCard(board: {
  id: string; title: string; description: string | null;
  visibility: string; accessMode: string; shareMode: string;
  passwordEnabled: boolean; allowReshare: boolean; allowExport: boolean; allowDuplicate: boolean;
  category: string | null; archived: boolean; favorited: boolean; thumbnail: string | null;
  ownerId: string; createdAt: Date; updatedAt: Date;
  _count?: { collaborators: number };
}) {
  return {
    id: board.id, title: board.title, description: board.description,
    visibility: board.visibility, accessMode: board.accessMode, shareMode: board.shareMode,
    passwordEnabled: board.passwordEnabled, allowReshare: board.allowReshare,
    allowExport: board.allowExport, allowDuplicate: board.allowDuplicate,
    category: board.category, archived: board.archived, favorited: board.favorited,
    thumbnail: board.thumbnail, ownerId: board.ownerId,
    collaboratorCount: board._count?.collaborators ?? 0,
    createdAt: board.createdAt, updatedAt: board.updatedAt,
  };
}
