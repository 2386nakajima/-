"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Company, Meeting } from "@/lib/types";

export function UploadForm({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Meeting | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!companyId) {
      setError("企業を選択してください");
      return;
    }
    if (!file) {
      setError("動画ファイルを選択してください");
      return;
    }

    const formData = new FormData();
    formData.set("companyId", companyId);
    formData.set("video", file);

    setSubmitting(true);
    try {
      const res = await fetch("/api/meetings", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "アップロードに失敗しました");
      }
      setResult(data.meeting);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (companies.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        先に「企業管理」から企業を登録してください。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">企業</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-black/20"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">動画ファイル</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-foreground file:px-3 file:py-1 file:text-background dark:border-white/15 dark:bg-black/20"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {submitting ? "処理中（文字起こし・要約）..." : "アップロードして解析"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded-md border border-black/10 p-4 text-sm dark:border-white/15">
          {result.status === "done" && (
            <>
              <p className="mb-2 font-medium text-green-700 dark:text-green-400">解析が完了しました</p>
              <div className="mb-3">
                <p className="font-medium">決まったこと</p>
                <ul className="list-disc pl-5">
                  {(result.decidedItems ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">次回までの宿題</p>
                <ul className="list-disc pl-5">
                  {(result.actionItems ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {result.status === "error" && (
            <p className="text-red-600">
              解析に失敗しました: {result.errorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
