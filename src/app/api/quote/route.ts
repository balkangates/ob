import { NextRequest } from "next/server";
import { buildQuote } from "@/lib/quote";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const sp  = req.nextUrl.searchParams;
  const apt = Number(sp.get("apartmentId"));
  const ci  = sp.get("checkIn")  ?? "";
  const co  = sp.get("checkOut") ?? "";
  const lvl = Number(sp.get("geniusLevel") ?? 0);
  const cpn = sp.get("couponCode") ?? null;
  if (!apt || !ci || !co) return Response.json({ error: "Eksik parametre" }, { status: 400 });
  const quote = await buildQuote({ apartment_id: apt, check_in: ci, check_out: co, genius_level: lvl, coupon_code: cpn });
  return Response.json(quote);
}
