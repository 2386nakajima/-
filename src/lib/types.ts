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

export type Provider = 'gemini' | 'openrouter' | 'anthropic';

export type ProviderInfo = {
  id: Provider;
  label: string;
  /** 無料枠だけで使えるか */
  free: boolean;
  /** APIキーの取得先 */
  keyUrl: string;
  defaultModel: string;
  note: string;
};

/** 生成に使えるAIサービス。上から順に「無料で始めやすい」順。 */
export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'gemini',
    label: 'Google Gemini（無料枠）',
    free: true,
    keyUrl: 'https://aistudio.google.com/app/apikey',
    defaultModel: 'gemini-2.5-flash',
    note: 'Google AI Studioでキーを無料発行。無料枠のまま日本語の生成品質が高く、まずはこれが第一候補です。',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter（:free モデル）',
    free: true,
    keyUrl: 'https://openrouter.ai/keys',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    note: 'モデルIDの末尾が :free のものは無料で使えます（提供状況は変わるため、モデルIDは編集できます）。',
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude（有料）',
    free: false,
    keyUrl: 'https://console.anthropic.com/settings/keys',
    defaultModel: 'claude-opus-5',
    note: '従量課金。品質を最優先したいときに使います。',
  },
];

export type Settings = {
  /** 生成に使うAIサービス */
  provider: Provider;
  /** APIキーはサービスごとに保持する（端末のlocalStorageにのみ保存） */
  keys: Record<Provider, string>;
  /** モデルIDもサービスごとに保持する（変更可能） */
  models: Record<Provider, string>;
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

export const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  keys: { gemini: '', openrouter: '', anthropic: '' },
  models: {
    gemini: 'gemini-2.5-flash',
    openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
    anthropic: 'claude-opus-5',
  },
  questionCount: 12,
};

export const providerInfo = (id: Provider): ProviderInfo =>
  PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
