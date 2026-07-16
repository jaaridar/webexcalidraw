// Boardly — save board content (elements + thumbnail)
// Owner is auto-recognized; guests/collaborators go through access control.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getOwner, getUnlockedBoards } from "@/lib/auth";
import { evaluateAccess } from "@/lib/boards";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unlocked = await getUnlockedBoards();
  const { id } = await params;

  const board = await db.board.findUnique({
    where: { id },
    include: { collaborators: true },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Try session user first; if none, check if this is the owner's board
  let user = await getSessionUser();
  if (!user) {
    const owner = await getOwner();
    if (board.ownerId === owner.id) {
      user = owner;
    }
  }

  const access = evaluateAccess(board, user, unlocked);
  if (!access.canEdit)
    return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.elements === "string") data.elements = body.elements;
  if (typeof body.appState === "string") data.appState = body.appState;
  if (typeof body.thumbnail === "string") data.thumbnail = body.thumbnail;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ ok: true, updated: false });

  const updated = await db.board.update({ where: { id }, data });
  return NextResponse.json({ ok: true, updated: true, updatedAt: updated.updatedAt });
}
