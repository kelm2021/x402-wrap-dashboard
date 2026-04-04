import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getActivationChallenge } from "@/lib/proxy-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized - connect wallet first." }, { status: 401 });
  }

  const endpointId = new URL(req.url).searchParams.get("endpointId");
  if (!endpointId) {
    return NextResponse.json({ error: "endpointId is required." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getActivationChallenge(endpointId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch activation challenge." },
      { status: 500 },
    );
  }
}
