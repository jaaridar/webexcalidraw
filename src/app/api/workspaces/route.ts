// Boardly — workspaces API
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOwner } from "@/lib/auth";

// Workspaces are just strings stored on boards; this endpoint
// returns the current list of distinct workspace names for the owner.
export async function GET() {
  const owner = await getOwner();
  const boards = await db.board.findMany({
    where: { ownerId: owner.id },
    select: { workspace: true },
  });
  const names = Array.from(new Set(boards.map((b) => b.workspace).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  return NextResponse.json({ workspaces: names });
}

// POST create workspace (just returns success — workspace is created implicitly when a board is assigned to it)
export async function POST(req: Request) {
  const owner = await getOwner();
  const body = await req.json();
  const name = (body.name as string | undefined)?.trim();
  if (!name) return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });

  // Create a placeholder board in the workspace so it shows up
  await db.board.create({
    data: {
      title: `${name} workspace`,
      visibility: "PRIVATE",
      accessMode: "EDIT",
      shareMode: "INVITE_ONLY",
      workspace: name,
      elements: "[]",
      ownerId: owner.id,
    },
  });

  return NextResponse.json({ ok: true, name }, { status: 201 });
}
