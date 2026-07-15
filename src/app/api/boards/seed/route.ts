// Boardly — seed demo boards for the current owner (idempotent: only if 0 boards)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getDemoScenes } from "@/lib/demo-scenes";
import { elementsToSvg, svgToDataUrl } from "@/lib/excalidraw-to-svg";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await db.board.count({ where: { ownerId: user.id } });
  if (count > 0) {
    return NextResponse.json({ seeded: false, count });
  }

  const scenes = getDemoScenes();
  for (const s of scenes) {
    const elementsJson = JSON.stringify(s.elements);
    const thumb = svgToDataUrl(elementsToSvg(elementsJson, { bg: "#fafaf9" }));
    await db.board.create({
      data: {
        title: s.title,
        description: s.description,
        category: s.category,
        visibility: s.visibility,
        accessMode: s.accessMode,
        shareMode: s.shareMode,
        passwordEnabled: s.passwordEnabled,
        passwordHash: s.passwordEnabled
          ? "$2a$10$seedplaceholderhashforbiddenemo000000000000000000000000000"
          : null,
        favorited: s.favorited,
        elements: elementsJson,
        thumbnail: thumb,
        ownerId: user.id,
      },
    });
  }

  // Replace the placeholder password hash for the roadmap board with a real hash
  // Password for the demo protected board: "boardly"
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("boardly", 10);
  const roadmap = await db.board.findFirst({
    where: { ownerId: user.id, title: "Product Roadmap — Q4" },
  });
  if (roadmap && roadmap.passwordHash?.startsWith("$2a$10$seed")) {
    await db.board.update({ where: { id: roadmap.id }, data: { passwordHash: hash } });
  }

  return NextResponse.json({ seeded: true, count: scenes.length });
}
