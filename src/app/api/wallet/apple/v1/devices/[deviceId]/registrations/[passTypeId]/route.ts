import { connectDB } from "@/lib/mongoose";
import { WalletPass } from "@/models";

// PassKit web service: "Get the list of updatable passes" for a device.
//   GET /v1/devices/{deviceId}/registrations/{passTypeId}?passesUpdatedSince=TAG
// Returns the serials of passes registered to this device that changed since the
// given tag (we use lastPushedAt millis as the tag). 204 when nothing changed.
export async function GET(
  req: Request,
  {
    params,
  }: { params: Promise<{ deviceId: string; passTypeId: string }> },
) {
  const { deviceId } = await params;
  await connectDB();

  const since = new URL(req.url).searchParams.get("passesUpdatedSince");
  const sinceMs = since ? Number(since) : 0;

  const passes = await WalletPass.find({
    provider: "apple",
    "registrations.deviceLibraryIdentifier": deviceId,
  })
    .select("serial lastPushedAt")
    .lean<any[]>();

  const changed = passes.filter(
    (p) => !sinceMs || (p.lastPushedAt && +new Date(p.lastPushedAt) > sinceMs),
  );
  if (changed.length === 0) return new Response(null, { status: 204 });

  const lastUpdated = String(
    Math.max(...changed.map((p) => (p.lastPushedAt ? +new Date(p.lastPushedAt) : 0))),
  );
  return Response.json({
    lastUpdated,
    serialNumbers: changed.map((p) => p.serial),
  });
}
