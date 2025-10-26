import { NextResponse } from "next/server";
import { createUser, getUser } from "../../db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await getUser(email);
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    await createUser(email, password);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("/api/register error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
