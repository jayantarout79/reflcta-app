import { NextResponse } from "next/server";
import {
  generateSemanticCatalog,
  writeSemanticCatalog,
} from "@/lib/analytics/semantic";

export const runtime = "nodejs";

export async function POST() {
  const catalog = await generateSemanticCatalog();
  if (!catalog) {
    return NextResponse.json(
      {
        error:
          "Unable to generate semantic catalog. Ensure SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are configured.",
      },
      { status: 500 },
    );
  }

  await writeSemanticCatalog(catalog);
  return NextResponse.json({ success: true, generatedAt: catalog.generatedAt });
}
