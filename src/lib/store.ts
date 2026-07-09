// アプリのデータストア。useSyncExternalStore でReactに購読させる。
// 初期状態は空（サーバー描画とクライアント初回描画を一致させるため）。
// クライアントで hydrate() を呼ぶと localStorage から読み込む。

import { useSyncExternalStore } from 'react';
import { loadData, saveData } from './storage';
import {
  AppData,
  emptyData,
  RequestStatus,
  Shift,
  ShiftRequest,
  Staff,
} from './types';

let state: AppData = emptyData();
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function commit(next: AppData): void {
  state = next;
  saveData(state);
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppData {
  return state;
}

/** クライアントで一度だけ localStorage から読み込む */
export function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  state = loadData();
  emit();
}

export function useData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ---- スタッフ ----

export function addStaff(input: Omit<Staff, 'id'>): Staff {
  const staff: Staff = { ...input, id: uid('stf') };
  commit({ ...state, staff: [...state.staff, staff] });
  return staff;
}

export function updateStaff(
  id: string,
  patch: Partial<Omit<Staff, 'id'>>,
): void {
  commit({
    ...state,
    staff: state.staff.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  });
}

export function removeStaff(id: string): void {
  commit({
    ...state,
    staff: state.staff.filter((s) => s.id !== id),
    shifts: state.shifts.filter((s) => s.staffId !== id),
    requests: state.requests.filter((r) => r.staffId !== id),
  });
}

// ---- 希望シフト ----

export function addRequest(input: Omit<ShiftRequest, 'id' | 'status'>): void {
  const request: ShiftRequest = { ...input, id: uid('req'), status: 'pending' };
  commit({ ...state, requests: [...state.requests, request] });
}

export function setRequestStatus(id: string, status: RequestStatus): void {
  const target = state.requests.find((r) => r.id === id);
  if (!target) return;

  let shifts = state.shifts;
  if (status === 'approved') {
    // 承認時に確定シフトへ反映（この希望から作られたシフトを一意に紐付け）
    const shiftId = `fromreq_${target.id}`;
    const shift: Shift = {
      id: shiftId,
      staffId: target.staffId,
      date: target.date,
      start: target.start,
      end: target.end,
      breakMinutes: 0,
      note: target.note,
    };
    shifts = [...shifts.filter((s) => s.id !== shiftId), shift];
  } else {
    // 承認以外に変更したら、この希望由来のシフトは取り消す
    shifts = shifts.filter((s) => s.id !== `fromreq_${target.id}`);
  }

  commit({
    ...state,
    shifts,
    requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)),
  });
}

export function removeRequest(id: string): void {
  commit({
    ...state,
    requests: state.requests.filter((r) => r.id !== id),
    shifts: state.shifts.filter((s) => s.id !== `fromreq_${id}`),
  });
}

// ---- 確定シフト ----

export function addShift(input: Omit<Shift, 'id'>): void {
  const shift: Shift = { ...input, id: uid('sft') };
  commit({ ...state, shifts: [...state.shifts, shift] });
}

export function updateShift(
  id: string,
  patch: Partial<Omit<Shift, 'id'>>,
): void {
  commit({
    ...state,
    shifts: state.shifts.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  });
}

export function removeShift(id: string): void {
  commit({ ...state, shifts: state.shifts.filter((s) => s.id !== id) });
}

// ---- サンプルデータ / リセット ----

const SAMPLE_COLORS = ['#2563eb', '#059669', '#d97706', '#db2777', '#7c3aed'];

export function loadSampleData(): void {
  const names: Omit<Staff, 'id'>[] = [
    {
      name: '田中 花子',
      role: '店長',
      hourlyWage: 1500,
      color: SAMPLE_COLORS[0],
    },
    {
      name: '佐藤 太郎',
      role: 'ホール',
      hourlyWage: 1100,
      color: SAMPLE_COLORS[1],
    },
    {
      name: '鈴木 一郎',
      role: 'キッチン',
      hourlyWage: 1200,
      color: SAMPLE_COLORS[2],
    },
    {
      name: '高橋 みか',
      role: 'ホール',
      hourlyWage: 1100,
      color: SAMPLE_COLORS[3],
    },
  ];
  const staff: Staff[] = names.map((n) => ({ ...n, id: uid('stf') }));

  const today = new Date();
  const iso = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return toISO(d);
  };

  const shifts: Shift[] = [
    {
      id: uid('sft'),
      staffId: staff[0].id,
      date: iso(0),
      start: '09:00',
      end: '18:00',
      breakMinutes: 60,
    },
    {
      id: uid('sft'),
      staffId: staff[1].id,
      date: iso(0),
      start: '10:00',
      end: '15:00',
      breakMinutes: 0,
    },
    {
      id: uid('sft'),
      staffId: staff[2].id,
      date: iso(1),
      start: '11:00',
      end: '22:00',
      breakMinutes: 60,
    },
    {
      id: uid('sft'),
      staffId: staff[3].id,
      date: iso(1),
      start: '17:00',
      end: '22:00',
      breakMinutes: 0,
    },
    {
      id: uid('sft'),
      staffId: staff[1].id,
      date: iso(2),
      start: '09:00',
      end: '17:00',
      breakMinutes: 45,
    },
  ];

  const requests: ShiftRequest[] = [
    {
      id: uid('req'),
      staffId: staff[3].id,
      date: iso(3),
      start: '17:00',
      end: '22:00',
      status: 'pending',
      note: '18時以降希望',
    },
    {
      id: uid('req'),
      staffId: staff[2].id,
      date: iso(4),
      start: '11:00',
      end: '20:00',
      status: 'pending',
    },
  ];

  commit({ staff, shifts, requests });
}

export function resetAll(): void {
  commit(emptyData());
}

// store 内でだけ使う軽量ISO変換（date.ts への循環を避ける）
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const staffColorPalette = SAMPLE_COLORS;
