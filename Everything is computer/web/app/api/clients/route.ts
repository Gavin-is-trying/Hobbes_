import { NextResponse } from "next/server";
import { parseClientDraft } from "../../../lib/clients";
import { insertClient, listClients } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ clients: await listClients() });
  } catch (error) {
    console.error("Client list failed:", error);
    return NextResponse.json({ error: "The client database is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = parseClientDraft(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    return NextResponse.json({ client: await insertClient(parsed.value) }, { status: 201 });
  } catch (error) {
    console.error("Client insert failed:", error);
    return NextResponse.json({ error: "The client database is unavailable." }, { status: 503 });
  }
}
