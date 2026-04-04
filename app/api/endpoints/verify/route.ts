import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getEndpointById, saveEndpoint } from "@/lib/kv";
import { verifyEndpoint } from "@/lib/proxy-client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized - connect wallet first." }, { status: 401 });
  }

  const { endpointId } = await req.json();
  if (!endpointId || typeof endpointId !== "string") {
    return NextResponse.json({ error: "endpointId is required." }, { status: 400 });
  }

  const existing = await getEndpointById(endpointId);
  if (!existing) {
    return NextResponse.json({ error: "Endpoint not found." }, { status: 404 });
  }

  try {
    const verified = await verifyEndpoint(endpointId);
    await saveEndpoint({
      ...existing,
      status: verified.status,
      verifiedAt: verified.verifiedAt ?? new Date().toISOString(),
    });

    return NextResponse.json(verified);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed." },
      { status: 500 },
    );
  }
}
