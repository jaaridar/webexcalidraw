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
import { updateBoardSchema, formatZodError } from "@/lib/validation";

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

  const raw = await req.json();
  const parsed = updateBoardSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  // Password handling
  if (data.passwordEnabled !== undefined) {
    if (data.passwordEnabled === false) {
      data.passwordHash = null;
    }
  }
  if (typeof data.password === "string" && data.password.trim()) {
    data.passwordHash = await bcrypt.hash(data.password.trim(), 10);
    data.passwordEnabled = true;
  }
  if (data.passwordHash === null) {
    data.passwordEnabled = false;
  }
  // Remove raw password before saving
  delete data.password;

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
