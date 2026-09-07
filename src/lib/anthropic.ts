/**
 * Claude API（Messages API）をブラウザから直接呼び出して問題を生成する。
 * 個人利用専用のためAPIキーは端末のlocalStorageに置き、サーバーは挟まない。
 * 公式SDKはReact Native/Expo環境で動作保証がないため、fetchで直接呼ぶ。
 */
import { Draft, ModelId } from '@/lib/types';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
/** 1リクエストに載せる文字起こしの上限。超えたら分割して複数回呼ぶ。 */
const CHUNK_CHARS = 12000;

const SYSTEM_PROMPT = `あなたは講義や会議の文字起こしから、復習用の「1問1答」問題集を作る専門家です。

制約:
- 文字起こしに書かれている事実だけを使う。推測や一般知識で補わない。
- 問題は1問1答形式。答えは1〜2文（80文字以内）で言い切る。
- 質問だけを読んで何を問われているか分かるようにする（「これ」「それ」などの指示語を使わない）。
- 定義・数値・手順・理由・具体例など、種類が偏らないように配置する。
- 同じ論点を重複させない。フィラー（えー、あのー等）や雑談は問題にしない。
- tagsには内容を表す短い日本語キーワードを1〜3個入れる。

出力はJSON配列のみ。前後に説明文やコードフェンスを付けない。
形式: [{"question":"...","answer":"...","note":"補足や出典となる発言（任意）","tags":["..."]}]`;

export class AnthropicError extends Error {}

type Block = { type: string; text?: string };

function parseDrafts(text: string): Draft[] {
  const body = text.replace(/^```(?:json)?/m, '').replace(/```$/m, '');
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start === -1 || end === -1) {
    throw new AnthropicError('AIの応答をJSONとして解釈できませんでした。');
  }
  const parsed = JSON.parse(body.slice(start, end + 1)) as Draft[];
  return parsed
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

async function callOnce(
  apiKey: string,
  model: ModelId,
  transcript: string,
  count: number,
): Promise<Draft[]> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
        // ブラウザからの直接呼び出しを許可する（個人利用のため）
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `次の文字起こしから、1問1答を${count}問作ってください。JSON配列だけを返してください。\n\n---\n${transcript}\n---`,
          },
        ],
      }),
    });
  } catch {
    throw new AnthropicError(
      'Claude APIに接続できませんでした。ネットワークを確認してください。',
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new AnthropicError('APIキーが正しくありません（401）。');
    }
    if (res.status === 429) {
      throw new AnthropicError(
        'レート制限に達しました。少し待って再実行してください。',
      );
    }
    throw new AnthropicError(
      `Claude APIエラー (${res.status}): ${detail.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as {
    content: Block[];
    stop_reason?: string;
  };
  if (data.stop_reason === 'refusal') {
    throw new AnthropicError(
      'AIが生成を拒否しました。文字起こしの内容を確認してください。',
    );
  }
  const text = data.content
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text as string)
    .join('\n');
  if (!text) throw new AnthropicError('AIの応答が空でした。');
  return parseDrafts(text);
}

/**
 * Claudeで問題を生成する。長文は自動で分割し、章ごとに問題を作る。
 * @param onProgress 分割実行時の進捗通知（現在/全体）
 */
export async function generateWithClaude(
  apiKey: string,
  model: ModelId,
  transcript: string,
  count: number,
  onProgress?: (done: number, total: number) => void,
): Promise<Draft[]> {
  const chunks = chunk(transcript);
  const per = Math.max(5, Math.ceil(count / chunks.length));
  const all: Draft[] = [];
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i, chunks.length);
    all.push(...(await callOnce(apiKey, model, chunks[i], per)));
  }
  onProgress?.(chunks.length, chunks.length);

  const seen = new Set<string>();
  return all.filter((d) => {
    const key = d.question.replace(/\s/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
