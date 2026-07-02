import { listCompanies } from "@/lib/repository";
import { CompanyManager } from "@/components/CompanyManager";

export default function CompaniesPage() {
  const companies = listCompanies();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-xl font-semibold">企業管理</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">
        ここで登録した企業が、動画アップロード時のプルダウンに表示されます。
      </p>
      <CompanyManager companies={companies} />
    </div>
  );
}
