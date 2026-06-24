"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChallengeType } from "../lib/market-challenges";

// "New Challenge" button + modal form for the manager dashboard. Collects the
// challenge fields, blocks submit until the required fields are filled, POSTs to
// /api/challenges, and refreshes the page so the new card appears immediately.
export function NewChallengeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition duration-150 ease-standard hover:opacity-90 active:bg-primary-dim"
      >
        New Challenge
      </button>
      {open ? <ChallengeModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ChallengeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChallengeType>("DINES");
  const [threshold, setThreshold] = useState("");
  const [flyReward, setFlyReward] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const valid =
    title.trim() !== "" &&
    description.trim() !== "" &&
    threshold.trim() !== "" &&
    Number(threshold) > 0 &&
    flyReward.trim() !== "" &&
    Number(flyReward) > 0 &&
    startTime !== "" &&
    endTime !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          threshold: Number(threshold),
          flyReward: Number(flyReward),
          startTime,
          endTime,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Couldn't create the challenge.");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const fieldClass =
    "w-full rounded-2xl bg-surface-low py-3 px-4 text-sm text-foreground placeholder:text-muted outline-none focus:ring-1 focus:ring-primary";
  const labelClass =
    "mb-1.5 block text-xs uppercase tracking-[0.12em] text-muted";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-surface p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">New Challenge</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dine 3 Tuesdays"
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Check in 3 Tuesdays this month, earn $FLY."
              required
              rows={3}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ChallengeType)}
              className={fieldClass}
            >
              <option value="DINES">DINES</option>
              <option value="PAYMENT">PAYMENT</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Threshold</label>
            <input
              type="number"
              min={1}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="3"
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>$FLY Reward</label>
            <input
              type="number"
              min={0}
              step="any"
              value={flyReward}
              onChange={(e) => setFlyReward(e.target.value)}
              placeholder="50"
              required
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-failure/40 px-4 py-3 text-sm text-failure">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!valid || isPending}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Creating…" : "Create challenge"}
          </button>
        </form>
      </div>
    </div>
  );
}
