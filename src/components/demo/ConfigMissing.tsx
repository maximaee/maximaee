"use client";

export function ConfigMissing() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
      <p className="font-semibold">Supabase'i seadistus puudub</p>
      <p className="mt-2 text-sm">
        Määra failis `.env.local` väärtused `NEXT_PUBLIC_SUPABASE_URL` ja `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
      </p>
    </div>
  );
}
