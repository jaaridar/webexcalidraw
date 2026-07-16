// Boardly — session endpoints
// The owner is auto-created/provisioned. No login required for the dashboard.
// Shared boards: if there's a cookie, the user is the owner/collaborator.
// If no cookie, the user is a guest (session returns null).
import { NextResponse } from "next/server";
import { getOwner, getSessionUser, setSession, type SessionUser } from "@/lib/auth";
import { getDemoScenes } from "@/lib/demo-scenes";
import { elementsToSvg, svgToDataUrl } from "@/lib/excalidraw-to-svg";
import { BOARDLY_CONFIG } from "@/lib/config";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

async function seedDemoBoards(ownerId: string) {
  const count = await db.board.count({ where: { ownerId } });
  if (count > 0) return;
  const scenes = getDemoScenes();
  for (const s of scenes) {
    const elementsJson = JSON.stringify(s.elements);
    const thumb = svgToDataUrl(elementsToSvg(elementsJson, { bg: "#fafaf9" }));
    const passwordHash = s.passwordEnabled
      ? await bcrypt.hash(BOARDLY_CONFIG.demoPassword, 10)
      : null;
    await db.board.create({
      data: {
        title: s.title,
        description: s.description,
        category: s.category,
        visibility: s.visibility,
        accessMode: s.accessMode,
        shareMode: s.shareMode,
        passwordEnabled: s.passwordEnabled,
        passwordHash,
        favorited: s.favorited,
        elements: elementsJson,
        thumbnail: thumb,
        ownerId,
      },
    });
  }
}

// GET current session user. Returns the owner if a cookie is set, otherwise
// null (guest). The dashboard calls POST to provision a cookie.
export async function GET() {
  const owner = await getOwner();
  if (BOARDLY_CONFIG.autoSeed) {
    await seedDemoBoards(owner.id);
  }
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

// POST — set the owner session cookie (called by the dashboard on first load)
export async function POST() {
  const owner = await getOwner();
  if (BOARDLY_CONFIG.autoSeed) {
    await seedDemoBoards(owner.id);
  }
  await setSession(owner.id);
  return NextResponse.json({ user: owner satisfies SessionUser });
}
