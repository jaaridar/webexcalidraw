// Boardly — boards list & create
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { serializeBoardCard } from "@/lib/boards";
import {
  ACCESS_MODE,
  ROLE,
  SHARE_MODE,
  VISIBILITY,
  type Visibility,
  type AccessMode,
  type ShareMode,
  type BoardCategory,
} from "@/lib/constants";

// GET owner's boards (dashboard)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ boards: [] });

  const boards = await db.board.findMany({
    where: { ownerId: user.id },
    include: { _count: { select: { collaborators: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ boards: boards.map(serializeBoardCard) });
}

// POST create board
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = (body.title as string | undefined)?.trim() || "Untitled board";
  const description = (body.description as string | undefined)?.trim() || null;
  const visibility = (body.visibility as Visibility) || VISIBILITY.PRIVATE;
  const accessMode = (body.accessMode as AccessMode) || ACCESS_MODE.EDIT;
  const shareMode = (body.shareMode as ShareMode) || SHARE_MODE.INVITE_ONLY;
  const category = (body.category as BoardCategory | null) || null;
  const elements = (body.elements as string | undefined) || "[]";

  const board = await db.board.create({
    data: {
      title,
      description,
      visibility,
      accessMode,
      shareMode,
      category,
      elements,
      ownerId: user.id,
    },
  });

  return NextResponse.json({ board: serializeBoardCard(board) }, { status: 201 });
}
