import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { Company, Meeting, MeetingStatus } from "./types";

type CompanyRow = {
  id: string;
  name: string;
  created_at: string;
};

type MeetingRow = {
  id: string;
  company_id: string;
  video_filename: string;
  video_path: string;
  status: string;
  transcript: string | null;
  decided_items: string | null;
  action_items: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

function toCompany(row: CompanyRow): Company {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

function toMeeting(row: MeetingRow): Meeting {
  return {
    id: row.id,
    companyId: row.company_id,
    videoFilename: row.video_filename,
    videoPath: row.video_path,
    status: row.status as MeetingStatus,
    transcript: row.transcript,
    decidedItems: row.decided_items ? JSON.parse(row.decided_items) : null,
    actionItems: row.action_items ? JSON.parse(row.action_items) : null,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listCompanies(): Company[] {
  const rows = db
    .prepare("SELECT * FROM companies ORDER BY name COLLATE NOCASE ASC")
    .all() as unknown as CompanyRow[];
  return rows.map(toCompany);
}

export function getCompanyById(id: string): Company | null {
  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as
    | CompanyRow
    | undefined;
  return row ? toCompany(row) : null;
}

export function createCompany(name: string): Company {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("会社名を入力してください");
  }
  const existing = db
    .prepare("SELECT * FROM companies WHERE name = ?")
    .get(trimmed) as CompanyRow | undefined;
  if (existing) {
    throw new Error("同じ名前の企業が既に登録されています");
  }
  const id = randomUUID();
  db.prepare("INSERT INTO companies (id, name) VALUES (?, ?)").run(id, trimmed);
  return getCompanyById(id)!;
}

export function deleteCompany(id: string): void {
  db.prepare("DELETE FROM meetings WHERE company_id = ?").run(id);
  db.prepare("DELETE FROM companies WHERE id = ?").run(id);
}

export function listMeetingsByCompany(companyId: string): Meeting[] {
  const rows = db
    .prepare("SELECT * FROM meetings WHERE company_id = ? ORDER BY created_at DESC")
    .all(companyId) as unknown as MeetingRow[];
  return rows.map(toMeeting);
}

export function getMeetingById(id: string): Meeting | null {
  const row = db.prepare("SELECT * FROM meetings WHERE id = ?").get(id) as
    | MeetingRow
    | undefined;
  return row ? toMeeting(row) : null;
}

export function createMeeting(params: {
  companyId: string;
  videoFilename: string;
  videoPath: string;
}): Meeting {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO meetings (id, company_id, video_filename, video_path, status)
     VALUES (?, ?, ?, ?, 'processing')`
  ).run(id, params.companyId, params.videoFilename, params.videoPath);
  return getMeetingById(id)!;
}

export function updateMeetingVideo(
  id: string,
  video: { videoPath: string; videoFilename: string }
): void {
  db.prepare("UPDATE meetings SET video_path = ?, video_filename = ? WHERE id = ?").run(
    video.videoPath,
    video.videoFilename,
    id
  );
}

export function updateMeetingResult(
  id: string,
  result:
    | {
        status: "done";
        transcript: string;
        decidedItems: string[];
        actionItems: string[];
      }
    | { status: "error"; errorMessage: string }
): void {
  if (result.status === "done") {
    db.prepare(
      `UPDATE meetings
       SET status = 'done', transcript = ?, decided_items = ?, action_items = ?,
           error_message = NULL, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      result.transcript,
      JSON.stringify(result.decidedItems),
      JSON.stringify(result.actionItems),
      id
    );
  } else {
    db.prepare(
      `UPDATE meetings
       SET status = 'error', error_message = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(result.errorMessage, id);
  }
}
