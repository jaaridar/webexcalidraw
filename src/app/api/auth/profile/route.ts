// Boardly — update profile
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { AVATAR_COLORS } from "@/lib/constants";

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = (body.name as string | undefined)?.trim();
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  const avatarColor = body.avatarColor as string | undefined;

  if (email && email !== user.email) {
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(avatarColor && AVATAR_COLORS.includes(avatarColor)
        ? { avatarColor }
        : {}),
    },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarColor: updated.avatarColor,
    },
  });
}
