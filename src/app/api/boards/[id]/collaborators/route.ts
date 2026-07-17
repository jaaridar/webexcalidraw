// Boardly — collaborators (invite / list) — owner endpoints, no session required
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOwner, pickAvatarColor } from "@/lib/auth";
import { ROLE } from "@/lib/constants";
import { inviteCollaboratorSchema, formatZodError } from "@/lib/validation";

// GET collaborators (owner only)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const owner = await getOwner();
  const { id } = await params;

  const board = await db.board.findUnique({ where: { id } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (board.ownerId !== owner.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const collaborators = await db.collaborator.findMany({
    where: { boardId: id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    collaborators: collaborators.map((c) => ({
      id: c.id,
      userId: c.userId,
      role: c.role,
      createdAt: c.createdAt,
      user: {
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
        avatarColor: c.user.avatarColor,
      },
    })),
    owner: { id: board.ownerId },
  });
}

// POST invite collaborator by email
export async function POST(
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
  const parsed = inviteCollaboratorSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { email, role } = parsed.data;

  const emailLower = email.toLowerCase();
  if (emailLower === owner.email.toLowerCase())
    return NextResponse.json({ error: "You are already the owner" }, { status: 400 });

  // find or create user
  let target = await db.user.findUnique({ where: { email } });
  if (!target) {
    target = await db.user.create({
      data: {
        email,
        name: email.split("@")[0],
        avatarColor: pickAvatarColor(email),
      },
    });
  }

  const existing = await db.collaborator.findUnique({
    where: { boardId_userId: { boardId: id, userId: target.id } },
  });
  if (existing) {
    const updated = await db.collaborator.update({
      where: { id: existing.id },
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

  const collab = await db.collaborator.create({
    data: { boardId: id, userId: target.id, role },
    include: { user: true },
  });

  return NextResponse.json(
    {
      collaborator: {
        id: collab.id,
        userId: collab.userId,
        role: collab.role,
        createdAt: collab.createdAt,
        user: {
          id: collab.user.id,
          name: collab.user.name,
          email: collab.user.email,
          avatarColor: collab.user.avatarColor,
        },
      },
    },
    { status: 201 }
  );
}
