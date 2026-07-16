// Boardly — sign out (no-op: the owner is always the owner in this single-user model)
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true });
}
