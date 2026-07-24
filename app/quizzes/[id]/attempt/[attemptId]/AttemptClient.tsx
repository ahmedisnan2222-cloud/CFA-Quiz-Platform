"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAttemptAction } from "./actions";
import type { ParsedOption } from "@/lib/aiken";

type Confidence = "LOW" | "MEDIUM" | "HIGH";

type Question = {
  id: string;
  text: string;
  options: ParsedOption[];
};

type Answer = { selectedLabel?: string; confidence?: Confidence };

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function AttemptClient({
  quizId,
  attemptId,
  quizTitle,
  deadlineIso,
  questions,
}: {
  quizId: string;
  attemptId: string;
  quizTitle: string;
  deadlineIso: string;
  questions: Question[];
}) {
  const router = useRouter();
  const deadline = useMemo(() => new Date(deadlineIso).getTime(), [deadlineIso]);
  const [remaining, setRemaining] = useState(() => deadline - Date.now());
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const doSubmit = useMemo(
    () => async () => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);

      const payload = questions
        .filter((q) => answers[q.id]?.selectedLabel && answers[q.id]?.confidence)
        .map((q) => ({
          questionId: q.id,
          selectedLabel: answers[q.id].selectedLabel,
          confidence: answers[q.id].confidence,
        }));

      try {
        const { resultsUrl } = await submitAttemptAction(
          quizId,
          attemptId,
          JSON.stringify(payload)
        );
        router.push(resultsUrl);
      } catch (err) {
        submittedRef.current = false;
        setSubmitting(false);
        setError(err instanceof Error ? err.message : "Failed to submit");
      }
    },
    [answers, attemptId, quizId, questions, router]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const next = deadline - Date.now();
      setRemaining(next);
      if (next <= 0) {
        clearInterval(interval);
        doSubmit();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, doSubmit]);

  const allAnswered = questions.every(
    (q) => answers[q.id]?.selectedLabel && answers[q.id]?.confidence
  );

  function setSelected(questionId: string, label: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedLabel: label },
    }));
  }

  function setConfidence(questionId: string, confidence: Confidence) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], confidence },
    }));
  }

  const isLow = remaining < 60_000;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="sticky top-0 z-10 -mx-6 mb-6 bg-zinc-50/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">{quizTitle}</h1>
          <span
            className={`rounded-md px-3 py-1.5 font-mono text-sm font-medium ${
              isLow ? "bg-red-100 text-red-700" : "bg-zinc-200 text-zinc-800"
            }`}
          >
            {formatRemaining(remaining)}
          </span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSubmit();
        }}
        className="flex flex-col gap-6"
      >
        {questions.map((q, index) => (
          <fieldset
            key={q.id}
            className="rounded-lg border border-zinc-200 bg-white p-5"
          >
            <legend className="px-1 text-sm font-medium text-zinc-500">
              Question {index + 1} of {questions.length}
            </legend>
            <p className="mt-1 font-medium text-zinc-900">{q.text}</p>

            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((opt) => (
                <label
                  key={opt.label}
                  className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
                >
                  <input
                    type="radio"
                    name={`answer-${q.id}`}
                    value={opt.label}
                    checked={answers[q.id]?.selectedLabel === opt.label}
                    onChange={() => setSelected(q.id, opt.label)}
                    required
                  />
                  <span>
                    {opt.label}) {opt.text}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Confidence
              </p>
              <div className="mt-2 flex gap-2">
                {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfidence(q.id, level)}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                      answers[q.id]?.confidence === level
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {level[0] + level.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!allAnswered || submitting}
          className="rounded-md bg-zinc-900 px-4 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {submitting
            ? "Submitting…"
            : allAnswered
              ? "Submit quiz"
              : "Answer every question to submit"}
        </button>
      </form>
    </main>
  );
}
