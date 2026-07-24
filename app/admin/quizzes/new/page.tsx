"use client";

import { useActionState, useRef, useState } from "react";
import {
  previewAikenAction,
  createQuizAction,
  type PreviewState,
  type CreateQuizState,
} from "./actions";

const previewInitial: PreviewState = {};
const createInitial: CreateQuizState = {};

export default function NewQuizPage() {
  const [aikenText, setAikenText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewState, previewFormAction, previewPending] = useActionState(
    previewAikenAction,
    previewInitial
  );
  const [createState, createFormAction, createPending] = useActionState(
    createQuizAction,
    createInitial
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setAikenText(text);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">New quiz</h1>

      <form className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Title
          <input
            name="title"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Description (optional)
          <textarea
            name="description"
            rows={2}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Opens at
            <input
              name="opensAt"
              type="datetime-local"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-base"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Closes at
            <input
              name="closesAt"
              type="datetime-local"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-base"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Duration (minutes)
          <input
            name="durationMinutes"
            type="number"
            min={1}
            required
            defaultValue={30}
            className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Aiken-format questions
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="text-sm"
          />
          <textarea
            name="aikenText"
            rows={12}
            value={aikenText}
            onChange={(e) => setAikenText(e.target.value)}
            placeholder={`What is the capital of France?\nA) London\nB) Paris\nC) Berlin\nANSWER: B`}
            className="mt-1 rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm"
          />
        </label>

        {previewState.error && (
          <p className="text-sm text-red-600">{previewState.error}</p>
        )}
        {createState.error && (
          <p className="text-sm text-red-600">{createState.error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            formAction={previewFormAction}
            disabled={previewPending}
            className="rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
          >
            {previewPending ? "Parsing…" : "Preview questions"}
          </button>
          {previewState.questions && (
            <button
              type="submit"
              formAction={createFormAction}
              disabled={createPending}
              className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {createPending ? "Creating…" : "Create quiz"}
            </button>
          )}
        </div>
      </form>

      {previewState.questions && (
        <div className="mt-8">
          <h2 className="font-medium text-zinc-900">
            Preview — {previewState.questions.length} question
            {previewState.questions.length === 1 ? "" : "s"}
          </h2>
          <ol className="mt-3 flex flex-col gap-3">
            {previewState.questions.slice(0, 5).map((q, i) => (
              <li
                key={i}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <p className="font-medium text-zinc-900">{q.text}</p>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-600">
                  {q.options.map((o) => (
                    <li key={o.label}>
                      {o.label}) {o.text}
                      {o.label === q.correctLabel && (
                        <span className="ml-2 text-emerald-600">
                          (correct)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {previewState.questions.length > 5 && (
              <li className="text-sm text-zinc-500">
                …and {previewState.questions.length - 5} more
              </li>
            )}
          </ol>
        </div>
      )}
    </main>
  );
}
