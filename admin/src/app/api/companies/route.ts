import { NextResponse } from "next/server";
import { createCompany, listCompanies } from "@/lib/repository";

export async function GET() {
  return NextResponse.json({ companies: listCompanies() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";

  try {
    const company = createCompany(name);
    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
