import { NextResponse } from "next/server";
import { createUser, getUser } from "app/db";
import { sendVerificationEmail } from "app/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await getUser(email);
    if (Array.isArray(existing) ? existing.length > 0 : !!existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const { verificationToken } = await createUser(email, password);
    
    if (verificationToken) {
      try {
        await sendVerificationEmail(email, verificationToken);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Continue even if email fails, but warn? 
        // Or fail? For now, let's fail so user knows.
        return NextResponse.json({ error: "Failed to send verification email. Check server logs." }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, message: "Please check your email to verify your account." }, { status: 201 });
  } catch (err: any) {
    console.error("/api/register error", err);
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}
