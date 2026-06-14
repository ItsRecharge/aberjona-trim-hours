import { google } from "googleapis";
import { getEnv, isSheetsConfigured } from "./env";

export interface HoursRow {
  memberName: string;
  hours: number;
  source: string; // e.g. "Event: Spring Concert"
  date: Date;
}

let warned = false;

function decodeKey(raw: string): string {
  // Accept either base64-encoded or raw (with literal \n) private keys.
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    if (decoded.includes("PRIVATE KEY")) return decoded;
  } catch {
    /* fall through */
  }
  return raw.replace(/\\n/g, "\n");
}

/**
 * Appends credited-hours rows to the configured Google Sheet. No-ops (with one
 * log line) when Sheets isn't configured, and never throws into the caller.
 */
export async function appendHoursRows(rows: HoursRow[]): Promise<void> {
  if (rows.length === 0) return;
  if (!isSheetsConfigured()) {
    if (!warned) {
      console.warn("[sheets] Google Sheets not configured — hours backup is a no-op.");
      warned = true;
    }
    return;
  }

  try {
    const env = getEnv();
    const auth = new google.auth.JWT({
      email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: decodeKey(env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
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
