import { NextResponse } from "next/server";
import { deleteCompany, getCompanyById } from "@/lib/repository";

export async function GET(_req: Request, ctx: RouteContext<"/api/companies/[id]">) {
  const { id } = await ctx.params;
  const company = getCompanyById(id);
  if (!company) {
    return NextResponse.json({ error: "企業が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ company });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/companies/[id]">) {
  const { id } = await ctx.params;
  const company = getCompanyById(id);
  if (!company) {
    return NextResponse.json({ error: "企業が見つかりません" }, { status: 404 });
  }
  deleteCompany(id);
  return NextResponse.json({ ok: true });
}
