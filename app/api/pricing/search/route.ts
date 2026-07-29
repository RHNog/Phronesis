import { NextResponse } from "next/server";
import { getPricingRepository } from "@/lib/pricing/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const categoryId = url.searchParams.get("category") ?? "pokemon-en";
  try {
    return NextResponse.json(getPricingRepository().search(categoryId, query));
  } catch {
    return NextResponse.json(
      { error: "Pricing lookup is temporarily unavailable. Your search was preserved; try again." },
      { status: 500 },
    );
  }
}
