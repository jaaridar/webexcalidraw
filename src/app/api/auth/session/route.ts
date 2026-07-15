// Boardly — auth session endpoints
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getSessionUser,
  setSession,
  pickAvatarColor,
  type SessionUser,
} from "@/lib/auth";
import { DEFAULT_AVATAR_COLOR } from "@/lib/constants";
import { getDemoScenes } from "@/lib/demo-scenes";
import { elementsToSvg, svgToDataUrl } from "@/lib/excalidraw-to-svg";
import bcrypt from "bcryptjs";

async function seedDemoBoards(ownerId: string) {
  const count = await db.board.count({ where: { ownerId } });
  if (count > 0) return;
  const scenes = getDemoScenes();
  for (const s of scenes) {
    const elementsJson = JSON.stringify(s.elements);
    const thumb = svgToDataUrl(elementsToSvg(elementsJson, { bg: "#fafaf9" }));
    const passwordHash = s.passwordEnabled
      ? await bcrypt.hash("boardly", 10)
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

// GET current session user
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

// POST — provision / sign in a user by name+email, or create default demo owner
export async function POST(req: Request) {
  let body: { name?: string; email?: string; avatarColor?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();

  // If no email provided, create/use a default demo owner (seeded on first creation)
  if (!email) {
    const existing = await getSessionUser();
    if (existing) return NextResponse.json({ user: existing });

    const demoEmail = "you@boardly.app";
    let user = await db.user.findUnique({ where: { email: demoEmail } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: demoEmail,
          name: "You",
          avatarColor: DEFAULT_AVATAR_COLOR,
        },
      });
    }
    // Ensure the demo owner always has demo boards (idempotent)
    await seedDemoBoards(user.id);
    await setSession(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarColor: user.avatarColor,
      } satisfies SessionUser,
    });
  }

  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        avatarColor: body.avatarColor || pickAvatarColor(email),
      },
    });
  }
  await setSession(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarColor: user.avatarColor,
    } satisfies SessionUser,
  });
}
