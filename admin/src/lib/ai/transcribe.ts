import fs from "node:fs";
import OpenAI from "openai";

export async function transcribeVideo(filePath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません");
  }
  const client = new OpenAI({ apiKey });

  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
    language: "ja",
  });

  return transcription.text;
}
