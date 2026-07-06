import { connectDB } from "@/lib/mongoose";
import { WalletPass } from "@/models";

// PassKit web service: register / unregister a device for push updates.
//   POST   /v1/devices/{deviceId}/registrations/{passTypeId}/{serial}
//   DELETE /v1/devices/{deviceId}/registrations/{passTypeId}/{serial}
// Both require `Authorization: ApplePass <authenticationToken>`.

async function authPass(serial: string, req: Request) {
  await connectDB();
  const pass = await WalletPass.findOne({ serial, provider: "apple" }).select(
    "authToken registrations",
  );
  if (!pass) return { pass: null, ok: false } as const;
  const auth = req.headers.get("authorization") || "";
  return { pass, ok: auth === `ApplePass ${pass.authToken}` } as const;
}

export async function POST(
  req: Request,
  {
    params,
  }: { params: Promise<{ deviceId: string; passTypeId: string; serial: string }> },
) {
  const { deviceId, serial } = await params;
  const { pass, ok } = await authPass(serial, req);
  if (!pass) {
    console.log(`[Wallet/apple] register: NO PASS for serial=${serial}`);
    return new Response("Not found", { status: 404 });
  }
  if (!ok) {
    console.log(`[Wallet/apple] register: AUTH FAILED serial=${serial} device=${deviceId}`);
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pushToken = body?.pushToken;
  if (!pushToken) {
    console.log(`[Wallet/apple] register: NO pushToken serial=${serial} device=${deviceId}`);
    return new Response("Bad request", { status: 400 });
  }

  const already = (pass.registrations || []).some(
    (r: any) => r.deviceLibraryIdentifier === deviceId,
  );
  if (already) {
    // Keep the push token current in case it rotated.
    await WalletPass.updateOne(
      { _id: pass._id, "registrations.deviceLibraryIdentifier": deviceId },
      { $set: { "registrations.$.pushToken": pushToken } },
    );
    console.log(`[Wallet/apple] register: UPDATED token serial=${serial} device=${deviceId}`);
    return new Response(null, { status: 200 });
  }

  await WalletPass.updateOne(
    { _id: pass._id },
    {
      $push: {
        registrations: { deviceLibraryIdentifier: deviceId, pushToken },
      },
    },
  );
  console.log(`[Wallet/apple] register: NEW device serial=${serial} device=${deviceId} token=${String(pushToken).slice(0, 8)}…`);
  return new Response(null, { status: 201 });
}

export async function DELETE(
  req: Request,
  {
    params,
  }: { params: Promise<{ deviceId: string; passTypeId: string; serial: string }> },
) {
  const { deviceId, serial } = await params;
  const { pass, ok } = await authPass(serial, req);
  if (!pass) return new Response("Not found", { status: 404 });
  if (!ok) return new Response("Unauthorized", { status: 401 });

  await WalletPass.updateOne(
    { _id: pass._id },
    { $pull: { registrations: { deviceLibraryIdentifier: deviceId } } },
  );
  return new Response(null, { status: 200 });
}
