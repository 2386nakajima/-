// localStorage をラップした永続化層。
// Web ブラウザでは localStorage を使い、それ以外（ネイティブ等）や
// 取得失敗時はメモリ上のフォールバックで安全に動作する。

import { AppData, emptyData } from './types';

const STORAGE_KEY = 'shift-kit:data:v1';

let memoryFallback: string | null = null;

function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    // アクセス自体が例外になる環境（プライベートモード等）もある
  }
  return null;
}

export function loadData(): AppData {
  let raw: string | null = null;
  const ls = getLocalStorage();
  if (ls) {
    try {
      raw = ls.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
  }
  if (raw == null) {
    raw = memoryFallback;
  }
  if (raw == null) {
    return emptyData();
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      staff: Array.isArray(parsed.staff) ? parsed.staff : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  const raw = JSON.stringify(data);
  memoryFallback = raw;
  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.setItem(STORAGE_KEY, raw);
    } catch {
      // 保存失敗時はメモリ上のフォールバックのみ更新される
    }
  }
}
