// アプリ全体で使うデータ型の定義

/** スタッフ（従業員） */
export type Staff = {
  id: string;
  name: string;
  role: string; // 役職・区分（例: ホール、キッチン、店長）
  hourlyWage: number; // 時給（円）
  color: string; // カレンダー上での識別色
};

/** 希望シフトの承認状態 */
export type RequestStatus = 'pending' | 'approved' | 'rejected';

/** スタッフが提出する希望シフト */
export type ShiftRequest = {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  note?: string;
  status: RequestStatus;
};

/** 管理者が確定させたシフト */
export type Shift = {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  breakMinutes: number; // 休憩（分）
  note?: string;
};

/** 永続化するアプリ全体のデータ */
export type AppData = {
  staff: Staff[];
  requests: ShiftRequest[];
  shifts: Shift[];
};

export function emptyData(): AppData {
  return { staff: [], requests: [], shifts: [] };
}
