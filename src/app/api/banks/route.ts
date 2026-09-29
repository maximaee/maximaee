import { NextResponse } from "next/server";
import { getBankBySlugDb, getBanks, updateBanks } from "@/lib/banks-db";
import { revalidatePath } from "next/cache";
import { EE_BANKS_FALLBACK } from "@/lib/at-bank-catalog";
import { normalizeCountryName } from "@/lib/country-utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const bank = await getBankBySlugDb(slug);

      if (!bank) {
        const eeFallback = [...EE_BANKS_FALLBACK].find(b => b.slug === slug);
        if (eeFallback) {
          return NextResponse.json({ bank: eeFallback }, {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });
        }
        return NextResponse.json({ error: "Banka bulunamadı" }, { status: 404 });
      }

      return NextResponse.json({
        bank: {
          ...bank,
          country: normalizeCountryName(bank.country),
          isActive: bank.isActive !== false,
        },
      }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }

    const dbBanks = await getBanks();
    
    const fixedBanks = dbBanks?.map((b: any) => ({
      ...b,
      country: normalizeCountryName(b.country),
      isActive: b.isActive !== false
    })) || [];

    const eeActive = fixedBanks.filter((b: any) =>
      b.isActive && b.country === "Estonya"
    );

    let finalBanks = fixedBanks;
    if (eeActive.length === 0) {
      finalBanks = [...fixedBanks, ...EE_BANKS_FALLBACK.map(b => ({ ...b }))];
    }

    return NextResponse.json({ banks: finalBanks }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { banks } = await req.json();
    await updateBanks(banks);
    
    // Değişikliklerin anında yansıması için tüm cache'i temizle
    revalidatePath("/", "layout");
    
    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
