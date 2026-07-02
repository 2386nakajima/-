export type MeetingStatus = "processing" | "done" | "error";

export type Company = {
  id: string;
  name: string;
  createdAt: string;
};

export type Meeting = {
  id: string;
  companyId: string;
  videoFilename: string;
  videoPath: string;
  status: MeetingStatus;
  transcript: string | null;
  decidedItems: string[] | null;
  actionItems: string[] | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};
