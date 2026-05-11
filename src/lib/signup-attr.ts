import { cookies } from "next/headers";

/**
 * Read the first-touch attribution cookie set by the middleware (see proxy.ts)
 * and return the referrer + landing page to persist on a new user.
 *
 * Returns empty strings if the cookie is missing or malformed — never throws,
 * so the caller can safely splat it into a user-create call.
 */
export async function readSignupAttribution(): Promise<{
  signupReferrer: string;
  signupLandingPage: string;
}> {
  try {
    const c = await cookies();
    const raw = c.get("bs_attr")?.value;
    if (!raw) return { signupReferrer: "", signupLandingPage: "" };
    const parsed = JSON.parse(raw) as { r?: string; p?: string };
    return {
      signupReferrer: parsed.r || "",
      signupLandingPage: parsed.p || "",
    };
  } catch {
    return { signupReferrer: "", signupLandingPage: "" };
  }
}
