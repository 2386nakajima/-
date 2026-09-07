/**
 * APIキーなしでも動く、文字起こしからのルールベース問題生成。
 * 形態素解析は使わず、日本語の頻出パターン（定義・数値・理由・穴埋め）で
 * 1問1答を組み立てる。品質はAI生成に劣るがオフラインで即座に動く。
 */
import { Draft } from '@/lib/types';

/** 話し言葉のフィラー。問題文に混ざると質が落ちるので除去する。 */
const FILLERS =
  /(えーと|えっと|えー|あのー|あの、|まあ、|まあ|なんか|そのー|ですね、|はい、)/g;

const STOP_WORDS = new Set([
  'これ',
  'それ',
  'あれ',
  'ここ',
  'そこ',
  'こと',
  'もの',
  'ため',
  'とき',
  'ところ',
  '場合',
  '自分',
  '皆さん',
  '今日',
  '今回',
  '本日',
  '説明',
  '内容',
  '部分',
  '感じ',
]);

/** 文頭の接続詞。問題文に残ると不自然なので落とす。 */
const LEAD_WORDS =
  /^(?:まず、?|次に、?|最後に、?|それから、?|また、?|そして、?|さらに、?|ただし、?|しかし、?|つまり、?|ちなみに、?|今日は|本日は)/;

/** 主語として弱い語（問題文にしても意味が通らない） */
const WEAK_SUBJECTS = new Set([
  '今日',
  '本日',
  '今回',
  '私',
  '僕',
  '我々',
  'これ',
  'それ',
  'ここ',
  '皆さん',
]);

const clean = (s: string) =>
  s
    .replace(FILLERS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(LEAD_WORDS, '')
    .trim();

/** 文字起こしを文単位に分割する */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split(/(?<=[。！？!?])|\n+/)
    .map(clean)
    .filter((s) => s.length >= 12);
}

/** 名詞らしい語（漢字2文字以上・カタカナ3文字以上・英数）を抽出する */
export function extractTerms(sentence: string): string[] {
  const matched =
    sentence.match(/[一-龠々]{2,}|[ァ-ヴー]{3,}|[A-Za-z][A-Za-z0-9.-]{2,}/g) ??
    [];
  return matched
    .filter((t) => !STOP_WORDS.has(t))
    .filter((t) => t.length <= 20)
    .sort((a, b) => b.length - a.length);
}

const trimTail = (s: string) =>
  s.replace(/[。、,.\s]+$/, '').replace(/^[、,\s]+/, '');

type Rule = (s: string) => Draft | null;

/** 「XとはY」→ Xとは何か */
const definitionRule: Rule = (s) => {
  const m = s.match(/^(.{2,24}?)(?:とは|というのは)、?(.{6,}?)[。！？!?]?$/);
  if (!m) return null;
  const term = trimTail(m[1]);
  const body = trimTail(m[2]).replace(/(のことです|のことだ|のこと)$/, '');
  if (!term || body.length < 6) return null;
  return {
    question: `${term}とは何ですか？`,
    answer: body,
    tags: ['定義'],
  };
};

/** 「AはB」→ Aは？（1問1答の基本形） */
const statementRule: Rule = (s) => {
  const m = s.match(/^(.{2,24}?)(?:は|とは|が)(.{10,})[。！？!?]$/);
  if (!m) return null;
  const subject = trimTail(m[1]);
  const body = trimTail(m[2]);
  if (!subject || WEAK_SUBJECTS.has(subject) || body.length < 10) return null;
  return {
    question: `${subject}は？`,
    answer: body,
    tags: ['要点'],
  };
};

/** 数値を含む文 → 何〇〇か */
const numberRule: Rule = (s) => {
  const m = s.match(
    /(\d[\d,.]*)\s*(％|%|円|万円|億円|人|名|年|か月|ヶ月|月|日|時間|分|秒|回|個|件|倍|割|点|位|kg|km|cm|mm|m|g|GB|MB)/,
  );
  if (!m) return null;
  const question = s.replace(m[0], `何${m[2]}`);
  if (question === s) return null;
  return {
    question: `次の空欄に入る数値は？ ${trimTail(question)}`,
    answer: `${m[1]}${m[2]}`,
    tags: ['数値'],
  };
};

/** 「〜のは〜ためです」→ なぜ？ */
const reasonRule: Rule = (s) => {
  const m = s.match(
    /^(.{6,}?)(?:のは|の理由は)、?(.{4,}?)(?:ためです|ためだ|ためである|からです|からだ)[。！？!?]?$/,
  );
  if (!m) return null;
  const result = trimTail(m[1]);
  const reason = trimTail(m[2]);
  if (result.length < 6 || reason.length < 4) return null;
  return {
    question: `なぜ${result}のですか？`,
    answer: `${reason}ため`,
    tags: ['理由'],
  };
};

/** 最終手段：重要語を伏せた穴埋め */
const clozeRule: Rule = (s) => {
  const term = extractTerms(s)[0];
  if (!term || s.length < 16) return null;
  return {
    question: `空欄に入る語句は？ ${trimTail(s).replace(term, '＿＿＿＿')}`,
    answer: term,
    tags: ['穴埋め'],
  };
};

const PRIMARY_RULES: Rule[] = [
  definitionRule,
  numberRule,
  reasonRule,
  statementRule,
];

/**
 * 文字起こしからルールベースで問題を作る。
 * @param target 目標問題数（最低10問を推奨）
 */
export function generateOffline(text: string, target = 12): Draft[] {
  const sentences = splitSentences(text);
  const drafts: Draft[] = [];
  const seen = new Set<string>();

  const push = (d: Draft | null) => {
    if (!d) return;
    const key = `${d.question}|${d.answer}`;
    if (seen.has(key)) return;
    if (d.answer.length > 160) return;
    seen.add(key);
    drafts.push(d);
  };

  // 1周目：質の高いパターンから採用する
  const used = new Set<string>();
  for (const s of sentences) {
    if (drafts.length >= target) break;
    for (const rule of PRIMARY_RULES) {
      const d = rule(s);
      if (d) {
        push(d);
        used.add(s);
        break;
      }
    }
  }

  // 2周目：不足分を穴埋めで補う（情報量の多い文を優先）
  if (drafts.length < target) {
    const ranked = [...sentences].sort(
      (a, b) => extractTerms(b).length - extractTerms(a).length,
    );
    for (const s of ranked) {
      if (drafts.length >= target) break;
      if (used.has(s)) continue; // 同じ文から二重に出題しない
      push(clozeRule(s));
    }
  }

  return drafts;
}
