// Boardly — collaborator role / removal (owner only, no session required)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOwner } from "@/lib/auth";
import { ROLE } from "@/lib/constants";

// PATCH change collaborator role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const owner = await getOwner();
  const { id, userId } = await params;

  const board = await db.board.findUnique({ where: { id } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (board.ownerId !== owner.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const role = body.role === ROLE.EDITOR ? ROLE.EDITOR : ROLE.VIEWER;

  const updated = await db.collaborator.update({
    where: { boardId_userId: { boardId: id, userId } },
    data: { role },
    include: { user: true },
  });

  return NextResponse.json({
    collaborator: {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
      createdAt: updated.createdAt,
      user: {
        id: updated.user.id,
        name: updated.user.name,
        email: updated.user.email,
        avatarColor: updated.user.avatarColor,
      },
    },
  });
}

// DELETE revoke collaborator
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const owner = await getOwner();
  const { id, userId } = await params;

  const board = await db.board.findUnique({ where: { id } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (board.ownerId !== owner.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.collaborator.deleteMany({
    where: { boardId: id, userId },
  });

  return NextResponse.json({ ok: true });
}
