"use server";

import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/current-user";
import {
  updateMailConfig,
  updateSheetsConfig,
} from "@/lib/services/integration-service";
import { recordAudit } from "@/lib/services/audit-service";

export interface IntegrationFormState {
  error?: string;
  success?: string;
}

async function verifyOfficerPassword(password: string) {
  const officer = await requireUser("officer");
  const ok = await bcrypt.compare(password, officer.passwordHash);
  return ok ? officer : null;
}

export async function updateMailAction(
  _prev: IntegrationFormState,
  formData: FormData,
): Promise<IntegrationFormState> {
  const officer = await verifyOfficerPassword(String(formData.get("password") ?? ""));
  if (!officer) return { error: "Incorrect password." };

  const user = String(formData.get("gmailUser") ?? "").trim();
  const appPassword = String(formData.get("gmailAppPassword") ?? "").trim();
  if (!user || !appPassword) {
    return { error: "Both the Gmail address and app password are required." };
  }

  await updateMailConfig({ user, appPassword });
  await recordAudit({
    actor: officer,
    action: "integration.email",
    summary: `Updated email (Gmail) config — ${user}`,
  });
  return { success: "Email settings saved." };
}

export async function updateSheetsAction(
  _prev: IntegrationFormState,
  formData: FormData,
): Promise<IntegrationFormState> {
  const officer = await verifyOfficerPassword(String(formData.get("password") ?? ""));
  if (!officer) return { error: "Incorrect password." };

  const spreadsheetId = String(formData.get("sheetsSpreadsheetId") ?? "").trim();
  const serviceEmail = String(formData.get("sheetsServiceEmail") ?? "").trim();
  const privateKey = String(formData.get("sheetsPrivateKey") ?? "").trim();
  if (!spreadsheetId || !serviceEmail || !privateKey) {
    return { error: "Spreadsheet ID, service-account email, and key are all required." };
  }

  await updateSheetsConfig({ spreadsheetId, serviceEmail, privateKey });
  await recordAudit({
    actor: officer,
    action: "integration.sheets",
    summary: `Updated Google Sheets backup config (${spreadsheetId})`,
  });
  return { success: "Google Sheets settings saved." };
}
