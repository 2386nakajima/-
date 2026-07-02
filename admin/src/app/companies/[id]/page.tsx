import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyById, listMeetingsByCompany } from "@/lib/repository";
import { MeetingSheet } from "@/components/MeetingSheet";

export default async function CompanyDetailPage(
  props: PageProps<"/companies/[id]">
) {
  const { id } = await props.params;
  const company = getCompanyById(id);
  if (!company) {
    notFound();
  }

  const meetings = listMeetingsByCompany(id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-black/50 dark:text-white/50">企業別シート</p>
          <h1 className="text-xl font-semibold">{company.name}</h1>
        </div>
        <Link
          href="/upload"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          動画をアップロード
        </Link>
      </div>

      <MeetingSheet meetings={meetings} />
    </div>
  );
}
