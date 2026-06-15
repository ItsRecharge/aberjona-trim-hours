import { google } from "googleapis";
import { getSheetsConfig } from "./services/integration-service";

export interface HoursRow {
  memberName: string;
  hours: number;
  source: string; // e.g. "Event: Spring Concert"
  date: Date;
}

let warned = false;

/**
 * Appends credited-hours rows to the configured Google Sheet. No-ops (with one
 * log line) when Sheets isn't configured, and never throws into the caller.
 * Reads config from the DB (officer-editable) with env fallback.
 */
export async function appendHoursRows(rows: HoursRow[]): Promise<void> {
  if (rows.length === 0) return;
  const config = await getSheetsConfig();
  if (!config) {
    if (!warned) {
      console.warn("[sheets] Google Sheets not configured — hours backup is a no-op.");
      warned = true;
    }
    return;
  }

  try {
    const auth = new google.auth.JWT({
      email: config.serviceEmail,
      key: config.privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows.map((r) => [
          r.memberName,
          r.hours,
          r.source,
          r.date.toISOString().slice(0, 10),
        ]),
      },
    });
  } catch (err) {
    console.error("[sheets] append failed:", err);
  }
}
