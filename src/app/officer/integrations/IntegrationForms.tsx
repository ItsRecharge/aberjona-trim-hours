"use client";

import { useActionState } from "react";
import {
  updateMailAction,
  updateSheetsAction,
  type IntegrationFormState,
} from "@/actions/integrations";
import { SubmitButton } from "@/components/SubmitButton";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const label = "mb-1 block text-sm font-medium text-gray-700";

function Feedback({ state }: { state: IntegrationFormState }) {
  if (state.error)
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
        {state.error}
      </div>
    );
  if (state.success)
    return (
      <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
        {state.success}
      </div>
    );
  return null;
}

function StatusPill({ configured }: { configured: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        configured ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
      }`}
    >
      {configured ? "Configured" : "Not set"}
    </span>
  );
}

export function MailForm({
  gmailUser,
  configured,
}: {
  gmailUser: string;
  configured: boolean;
}) {
  const [state, action] = useActionState<IntegrationFormState, FormData>(
    updateMailAction,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Email (Gmail)</h2>
        <StatusPill configured={configured} />
      </div>
      <Feedback state={state} />
      <div>
        <label htmlFor="gmailUser" className={label}>
          Gmail address
        </label>
        <input
          id="gmailUser"
          name="gmailUser"
          type="email"
          defaultValue={gmailUser}
          required
          className={field}
        />
      </div>
      <div>
        <label htmlFor="gmailAppPassword" className={label}>
          App password
        </label>
        <input
          id="gmailAppPassword"
          name="gmailAppPassword"
          type="password"
          placeholder={configured ? "•••••••• (stored — enter to replace)" : ""}
          required
          className={field}
        />
        <p className="mt-1 text-xs text-gray-500">
          From Google Account → Security → App passwords (needs 2-Step Verification).
        </p>
      </div>
      <div>
        <label htmlFor="password" className={label}>
          Confirm with your password
        </label>
        <input id="password" name="password" type="password" required className={field} />
      </div>
      <SubmitButton pendingText="Saving…">Save Email Settings</SubmitButton>
    </form>
  );
}

export function SheetsForm({
  spreadsheetId,
  serviceEmail,
  configured,
}: {
  spreadsheetId: string;
  serviceEmail: string;
  configured: boolean;
}) {
  const [state, action] = useActionState<IntegrationFormState, FormData>(
    updateSheetsAction,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Google Sheets backup</h2>
        <StatusPill configured={configured} />
      </div>
      <Feedback state={state} />
      <div>
        <label htmlFor="sheetsSpreadsheetId" className={label}>
          Spreadsheet ID
        </label>
        <input
          id="sheetsSpreadsheetId"
          name="sheetsSpreadsheetId"
          defaultValue={spreadsheetId}
          required
          className={field}
        />
      </div>
      <div>
        <label htmlFor="sheetsServiceEmail" className={label}>
          Service-account email
        </label>
        <input
          id="sheetsServiceEmail"
          name="sheetsServiceEmail"
          type="email"
          defaultValue={serviceEmail}
          required
          className={field}
        />
        <p className="mt-1 text-xs text-gray-500">
          Share the spreadsheet with this address (Editor).
        </p>
      </div>
      <div>
        <label htmlFor="sheetsPrivateKey" className={label}>
          Service-account private key
        </label>
        <textarea
          id="sheetsPrivateKey"
          name="sheetsPrivateKey"
          rows={3}
          placeholder={
            configured
              ? "•••••••• (stored — paste to replace)"
              : "-----BEGIN PRIVATE KEY----- … or base64"
          }
          required
          className={field}
        />
      </div>
      <div>
        <label htmlFor="sheetsPassword" className={label}>
          Confirm with your password
        </label>
        <input
          id="sheetsPassword"
          name="password"
          type="password"
          required
          className={field}
        />
      </div>
      <SubmitButton pendingText="Saving…">Save Sheets Settings</SubmitButton>
    </form>
  );
}
