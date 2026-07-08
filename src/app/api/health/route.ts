import { supabase } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { error } = await supabase.from("settings").select("id").limit(1);
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
