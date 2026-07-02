"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Meeting } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso.replace(" ", "T") + "Z").toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: Meeting["status"] }) {
  const styles: Record<Meeting["status"], string> = {
    done: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  const labels: Record<Meeting["status"], string> = {
    done: "完了",
    processing: "処理中",
    error: "エラー",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    try {
      await fetch(`/api/meetings/${meeting.id}/retry`, { method: "POST" });
      router.refresh();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <li className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{formatDate(meeting.createdAt)}</p>
          <p className="text-xs text-black/50 dark:text-white/50">{meeting.videoFilename}</p>
        </div>
        <StatusBadge status={meeting.status} />
      </div>

      {meeting.status === "done" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium">決まったこと</p>
            {meeting.decidedItems && meeting.decidedItems.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {meeting.decidedItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-black/40 dark:text-white/40">なし</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">次回までの宿題</p>
            {meeting.actionItems && meeting.actionItems.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {meeting.actionItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-black/40 dark:text-white/40">なし</p>
            )}
          </div>
        </div>
      )}

      {meeting.status === "processing" && (
        <p className="text-sm text-black/50 dark:text-white/50">文字起こし・要約を処理中です…</p>
      )}

      {meeting.status === "error" && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{meeting.errorMessage}</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="rounded-md border border-black/10 px-3 py-1 text-xs font-medium disabled:opacity-50 dark:border-white/15"
          >
            {retrying ? "再実行中..." : "再実行する"}
          </button>
        </div>
      )}

      {meeting.transcript && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-black/50 dark:text-white/50">
            文字起こし全文を見る
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-xs text-black/70 dark:text-white/70">
            {meeting.transcript}
          </p>
        </details>
      )}
    </li>
  );
}

export function MeetingSheet({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        まだ会議記録がありません。動画をアップロードすると、ここに蓄積されます。
      </p>
    );
  }

  return <ul className="space-y-4">{meetings.map((m) => (
    <MeetingCard key={m.id} meeting={m} />
  ))}</ul>;
}
