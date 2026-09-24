"use client";

import { useState } from "react";

export interface PickerSignup {
  id: number;
  name: string;
  status: string; // "confirmed" | "waitlisted"
}

export interface PickerSlot {
  id: number;
  label: string;
  signups: PickerSignup[];
}

const quickBtn =
  "cursor-pointer rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50";

/**
 * Checkbox list of an event's signups grouped by timeslot. Checked rows submit
 * as repeated `signupId` fields, which the server action reads with getAll().
 */
export function RecipientPicker({ slots }: { slots: PickerSlot[] }) {
  const all = slots.flatMap((s) => s.signups);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(all.map((s) => s.id)),
  );

  const selectWhere = (pred: (s: PickerSignup) => boolean) =>
    setSelected(new Set(all.filter(pred).map((s) => s.id)));
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const setSlot = (slot: PickerSlot, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of slot.signups) {
        if (on) next.add(s.id);
        else next.delete(s.id);
      }
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-gray-600">
          {selected.size} of {all.length} selected
        </span>
        <button type="button" className={quickBtn} onClick={() => selectWhere(() => true)}>
          All
        </button>
        <button type="button" className={quickBtn} onClick={() => selectWhere(() => false)}>
          None
        </button>
        <button
          type="button"
          className={quickBtn}
          onClick={() => selectWhere((s) => s.status === "confirmed")}
        >
          Confirmed only
        </button>
        <button
          type="button"
          className={quickBtn}
          onClick={() => selectWhere((s) => s.status === "waitlisted")}
        >
          Waitlist only
        </button>
      </div>

      <ul className="space-y-3">
        {slots.map((slot) => {
          const slotSelected = slot.signups.filter((s) => selected.has(s.id)).length;
          return (
            <li key={slot.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-700">{slot.label}</p>
                {slot.signups.length > 0 && (
                  <button
                    type="button"
                    className="cursor-pointer text-xs font-medium text-indigo-700 hover:underline"
                    onClick={() => setSlot(slot, slotSelected < slot.signups.length)}
                  >
                    {slotSelected < slot.signups.length ? "Select all" : "Clear"}
                  </button>
                )}
              </div>
              {slot.signups.length === 0 ? (
                <p className="text-xs text-gray-400">No signups</p>
              ) : (
                <ul className="space-y-1">
                  {slot.signups.map((s) => (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          name="signupId"
                          value={s.id}
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                        />
                        <span>{s.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            s.status === "confirmed"
                              ? "bg-green-50 text-green-800"
                              : "bg-yellow-50 text-yellow-800"
                          }`}
                        >
                          {s.status === "confirmed" ? "confirmed" : "waitlist"}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
