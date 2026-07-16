// Boardly — boards list & create (owner endpoints — no session required)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOwner } from "@/lib/auth";
import { serializeBoardCard } from "@/lib/boards";
import { elementsToSvg, svgToDataUrl } from "@/lib/excalidraw-to-svg";
import {
  ACCESS_MODE,
  SHARE_MODE,
  VISIBILITY,
  type Visibility,
  type AccessMode,
  type ShareMode,
  type BoardCategory,
} from "@/lib/constants";

// GET owner's boards (dashboard)
export async function GET() {
  const owner = await getOwner();
  const boards = await db.board.findMany({
    where: { ownerId: owner.id },
    include: { _count: { select: { collaborators: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ boards: boards.map(serializeBoardCard) });
}

// POST create board
export async function POST(req: Request) {
  const owner = await getOwner();
  const body = await req.json();
  const title = (body.title as string | undefined)?.trim() || "Untitled board";
  const description = (body.description as string | undefined)?.trim() || null;
  const visibility = (body.visibility as Visibility) || VISIBILITY.PRIVATE;
  const accessMode = (body.accessMode as AccessMode) || ACCESS_MODE.EDIT;
  const shareMode = (body.shareMode as ShareMode) || SHARE_MODE.INVITE_ONLY;
  const category = (body.category as BoardCategory | null) || null;
  const workspace = (body.workspace as string | null) || null;
  const elements = (body.elements as string | undefined) || "[]";

  const thumbnail = svgToDataUrl(elementsToSvg(elements, { bg: "#fafaf9" }));

  const board = await db.board.create({
    data: {
      title,
      description,
      visibility,
      accessMode,
      shareMode,
      category,
      workspace,
      elements,
      thumbnail,
      ownerId: owner.id,
    },
  });

  return NextResponse.json({ board: serializeBoardCard(board) }, { status: 201 });
}
