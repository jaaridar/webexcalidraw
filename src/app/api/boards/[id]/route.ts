// Boardly — board CRUD (owner endpoints — no session required)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOwner } from "@/lib/auth";
import { serializeBoard } from "@/lib/boards";
import {
  ACCESS_MODE,
  SHARE_MODE,
  VISIBILITY,
} from "@/lib/constants";
import bcrypt from "bcryptjs";

// GET single board (owner view — full details incl. collaborators)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const owner = await getOwner();
  const { id } = await params;

  const board = await db.board.findUnique({
    where: { id },
    include: {
      collaborators: { include: { user: true }, orderBy: { createdAt: "asc" } },
      owner: true,
    },
  });

  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Owner gets full detail
  if (board.ownerId === owner.id) {
    return NextResponse.json({ board: serializeBoard(board) });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// PATCH update board (owner only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const owner = await getOwner();
  const { id } = await params;

  const board = await db.board.findUnique({ where: { id } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (board.ownerId !== owner.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.description === "string")
    data.description = body.description.trim() || null;
  if (body.visibility in VISIBILITY) data.visibility = body.visibility;
  if (body.accessMode in ACCESS_MODE) data.accessMode = body.accessMode;
  if (body.shareMode in SHARE_MODE) data.shareMode = body.shareMode;
  if (typeof body.category === "string" || body.category === null)
    data.category = body.category;
  if (typeof body.archived === "boolean") data.archived = body.archived;
  if (typeof body.favorited === "boolean") data.favorited = body.favorited;
  if (typeof body.allowReshare === "boolean") data.allowReshare = body.allowReshare;
  if (typeof body.allowExport === "boolean") data.allowExport = body.allowExport;
  if (typeof body.allowDuplicate === "boolean")
    data.allowDuplicate = body.allowDuplicate;

  // Password handling
  if (typeof body.passwordEnabled === "boolean") {
    data.passwordEnabled = body.passwordEnabled;
    if (body.passwordEnabled === false) {
      data.passwordHash = null;
    }
  }
  if (typeof body.password === "string" && body.password.trim()) {
    data.passwordHash = await bcrypt.hash(body.password.trim(), 10);
    data.passwordEnabled = true;
  }

  const updated = await db.board.update({
    where: { id },
    data,
    include: {
      collaborators: { include: { user: true }, orderBy: { createdAt: "asc" } },
      owner: true,
    },
  });

  return NextResponse.json({ board: serializeBoard(updated) });
}

// DELETE board (owner only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const owner = await getOwner();
  const { id } = await params;

  const board = await db.board.findUnique({ where: { id } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (board.ownerId !== owner.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.board.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
