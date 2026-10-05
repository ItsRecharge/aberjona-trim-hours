"use client";

import { useEffect, useState } from "react";

/**
 * Mini-puzzles for the admin puzzle prank. Each picks its own random content
 * on mount (PuzzleGate only renders them client-side), so every visit differs.
 */
export type PuzzleProps = { onSolve: () => void };

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const button =
  "rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Text answer with a Check button and a "nope" shake on wrong answers. */
function AnswerForm({
  check,
  onSolve,
  placeholder,
  inputMode,
}: PuzzleProps & {
  check: (answer: string) => boolean;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (check(value)) onSolve();
        else {
          setWrong(true);
          setValue("");
        }
      }}
    >
      <input
        autoFocus
        value={value}
        inputMode={inputMode}
        placeholder={wrong ? "Nope, try again" : placeholder}
        onChange={(e) => setValue(e.target.value)}
        className={`${field} ${wrong ? "border-red-400" : ""}`}
        autoComplete="off"
      />
      <button type="submit" className={button}>
        Check
      </button>
    </form>
  );
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function MathPuzzle({ onSolve }: PuzzleProps) {
  const [[a, b, c]] = useState(() => [rand(12, 29), rand(3, 9), rand(10, 99)]);
  return (
    <div>
      <p className="text-gray-700">No calculators. Probably.</p>
      <p className="mt-3 text-center font-mono text-3xl font-bold text-gray-900">
        {a} × {b} + {c} = ?
      </p>
      <AnswerForm onSolve={onSolve} inputMode="numeric" check={(v) => Number(v) === a * b + c} />
    </div>
  );
}

const MUSIC_WORDS = [
  "FERMATA", "CRESCENDO", "TREBLE", "STACCATO", "ARPEGGIO", "METRONOME",
  "SYNCOPATION", "ALLEGRO", "TIMPANI", "CLARINET", "OBOE", "TROMBONE",
  "DIMINUENDO", "ACCIDENTAL", "GLISSANDO", "VIBRATO",
];

export function UnscramblePuzzle({ onSolve }: PuzzleProps) {
  const [[word, scrambled]] = useState(() => {
    const w = pick(MUSIC_WORDS);
    let s = w;
    while (s === w) s = shuffle(w.split("")).join("");
    return [w, s];
  });
  return (
    <div>
      <p className="text-gray-700">Unscramble this musical word:</p>
      <p className="mt-3 text-center font-mono text-3xl font-bold tracking-[0.3em] text-gray-900">
        {scrambled}
      </p>
      <AnswerForm onSolve={onSolve} check={(v) => norm(v) === word.toLowerCase()} />
    </div>
  );
}

const PHRASES = [
  "always count your rests",
  "practice makes perfect",
  "tune before you play",
  "watch the conductor",
  "breathe at the comma",
  "eyes up from the music",
];

export function BackwardsPuzzle({ onSolve }: PuzzleProps) {
  const [phrase] = useState(() => pick(PHRASES));
  const reversed = phrase.split("").reverse().join("");
  return (
    <div>
      <p className="text-gray-700">Type this phrase <strong>backwards</strong>, letter by letter:</p>
      <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-center font-mono text-lg text-gray-900 select-none">
        {phrase}
      </p>
      <AnswerForm onSolve={onSolve} check={(v) => norm(v) === reversed} />
    </div>
  );
}

const CATCHES_NEEDED = 5;

export function RunawayPuzzle({ onSolve }: PuzzleProps) {
  const [pos, setPos] = useState({ x: 40, y: 40 });
  const [caught, setCaught] = useState(0);
  const hop = () => setPos({ x: rand(0, 70), y: rand(0, 75) });
  return (
    <div>
      <p className="text-gray-700">
        Click the button {CATCHES_NEEDED} times. It&apos;s a little shy. ({caught}/{CATCHES_NEEDED})
      </p>
      <div className="relative mt-3 h-56 rounded-md border border-dashed border-gray-300 bg-gray-50">
        <button
          type="button"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          className={`${button} absolute transition-all duration-150`}
          onMouseEnter={() => {
            if (Math.random() < 0.7) hop();
          }}
          onClick={() => {
            const next = caught + 1;
            if (next >= CATCHES_NEEDED) onSolve();
            else {
              setCaught(next);
              hop();
            }
          }}
        >
          Click me
        </button>
      </div>
    </div>
  );
}

export function NumberGridPuzzle({ onSolve }: PuzzleProps) {
  const [cells, setCells] = useState(() => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const [next, setNext] = useState(1);
  return (
    <div>
      <p className="text-gray-700">Tap 1 through 9 in order. A wrong tap reshuffles.</p>
      <div className="mx-auto mt-3 grid w-56 grid-cols-3 gap-2">
        {cells.map((n) => (
          <button
            key={n}
            type="button"
            disabled={n < next}
            onClick={() => {
              if (n !== next) {
                setCells(shuffle(cells));
                setNext(1);
              } else if (n === 9) onSolve();
              else setNext(n + 1);
            }}
            className="h-16 rounded-md border border-gray-300 bg-white text-2xl font-bold text-gray-900 hover:bg-indigo-50 disabled:bg-green-100 disabled:text-green-700"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SliderPuzzle({ onSolve }: PuzzleProps) {
  const [target] = useState(() => rand(5, 95));
  const [value, setValue] = useState(50);
  const [hint, setHint] = useState<string | null>(null);
  return (
    <div>
      <p className="text-gray-700">
        Set the slider to exactly <strong>{target}</strong> (out of 100). No peeking at the number.
      </p>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="mt-5 w-full accent-indigo-600"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">{hint}</span>
        <button
          type="button"
          className={button}
          onClick={() => {
            if (value === target) onSolve();
            else setHint(value > target ? "Too high." : "Too low.");
          }}
        >
          Check
        </button>
      </div>
    </div>
  );
}

const NOTES = [
  { name: "Do", cls: "bg-red-500" },
  { name: "Re", cls: "bg-yellow-400" },
  { name: "Mi", cls: "bg-green-500" },
  { name: "Fa", cls: "bg-blue-500" },
];
const SEQUENCE_LENGTH = 5;

export function MemoryPuzzle({ onSolve }: PuzzleProps) {
  const newSequence = () => Array.from({ length: SEQUENCE_LENGTH }, () => rand(0, NOTES.length - 1));
  const [sequence, setSequence] = useState(newSequence);
  const [showing, setShowing] = useState(true);
  const [entered, setEntered] = useState<number[]>([]);

  useEffect(() => {
    if (!showing) return;
    const t = setTimeout(() => setShowing(false), 3000);
    return () => clearTimeout(t);
  }, [showing]);

  return (
    <div>
      <p className="text-gray-700">
        {showing ? "Memorize this sequence…" : "Now play it back. A mistake starts a new one."}
      </p>
      <div className="mt-3 flex h-12 justify-center gap-2">
        {showing
          ? sequence.map((n, i) => (
              <span
                key={i}
                className={`flex w-12 items-center justify-center rounded-md text-sm font-bold text-white ${NOTES[n].cls}`}
              >
                {NOTES[n].name}
              </span>
            ))
          : entered.map((n, i) => (
              <span key={i} className={`w-12 rounded-md ${NOTES[n].cls}`} />
            ))}
      </div>
      {!showing && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {NOTES.map((note, n) => (
            <button
              key={note.name}
              type="button"
              className={`h-14 rounded-md text-sm font-bold text-white ${note.cls}`}
              onClick={() => {
                if (sequence[entered.length] !== n) {
                  setSequence(newSequence());
                  setEntered([]);
                  setShowing(true);
                } else if (entered.length + 1 === SEQUENCE_LENGTH) onSolve();
                else setEntered([...entered, n]);
              }}
            >
              {note.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SENTENCES = [
  "Every good boy deserves fudge, especially after a long rehearsal.",
  "The tenor section sang seven sweet notes on Sunday evening.",
  "A sharp flat is technically a natural, which is still confusing.",
  "Remember to bring your reeds, your stand, and your enthusiasm.",
];

export function CountLettersPuzzle({ onSolve }: PuzzleProps) {
  const [[sentence, letter]] = useState(() => {
    const s = pick(SENTENCES);
    const counts = new Map<string, number>();
    for (const ch of s.toLowerCase().replace(/[^a-z]/g, "")) {
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    return [s, pick([...counts].filter(([, n]) => n >= 3).map(([ch]) => ch))];
  });
  const answer = sentence.toLowerCase().split("").filter((ch) => ch === letter).length;
  return (
    <div>
      <p className="text-gray-700">
        How many times does the letter <strong>&ldquo;{letter}&rdquo;</strong> appear (upper or lower case)?
      </p>
      <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-gray-900 select-none">{sentence}</p>
      <AnswerForm onSolve={onSolve} inputMode="numeric" check={(v) => Number(v) === answer} />
    </div>
  );
}

export const PUZZLES = [
  MathPuzzle,
  UnscramblePuzzle,
  BackwardsPuzzle,
  RunawayPuzzle,
  NumberGridPuzzle,
  SliderPuzzle,
  MemoryPuzzle,
  CountLettersPuzzle,
];
