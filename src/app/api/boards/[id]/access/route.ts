// Boardly — shared board access (public link viewers/editors)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSessionUser, getUnlockedBoards, unlockBoard } from "@/lib/auth";
import { evaluateAccess, getCollaboratorRole } from "@/lib/boards";

// GET access info for a board (does NOT leak elements)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  const unlocked = await getUnlockedBoards();
  const { id } = await params;

  const board = await db.board.findUnique({
    where: { id },
    include: { collaborators: true, owner: true },
  });

  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = evaluateAccess(board, user, unlocked);

  return NextResponse.json({
    board: {
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
      owner: board.owner
        ? {
            id: board.owner.id,
            name: board.owner.name,
            avatarColor: board.owner.avatarColor,
          }
        : null,
      collaboratorCount: board.collaborators.length,
      updatedAt: board.updatedAt,
    },
    access,
    currentUser: user,
    role: getCollaboratorRole(board, user),
  });
}

// POST verify password for a public-link board
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  const { id } = await params;

  const board = await db.board.findUnique({ where: { id } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Owner bypasses password
  if (user && board.ownerId === user.id) {
    return NextResponse.json({ ok: true });
  }

  if (!board.passwordEnabled || !board.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json();
  const password = (body.password as string | undefined) || "";

  const ok = await bcrypt.compare(password, board.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  await unlockBoard(board.id);
  return NextResponse.json({ ok: true });
}
