import { google, type sheets_v4 } from "googleapis";
import { getSheetsConfig, type SheetsConfig } from "./services/integration-service";

export interface HoursRow {
  memberName: string;
  email?: string;
  hours: number;
  source: string; // e.g. "Event: Spring Concert"
  date: Date;
  recordedBy?: string; // officer who credited the hours
}

export interface RosterRow {
  name: string;
  email: string;
  gradYear: string; // "" when unknown
  hoursCompleted: number;
  remaining: number;
  events: string; // semicolon-joined list of sources
}

export interface SheetWriteResult {
  ok: boolean;
  error?: string;
  count: number;
}

const ROSTER_HEADER = [
  "Member",
  "Email",
  "Grad year",
  "Hours completed",
  "Hours remaining",
  "Events participated in",
];

let warned = false;

function client(config: SheetsConfig): sheets_v4.Sheets {
  const auth = new google.auth.JWT({
    email: config.serviceEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/** Creates any of the given tabs that don't already exist in the spreadsheet. */
async function ensureTabsExist(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tabs: string[],
): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set(
    (meta.data.sheets ?? []).map((s) => s.properties?.title).filter(Boolean) as string[],
  );
  const missing = [...new Set(tabs)].filter((t) => !existing.has(t));
  if (missing.length === 0) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    },
  });
}

function notConfigured(): void {
  if (!warned) {
    console.warn("[sheets] Google Sheets not configured — hours backup is a no-op.");
    warned = true;
  }
}

/**
 * Appends credited-hours rows to the configured Google Sheet's Log tab. No-ops
 * (with one log line) when Sheets isn't configured, and never throws into the
 * caller. Reads config from the DB (officer-editable) with env fallback.
 */
export async function appendHoursRows(rows: HoursRow[]): Promise<void> {
  if (rows.length === 0) return;
  const config = await getSheetsConfig();
  if (!config) {
    notConfigured();
    return;
  }

  try {
    const sheets = client(config);
    await ensureTabsExist(sheets, config.spreadsheetId, [config.logTab]);
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: `${config.logTab}!A:F`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows.map((r) => [
          r.memberName,
          r.email ?? "",
          r.hours,
          r.source,
          r.date.toISOString().slice(0, 10),
          r.recordedBy ?? "",
        ]),
      },
    });
  } catch (err) {
    console.error("[sheets] append failed:", err);
  }
}

/**
 * Overwrites the Roster tab with a fresh snapshot: a header row plus one row per
 * member. This keeps the sheet a true live mirror regardless of what changed.
 * Returns a result so callers (e.g. the config-save verify path) can surface
 * success or failure; never throws.
 */
export async function syncRosterSheet(rows: RosterRow[]): Promise<SheetWriteResult> {
  const config = await getSheetsConfig();
  if (!config) {
    notConfigured();
    return { ok: false, error: "Google Sheets is not configured.", count: 0 };
  }

  try {
    const sheets = client(config);
    await ensureTabsExist(sheets, config.spreadsheetId, [config.rosterTab]);
    await sheets.spreadsheets.values.clear({
      spreadsheetId: config.spreadsheetId,
      range: `${config.rosterTab}!A:F`,
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range: `${config.rosterTab}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ROSTER_HEADER,
          ...rows.map((r) => [
            r.name,
            r.email,
            r.gradYear,
            r.hoursCompleted,
            r.remaining,
            r.events,
          ]),
        ],
      },
    });
    return { ok: true, count: rows.length };
  } catch (err) {
    console.error("[sheets] roster sync failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err), count: 0 };
  }
}
