"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Company } from "@/lib/types";

export function CompanyManager({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "登録に失敗しました");
      }
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この企業と、蓄積された会議記録をすべて削除します。よろしいですか？")) {
      return;
    }
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="企業名を入力"
          className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-black/20"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          追加
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {companies.map((company) => (
          <li key={company.id} className="flex items-center justify-between py-3">
            <a href={`/companies/${company.id}`} className="text-sm font-medium hover:underline">
              {company.name}
            </a>
            <button
              onClick={() => handleDelete(company.id)}
              className="text-xs text-red-600 hover:underline"
            >
              削除
            </button>
          </li>
        ))}
        {companies.length === 0 && (
          <li className="py-3 text-sm text-black/50 dark:text-white/50">
            まだ企業が登録されていません。
          </li>
        )}
      </ul>
    </div>
  );
}
