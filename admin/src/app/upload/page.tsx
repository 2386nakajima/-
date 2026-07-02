import { listCompanies } from "@/lib/repository";
import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
  const companies = listCompanies();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-2 text-xl font-semibold">動画アップロード</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">
        企業を選択して動画をアップロードすると、文字起こしとAI要約により「決まったこと」「次回までの宿題」を自動抽出し、その企業のシートに蓄積します。
      </p>
      <UploadForm companies={companies} />
    </div>
  );
}
