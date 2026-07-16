// Boardly — duplicate a board
// Owner is auto-recognized; guests/collaborators go through access control.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getOwner, getUnlockedBoards } from "@/lib/auth";
import { evaluateAccess, serializeBoardCard } from "@/lib/boards";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unlocked = await getUnlockedBoards();
  const { id } = await params;

  const board = await db.board.findUnique({
    where: { id },
    include: { collaborators: true },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Try session user first; if none, use the owner
  let user = await getSessionUser();
  if (!user) {
    user = await getOwner();
  }

  // Owner can always duplicate; otherwise must have access AND allowDuplicate
  const access = evaluateAccess(board, user, unlocked);
  if (!access.canView)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (board.ownerId !== user.id && !board.allowDuplicate)
    return NextResponse.json(
      { error: "Duplication is disabled for this board" },
      { status: 403 }
    );

  const copy = await db.board.create({
    data: {
      title: `${board.title} (copy)`,
      description: board.description,
      visibility: "PRIVATE",
      accessMode: board.accessMode,
      shareMode: "INVITE_ONLY",
      passwordEnabled: false,
      passwordHash: null,
      allowReshare: false,
      allowExport: board.allowExport,
      allowDuplicate: true,
      category: board.category,
      thumbnail: board.thumbnail,
      elements: board.elements,
      appState: board.appState,
      ownerId: user.id,
    },
    include: { _count: { select: { collaborators: true } } },
  });

  return NextResponse.json({ board: serializeBoardCard(copy) }, { status: 201 });
}
