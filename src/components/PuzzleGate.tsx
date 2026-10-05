"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { passPuzzleAction } from "@/actions/puzzle-prank";
import { PUZZLES } from "./Puzzles";

/**
 * Full-screen "security check" shown instead of the page while an admin has
 * pranked this user. A random puzzle is picked client-side (after mount, so
 * server and client renders match); solving it sets the pass cookie and the
 * page the user asked for renders on refresh.
 */
export function PuzzleGate() {
  const router = useRouter();
  const [index, setIndex] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [solved, setSolved] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setIndex(Math.floor(Math.random() * PUZZLES.length));
  }, []);

  const reroll = () => {
    setIndex((i) => {
      let next = i;
      while (next === i) next = Math.floor(Math.random() * PUZZLES.length);
      return next;
    });
    setRound((r) => r + 1);
  };

  const onSolve = () => {
    setSolved(true);
    startTransition(async () => {
      await passPuzzleAction();
      router.refresh();
    });
  };

  const Puzzle = index === null ? null : PUZZLES[index];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-700 to-[#1d2d35] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">
          Tri-M Hours Log
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Security check 🎵</h1>
        <p className="mb-4 text-sm text-gray-500">
          Prove you&apos;re a real musician to continue.
        </p>

        {solved ? (
          <p className="py-8 text-center text-lg font-semibold text-green-700">
            Verified. Welcome back! 🎉
          </p>
        ) : Puzzle ? (
          <>
            <Puzzle key={round} onSolve={onSolve} />
            <button
              type="button"
              onClick={reroll}
              className="mt-5 text-xs text-gray-400 hover:text-gray-600 hover:underline"
            >
              Too hard? Try a different puzzle
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
