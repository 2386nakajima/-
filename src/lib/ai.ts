/**
 * 生成AIを使った問題生成。無料枠のあるサービス（Gemini / OpenRouterの:freeモデル）と
 * 有料のClaudeを同じ手順で扱う。個人利用前提のためAPIキーは端末に置き、
 * サーバーを挟まずブラウザから直接呼び出す。
 */
import { Draft, Provider, Settings } from '@/lib/types';

/** 1リクエストに載せる文字起こしの上限。超えたら分割して複数回呼ぶ。 */
const CHUNK_CHARS = 8000;

const SYSTEM_PROMPT = `あなたは講義や会議の文字起こしから、復習用の「1問1答」問題集を作る専門家です。

制約:
- 文字起こしに書かれている事実だけを使う。推測や一般知識で補わない。
- 問題は1問1答形式。答えは1〜2文（80文字以内）で言い切る。
- 質問だけを読んで何を問われているか分かるようにする（「これ」「それ」などの指示語を使わない）。
- 定義・数値・手順・理由・具体例など、種類が偏らないように配置する。
- 同じ論点を重複させない。フィラー（えー、あのー等）や雑談は問題にしない。
- tagsには内容を表す短い日本語キーワードを1〜3個入れる。
- 日本語で書く。

出力はJSON配列のみ。前後に説明文やコードフェンスを付けない。
形式: [{"question":"...","answer":"...","note":"補足や出典となる発言（任意）","tags":["..."]}]`;

const userPrompt = (transcript: string, count: number) =>
  `次の文字起こしから、1問1答を${count}問作ってください。JSON配列だけを返してください。\n\n---\n${transcript}\n---`;

export class AIError extends Error {}

/** 選択中のサービスのキーが入っているか */
export const hasKey = (s: Settings): boolean =>
  Boolean(s.keys[s.provider]?.trim());

function parseDrafts(text: string): Draft[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) {
    throw new AIError('AIの応答をJSONとして解釈できませんでした。');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AIError('AIの応答が壊れたJSONでした。もう一度お試しください。');
  }
  if (!Array.isArray(parsed))
    throw new AIError('AIの応答が配列ではありません。');
  return (parsed as Draft[])
    .filter(
      (d) =>
        d && typeof d.question === 'string' && typeof d.answer === 'string',
    )
    .map((d) => ({
      question: String(d.question).trim(),
      answer: String(d.answer).trim(),
      note: typeof d.note === 'string' ? d.note.trim() : '',
      tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
    }));
}

/** 長い文字起こしを文の区切りで分割する */
function chunk(text: string): string[] {
  if (text.length <= CHUNK_CHARS) return [text];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > CHUNK_CHARS) {
    const window = rest.slice(0, CHUNK_CHARS);
    const cut = Math.max(window.lastIndexOf('。'), window.lastIndexOf('\n'));
    const at = cut > CHUNK_CHARS * 0.5 ? cut + 1 : CHUNK_CHARS;
    parts.push(rest.slice(0, at));
    rest = rest.slice(at);
  }
  if (rest.trim()) parts.push(rest);
  return parts;
}

async function post(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  label: string,
): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AIError(
      `${label}に接続できませんでした。ネットワーク接続を確認してください。`,
    );
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    if (res.status === 400)
      throw new AIError(
        `${label}がリクエストを拒否しました。モデルIDが正しいか確認してください（400）。`,
      );
    if (res.status === 401 || res.status === 403)
      throw new AIError(
        `${label}のAPIキーが正しくありません（${res.status}）。`,
      );
    if (res.status === 404)
      throw new AIError(
        `${label}にそのモデルが見つかりません。設定でモデルIDを見直してください（404）。`,
      );
    if (res.status === 429)
      throw new AIError(
        `${label}の無料枠の上限に達しました。時間をおくか、問題数を減らしてください（429）。`,
      );
    throw new AIError(
      `${label}のエラー (${res.status}): ${detail.slice(0, 200)}`,
    );
  }
  return (await res.json()) as Record<string, unknown>;
}

/* ------------ サービスごとの呼び出し ------------ */

type GeminiRes = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

async function callGemini(
  key: string,
  model: string,
  transcript: string,
  count: number,
): Promise<Draft[]> {
  const data = (await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    { 'x-goog-api-key': key },
    {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        { role: 'user', parts: [{ text: userPrompt(transcript, count) }] },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    },
    'Gemini',
  )) as GeminiRes;
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('');
  if (!text) throw new AIError('Geminiの応答が空でした。');
  return parseDrafts(text);
}

type OpenAIRes = { choices?: { message?: { content?: string } }[] };

async function callOpenRouter(
  key: string,
  model: string,
  transcript: string,
  count: number,
): Promise<Draft[]> {
  const data = (await post(
    'https://openrouter.ai/api/v1/chat/completions',
    { authorization: `Bearer ${key}`, 'x-title': 'QuizBank' },
    {
      model,
      temperature: 0.4,
      max_tokens: 8000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt(transcript, count) },
      ],
    },
    'OpenRouter',
  )) as OpenAIRes;
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new AIError('OpenRouterの応答が空でした。');
  return parseDrafts(text);
}

type ClaudeRes = {
  content?: { type: string; text?: string }[];
  stop_reason?: string;
};

async function callAnthropic(
  key: string,
  model: string,
  transcript: string,
  count: number,
): Promise<Draft[]> {
  const data = (await post(
    'https://api.anthropic.com/v1/messages',
    {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      // ブラウザからの直接呼び出しを許可する（個人利用のため）
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    {
      model,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt(transcript, count) }],
    },
    'Claude',
  )) as ClaudeRes;
  if (data.stop_reason === 'refusal') {
    throw new AIError(
      'AIが生成を拒否しました。文字起こしの内容を確認してください。',
    );
  }
  const text = (data.content ?? [])
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text as string)
    .join('\n');
  if (!text) throw new AIError('Claudeの応答が空でした。');
  return parseDrafts(text);
}

const CALLERS: Record<
  Provider,
  (k: string, m: string, t: string, c: number) => Promise<Draft[]>
> = {
  gemini: callGemini,
  openrouter: callOpenRouter,
  anthropic: callAnthropic,
};

/**
 * 選択中のAIサービスで問題を生成する。長文は自動で分割し、章ごとに問題を作る。
 * @param onProgress 分割実行時の進捗通知（完了数/全体）
 */
export async function generateWithAI(
  settings: Settings,
  transcript: string,
  count: number,
  onProgress?: (done: number, total: number) => void,
): Promise<Draft[]> {
  const key = settings.keys[settings.provider]?.trim();
  const model = settings.models[settings.provider]?.trim();
  if (!key)
    throw new AIError('APIキーが未設定です。設定タブで登録してください。');
  if (!model)
    throw new AIError('モデルIDが未設定です。設定タブで登録してください。');

  const chunks = chunk(transcript);
  const per = Math.max(5, Math.ceil(count / chunks.length));
  const call = CALLERS[settings.provider];
  const all: Draft[] = [];
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i, chunks.length);
    all.push(...(await call(key, model, chunks[i], per)));
  }
  onProgress?.(chunks.length, chunks.length);

  const seen = new Set<string>();
  return all.filter((d) => {
    const k = d.question.replace(/\s/g, '');
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
