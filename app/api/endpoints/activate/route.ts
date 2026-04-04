import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getEndpointById, saveEndpoint } from "@/lib/kv";
import { activateEndpoint } from "@/lib/proxy-client";

interface ActivatePayload {
  endpointId?: string
  signature?: string
  authorization?: {
    from: string
    to: string
    value: string
    validAfter: string
    validBefore: string
    nonce: string
  }
  paymentRequirements?: {
    scheme: string
    network: string
    maxAmountRequired: string
    resource: string
    description: string
    mimeType: string
    payTo: string
    maxTimeoutSeconds: number
    asset: string
    extra: { name: string; version: string } | null
  }
}

function encodePaymentHeader(
  signature: string,
  authorization: NonNullable<ActivatePayload["authorization"]>,
  paymentRequirements: NonNullable<ActivatePayload["paymentRequirements"]>
): string {
  const payment = {
    x402Version: 1,
    scheme: paymentRequirements.scheme,
    network: paymentRequirements.network,
    payload: {
      signature,
      authorization: {
        from: authorization.from,
        to: authorization.to,
        value: authorization.value,
        validAfter: authorization.validAfter,
        validBefore: authorization.validBefore,
        nonce: authorization.nonce,
      }
    }
  }
  return Buffer.from(JSON.stringify(payment)).toString("base64url")
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized - connect wallet first." }, { status: 401 });
  }

  const body = (await req.json()) as ActivatePayload;
  if (!body.endpointId) {
    return NextResponse.json({ error: "endpointId is required." }, { status: 400 });
  }

  const existing = await getEndpointById(body.endpointId);
  if (!existing) {
    return NextResponse.json({ error: "Endpoint not found." }, { status: 404 });
  }

  if (!body.signature || !body.authorization || !body.paymentRequirements) {
    return NextResponse.json({ error: "signature, authorization, and paymentRequirements are required." }, { status: 400 });
  }

  try {
    const paymentHeader = encodePaymentHeader(body.signature, body.authorization, body.paymentRequirements);
    const activated = await activateEndpoint(body.endpointId, paymentHeader);

    await saveEndpoint({
      ...existing,
      proxyUrl: activated.proxyUrl,
      status: activated.status,
      visibility: activated.visibility,
      activatedAt: new Date().toISOString(),
      paymentTxHash: activated.paymentTxHash ?? null,
      activationTxHash: activated.activationTxHash ?? null,
    });

    return NextResponse.json(activated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Activation failed." },
      { status: 500 },
    );
  }
}
