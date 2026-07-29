import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase connection failed" }, { status: 500 });
  }

  const estonianBanks = [
    { slug: "bigbank", name: "Bigbank", country: "Estonya", brand_color: "#E2001A", accent_color: "#E2001A", logo_file: null },
    { slug: "citadele-banka", name: "Citadele Banka", country: "Estonya", brand_color: "#E3000F", accent_color: "#E3000F", logo_file: null },
    { slug: "coop-pank", name: "Coop Pank", country: "Estonya", brand_color: "#0054A6", accent_color: "#0054A6", logo_file: null },
    { slug: "inbank", name: "Inbank", country: "Estonya", brand_color: "#000000", accent_color: "#000000", logo_file: null },
    { slug: "lhv-pank", name: "LHV Pank", country: "Estonya", brand_color: "#000000", accent_color: "#000000", logo_file: null },
    { slug: "luminor-ee", name: "Luminor", country: "Estonya", brand_color: "#000000", accent_color: "#000000", logo_file: null },
    { slug: "op-corporate-bank", name: "OP Corporate Bank", country: "Estonya", brand_color: "#FF6600", accent_color: "#FF6600", logo_file: null },
    { slug: "seb-pank", name: "SEB Pank", country: "Estonya", brand_color: "#00B050", accent_color: "#00B050", logo_file: null },
    { slug: "swedbank-ee", name: "Swedbank", country: "Estonya", brand_color: "#EE7003", accent_color: "#EE7003", logo_file: null }
  ];

  const { error } = await supabase.from("banks").upsert(estonianBanks, { onConflict: "slug" });

  if (error) {
    console.error("Supabase upsert error:", error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Estonian banks seeded successfully" });
}