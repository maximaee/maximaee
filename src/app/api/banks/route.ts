import { NextResponse } from "next/server";
import { getBanks, updateBanks } from "@/lib/banks-db";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const banks = await getBanks();
    return NextResponse.json({ banks });
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
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
