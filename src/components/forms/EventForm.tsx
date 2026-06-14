import { SubmitButton } from "@/components/SubmitButton";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const label = "mb-1 block text-sm font-medium text-gray-700";

/** Shared event fields for both officer-create and member-request forms. */
export function EventFormFields({ submitLabel }: { submitLabel: string }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className={label}>
          Title
        </label>
        <input id="title" name="title" required className={field} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className={label}>
            Date
          </label>
          <input id="date" name="date" type="date" required className={field} />
        </div>
        <div>
          <label htmlFor="hoursValue" className={label}>
            Hours
          </label>
          <input
            id="hoursValue"
            name="hoursValue"
            type="number"
            step="0.5"
            min="0.5"
            defaultValue="1"
            required
            className={field}
          />
        </div>
      </div>
      <div>
        <label htmlFor="location" className={label}>
          Location
        </label>
        <input id="location" name="location" className={field} />
      </div>
      <div>
        <label htmlFor="description" className={label}>
          Description
        </label>
        <textarea id="description" name="description" rows={3} className={field} />
      </div>
      <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
    </div>
  );
}
