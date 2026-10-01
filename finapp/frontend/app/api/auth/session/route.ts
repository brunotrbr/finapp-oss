import { NextResponse } from "next/server";
import { clearSession, createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  let idToken: unknown;

  try {
    const body = await request.json();
    idToken = (body as { idToken?: unknown })?.idToken;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof idToken !== "string" || idToken.length === 0) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  try {
    const user = await createSession(idToken);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
}

export async function DELETE() {
  await clearSession();
  return new NextResponse(null, { status: 204 });
}
