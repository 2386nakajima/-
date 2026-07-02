import { updateMeetingResult } from "./repository";
import { transcribeVideo } from "./ai/transcribe";
import { summarizeTranscript } from "./ai/summarize";

export async function processMeeting(meetingId: string, videoPath: string): Promise<void> {
  try {
    const transcript = await transcribeVideo(videoPath);
    const { decidedItems, actionItems } = await summarizeTranscript(transcript);
    updateMeetingResult(meetingId, {
      status: "done",
      transcript,
      decidedItems,
      actionItems,
    });
  } catch (error) {
    updateMeetingResult(meetingId, {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "処理中に不明なエラーが発生しました",
    });
  }
}
