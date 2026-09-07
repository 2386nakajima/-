/**
 * ブラウザの localStorage を使った超軽量ストア。
 * 個人利用前提のためサーバー・認証は持たず、端末内に全データを保存する。
 */
import { useSyncExternalStore } from 'react';

import {
  DEFAULT_SETTINGS,
  Draft,
  Question,
  Settings,
  Source,
} from '@/lib/types';

const STORAGE_KEY = 'quizbank.v1';

export type DB = {
  questions: Question[];
  sources: Source[];
  settings: Settings;
};

const emptyDB = (): DB => ({
  questions: [],
  sources: [],
  settings: { ...DEFAULT_SETTINGS },
});

let db: DB = emptyDB();
let hydrated = false;
const listeners = new Set<() => void>();

export const newId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: DB) {
  db = next;
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // 容量超過などは無視（画面表示は継続する）
  }
  emit();
}

/** 起動直後に1度だけ呼ぶ。SSR/初回描画の不一致を避けるため useEffect から実行する。 */
export function hydrate() {
  if (hydrated) return;
  hydrated = true;
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Partial<DB>;
    db = {
      questions: parsed.questions ?? [],
      sources: parsed.sources ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
    emit();
  } catch {
    // 壊れたデータは初期状態として扱う
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => db;

/** 静的HTMLと初回描画を一致させるための空データ（参照を固定する） */
const SSR_DB: DB = emptyDB();

export function useDB(): DB {
  // 第3引数はハイドレーション時に使われる。事前生成HTMLは空データで描画されている
  // ため、ここでも空データを返して不一致を防ぐ（直後に実データで再描画される）。
  return useSyncExternalStore(subscribe, getSnapshot, () => SSR_DB);
}

/* ---------------- 更新系 ---------------- */

export function addSource(title: string, transcript: string): Source {
  const source: Source = {
    id: newId(),
    title: title.trim() || '無題の文字起こし',
    transcript,
    createdAt: Date.now(),
  };
  commit({ ...db, sources: [source, ...db.sources] });
  return source;
}

export function addQuestions(drafts: Draft[], sourceId: string | null) {
  const now = Date.now();
  const created: Question[] = drafts.map((d) => ({
    id: newId(),
    question: d.question.trim(),
    answer: d.answer.trim(),
    note: d.note?.trim() ?? '',
    tags: (d.tags ?? []).map((t) => t.trim()).filter(Boolean),
    sourceId,
    createdAt: now,
    updatedAt: now,
    correctCount: 0,
    wrongCount: 0,
    lastAnsweredAt: null,
  }));
  commit({ ...db, questions: [...created, ...db.questions] });
  return created;
}

export function updateQuestion(id: string, patch: Partial<Question>) {
  commit({
    ...db,
    questions: db.questions.map((q) =>
      q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q,
    ),
  });
}

export function recordAnswer(id: string, correct: boolean) {
  const q = db.questions.find((x) => x.id === id);
  if (!q) return;
  updateQuestion(id, {
    correctCount: q.correctCount + (correct ? 1 : 0),
    wrongCount: q.wrongCount + (correct ? 0 : 1),
    lastAnsweredAt: Date.now(),
  });
}

export function deleteQuestions(ids: string[]) {
  const set = new Set(ids);
  commit({ ...db, questions: db.questions.filter((q) => !set.has(q.id)) });
}

/** 文字起こしと、そこから作った問題をまとめて削除する */
export function deleteSource(sourceId: string) {
  commit({
    ...db,
    sources: db.sources.filter((s) => s.id !== sourceId),
    questions: db.questions.filter((q) => q.sourceId !== sourceId),
  });
}

export function saveSettings(patch: Partial<Settings>) {
  commit({ ...db, settings: { ...db.settings, ...patch } });
}

export function getSettings(): Settings {
  return db.settings;
}

/* ---------------- 入出力 ---------------- */

export function exportJSON(): string {
  return JSON.stringify(
    { questions: db.questions, sources: db.sources },
    null,
    2,
  );
}

/** JSONを取り込む。既存IDは上書きせず、新しいIDを振って追加する。 */
export function importJSON(raw: string): {
  questions: number;
  sources: number;
} {
  const parsed = JSON.parse(raw) as Partial<DB>;
  const sources = Array.isArray(parsed.sources) ? parsed.sources : [];
  const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
  const idMap = new Map<string, string>();

  const nextSources: Source[] = sources.map((s) => {
    const id = newId();
    idMap.set(s.id, id);
    return {
      id,
      title: s.title ?? '無題の文字起こし',
      transcript: s.transcript ?? '',
      createdAt: s.createdAt ?? Date.now(),
    };
  });

  const now = Date.now();
  const nextQuestions: Question[] = questions
    .filter((q) => q && q.question && q.answer)
    .map((q) => ({
      id: newId(),
      question: String(q.question),
      answer: String(q.answer),
      note: q.note ?? '',
      tags: Array.isArray(q.tags) ? q.tags : [],
      sourceId: q.sourceId ? (idMap.get(q.sourceId) ?? null) : null,
      createdAt: q.createdAt ?? now,
      updatedAt: now,
      correctCount: q.correctCount ?? 0,
      wrongCount: q.wrongCount ?? 0,
      lastAnsweredAt: q.lastAnsweredAt ?? null,
    }));

  commit({
    ...db,
    sources: [...nextSources, ...db.sources],
    questions: [...nextQuestions, ...db.questions],
  });
  return { questions: nextQuestions.length, sources: nextSources.length };
}

export function exportCSV(questions: Question[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const head = ['question', 'answer', 'note', 'tags'].join(',');
  const rows = questions.map((q) =>
    [q.question, q.answer, q.note, q.tags.join(' ')].map(esc).join(','),
  );
  return [head, ...rows].join('\n');
}

/** 問題と文字起こしを全消去する（設定は残す） */
export function clearAllData() {
  commit({ ...db, questions: [], sources: [] });
}
