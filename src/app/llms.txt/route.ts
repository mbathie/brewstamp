import { getPlanCatalog } from "@/lib/plan-catalog";
import { buildLlmsTxt } from "@/lib/llms";

// Prices come from the plan catalogue; refresh at most every 5 minutes.
export const revalidate = 300;

export async function GET() {
  return new Response(buildLlmsTxt(await getPlanCatalog()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
