import { NextResponse } from "next/server";
import {
  createMeeting,
  getCompanyById,
  getMeetingById,
  updateMeetingVideo,
} from "@/lib/repository";
import { saveUploadedVideo } from "@/lib/uploads";
import { processMeeting } from "@/lib/processMeeting";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const companyId = formData.get("companyId");
  const file = formData.get("video");

  if (typeof companyId !== "string" || !companyId) {
    return NextResponse.json({ error: "企業を選択してください" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "動画ファイルを選択してください" }, { status: 400 });
  }

  const company = getCompanyById(companyId);
  if (!company) {
    return NextResponse.json({ error: "指定された企業が見つかりません" }, { status: 404 });
  }

  const meeting = createMeeting({
    companyId,
    videoFilename: file.name || "video",
    videoPath: "",
  });

  const { videoPath, videoFilename } = await saveUploadedVideo(companyId, meeting.id, file);
  updateMeetingVideo(meeting.id, { videoPath, videoFilename });

  await processMeeting(meeting.id, videoPath);

  return NextResponse.json({ meeting: getMeetingById(meeting.id) }, { status: 201 });
}
