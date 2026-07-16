// Boardly — load board scene (elements) for anyone with view access
// The owner is auto-recognized (no session needed). Guests/collaborators
// go through the normal access control.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getOwner, getUnlockedBoards } from "@/lib/auth";
import { evaluateAccess } from "@/lib/boards";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const unlocked = await getUnlockedBoards();

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

  if (access.denied) {
    return NextResponse.json(
      { error: "You need an invitation to access this board", reason: access.reason },
      { status: 403 }
    );
  }
  if (!access.canView) {
    return NextResponse.json(
      { error: "Password required", reason: "PASSWORD_REQUIRED" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    elements: board.elements,
    appState: board.appState,
    access,
    canEdit: access.canEdit,
    allowExport: board.allowExport,
  });
}
