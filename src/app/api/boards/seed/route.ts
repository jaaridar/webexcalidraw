// Boardly — seed demo boards (owner endpoint, no session required)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOwner } from "@/lib/auth";
import { getDemoScenes } from "@/lib/demo-scenes";
import { elementsToSvg, svgToDataUrl } from "@/lib/excalidraw-to-svg";
import { BOARDLY_CONFIG } from "@/lib/config";
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

export async function POST() {
  const owner = await getOwner();
  await seedDemoBoards(owner.id);
  const count = await db.board.count({ where: { ownerId: owner.id } });
  return NextResponse.json({ seeded: count > 0, count });
}
