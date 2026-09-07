/** 問題集アプリのドメイン型定義 */

/** 1問1答の問題（マスターデータ） */
export type Question = {
  id: string;
  question: string;
  answer: string;
  /** 補足・出典メモ */
  note: string;
  tags: string[];
  /** 生成元の文字起こしID（手動作成時は null） */
  sourceId: string | null;
  createdAt: number;
  updatedAt: number;
  correctCount: number;
  wrongCount: number;
  lastAnsweredAt: number | null;
};

/** 問題の生成元になった文字起こし */
export type Source = {
  id: string;
  title: string;
  transcript: string;
  createdAt: number;
};

export type ModelId = 'claude-opus-5' | 'claude-sonnet-5' | 'claude-haiku-4-5';

export type Settings = {
  /** Anthropic APIキー（端末のlocalStorageにのみ保存） */
  apiKey: string;
  model: ModelId;
  /** 1回の生成で作る問題数の目標値 */
  questionCount: number;
};

/** 保存前の生成結果 */
export type Draft = {
  question: string;
  answer: string;
  note?: string;
  tags?: string[];
};

export const MODELS: { id: ModelId; label: string }[] = [
  { id: 'claude-opus-5', label: 'Opus 5（最高品質）' },
  { id: 'claude-sonnet-5', label: 'Sonnet 5（バランス）' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5（低コスト）' },
];

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'claude-opus-5',
  questionCount: 12,
};
