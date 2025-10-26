export async function GET() {
	return Response.json({ status: "ok" });
}

export async function POST(req: Request) {
	// Placeholder to satisfy Next.js route module typing
	const body = await req.json().catch(() => ({}));
	return Response.json({ received: body }, { status: 201 });
}
