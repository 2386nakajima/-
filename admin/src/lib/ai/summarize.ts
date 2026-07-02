import Anthropic from "@anthropic-ai/sdk";

export type MeetingSummary = {
  decidedItems: string[];
  actionItems: string[];
};

const SYSTEM_PROMPT = `あなたは商談・打ち合わせの議事録アシスタントです。
与えられた会議の文字起こしから、次の2点を日本語の箇条書きで抽出してください。

1. decidedItems: その会議で「決まったこと」（合意事項・決定事項）
2. actionItems: 「次回までにしなければならないこと」（宿題・タスク・持ち帰り事項）

出力は必ず次のJSON形式のみで返してください。前後に説明文やコードブロックの記号(\`\`\`)は付けないこと。
{"decidedItems": ["..."], "actionItems": ["..."]}

該当する項目がない場合は空配列にしてください。`;

function extractJson(text: string): MeetingSummary {
  const match = text.match(/\{[\s\S]*\}/);
  const jsonText = match ? match[0] : text;
  const parsed = JSON.parse(jsonText);
  return {
    decidedItems: Array.isArray(parsed.decidedItems) ? parsed.decidedItems.map(String) : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map(String) : [],
  };
}

export async function summarizeTranscript(transcript: string): Promise<MeetingSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `以下は会議の文字起こしです。\n\n${transcript}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude からテキスト応答を取得できませんでした");
  }

  return extractJson(textBlock.text);
}
