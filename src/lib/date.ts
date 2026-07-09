// 日付・時刻まわりのユーティリティ。すべてローカルタイム基準で扱う。

const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土'];

/** Date を YYYY-MM-DD 文字列に変換 */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD 文字列を Date に変換（ローカル 0:00） */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10));
  return new Date(y, m - 1, d);
}

/** 今日の YYYY-MM-DD */
export function todayISO(): string {
  return toISODate(new Date());
}

/** 日数を加算した YYYY-MM-DD を返す */
export function addDaysISO(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** iso の曜日インデックス（0=日, 6=土） */
export function weekdayIndex(iso: string): number {
  return fromISODate(iso).getDay();
}

/** iso の曜日（日本語1文字） */
export function weekdayJP(iso: string): string {
  return WEEKDAY_JP[weekdayIndex(iso)];
}

/** iso を含む週の月曜始まり7日分の YYYY-MM-DD 配列 */
export function weekDates(iso: string): string[] {
  const idx = weekdayIndex(iso); // 0=日
  const mondayOffset = idx === 0 ? -6 : 1 - idx;
  const monday = addDaysISO(iso, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i));
}

/** iso の属する月（YYYY-MM） */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/** YYYY-MM を1か月ずらす */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map((v) => parseInt(v, 10));
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
}

/** YYYY-MM の日付（YYYY-MM-DD）配列 */
export function monthDates(month: string): string[] {
  const [y, m] = month.split('-').map((v) => parseInt(v, 10));
  const days = new Date(y, m, 0).getDate();
  return Array.from({ length: days }, (_, i) =>
    toISODate(new Date(y, m - 1, i + 1)),
  );
}

/** 表示用の短い日付（M/D(曜)） */
export function formatShort(iso: string): string {
  const d = fromISODate(iso);
  return `${d.getMonth() + 1}/${d.getDate()}(${weekdayJP(iso)})`;
}

/** 表示用の月ラベル（YYYY年M月） */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map((v) => parseInt(v, 10));
  return `${y}年${m}月`;
}

/** "HH:MM" を0時からの分数に変換。不正な値は null */
export function timeToMinutes(t: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 47 || m > 59) return null;
  return h * 60 + m;
}

/**
 * 勤務時間（分）を計算。休憩を差し引く。
 * 終了が開始以下の場合は翌日にまたぐ夜勤とみなし24時間加算する。
 */
export function workMinutes(
  start: string,
  end: string,
  breakMinutes: number,
): number {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s == null || e == null) return 0;
  let span = e - s;
  if (span <= 0) span += 24 * 60;
  const net = span - Math.max(0, breakMinutes);
  return net > 0 ? net : 0;
}

/** 分を "H.H h" 表示用の時間数に変換 */
export function minutesToHours(min: number): number {
  return Math.round((min / 60) * 100) / 100;
}
