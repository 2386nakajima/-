import Link from "next/link";
import { listCompanies, listMeetingsByCompany } from "@/lib/repository";

export default function Home() {
  const companies = listCompanies();
  const companiesWithLatest = companies.map((company) => {
    const meetings = listMeetingsByCompany(company.id);
    return { company, latest: meetings[0] ?? null, count: meetings.length };
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">企業別ダッシュボード</h1>
        <Link
          href="/upload"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          動画をアップロード
        </Link>
      </div>

      {companiesWithLatest.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          まだ企業が登録されていません。
          <Link href="/companies" className="ml-1 underline">
            企業管理
          </Link>
          から登録してください。
        </p>
      ) : (
        <ul className="space-y-3">
          {companiesWithLatest.map(({ company, latest, count }) => (
            <li key={company.id}>
              <Link
                href={`/companies/${company.id}`}
                className="block rounded-lg border border-black/10 p-4 hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{company.name}</p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    会議記録 {count} 件
                  </p>
                </div>
                {latest ? (
                  <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                    最新: {latest.videoFilename}（
                    {latest.status === "done"
                      ? "解析完了"
                      : latest.status === "processing"
                        ? "処理中"
                        : "エラー"}
                    ）
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-black/40 dark:text-white/40">
                    まだ会議記録がありません
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
