import fs from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-ぁ-んァ-ヶ一-龠々ー]/g, "_").slice(-150) || "video";
}

export async function saveUploadedVideo(
  companyId: string,
  meetingId: string,
  file: File
): Promise<{ videoPath: string; videoFilename: string }> {
  const dir = path.join(UPLOADS_DIR, companyId);
  await fs.mkdir(dir, { recursive: true });

  const videoFilename = sanitizeFilename(file.name || "video.mp4");
  const videoPath = path.join(dir, `${meetingId}-${videoFilename}`);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(videoPath, buffer);

  return { videoPath, videoFilename };
}
