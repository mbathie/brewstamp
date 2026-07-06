// PassKit web service: error log sink. Wallet POSTs { logs: string[] } when it
// hits problems talking to our web service. We just surface them in our logs.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.logs)) {
      for (const line of body.logs) console.error("[Wallet/apple] device log:", line);
    }
  } catch {
    // ignore malformed payloads
  }
  return new Response(null, { status: 200 });
}
