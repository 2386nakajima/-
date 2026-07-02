import { NextResponse } from "next/server";
import { getMeetingById } from "@/lib/repository";
import { processMeeting } from "@/lib/processMeeting";

export async function POST(_req: Request, ctx: RouteContext<"/api/meetings/[id]/retry">) {
  const { id } = await ctx.params;
  const meeting = getMeetingById(id);
  if (!meeting) {
    return NextResponse.json({ error: "会議記録が見つかりません" }, { status: 404 });
  }

  await processMeeting(meeting.id, meeting.videoPath);

  return NextResponse.json({ meeting: getMeetingById(id) });
}
