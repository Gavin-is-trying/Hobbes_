import { NextResponse } from "next/server";
import { removeClient } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
  }
  try {
    const removed = await removeClient(numericId);
    if (!removed) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Client delete failed:", error);
    return NextResponse.json({ error: "The client database is unavailable." }, { status: 503 });
  }
}
