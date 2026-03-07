"use client";

import { useState } from "react";

import { InstallModal } from "@/components/marketplace/install-modal";

export function TemplateActions({ slug }: { slug: string }): JSX.Element {
  const [demoState, setDemoState] = useState<{ loading: boolean; output?: string; error?: string }>({
    loading: false,
  });
  const [reviewState, setReviewState] = useState<{ loading: boolean; message?: string; error?: string }>({
    loading: false,
  });
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  async function runDemo() {
    setDemoState({ loading: true });
    const response = await fetch(`/api/marketplace/templates/${slug}/demo-run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const payload = (await response.json().catch(() => null)) as
      | { summary?: string; status?: string; error?: { message?: string } }
      | null;

    if (!response.ok) {
      setDemoState({
        loading: false,
        error: payload?.error?.message ?? "Demo run failed",
      });
      return;
    }

    setDemoState({
      loading: false,
      output: payload?.summary ?? payload?.status ?? "Demo run completed",
    });
  }

  async function submitReview() {
    setReviewState({ loading: true });
    const response = await fetch(`/api/marketplace/templates/${slug}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rating: Number(rating),
        comment: comment.trim() || undefined,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (!response.ok) {
      setReviewState({
        loading: false,
        error: payload?.error?.message ?? "Review failed",
      });
      return;
    }

    setReviewState({ loading: false, message: "Review submitted" });
    setComment("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={runDemo}
          disabled={demoState.loading}
          className="inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white"
        >
          {demoState.loading ? "Running..." : "Run Live Demo"}
        </button>
        <InstallModal slug={slug} />
      </div>
      {demoState.output ? <p className="text-sm text-emerald-700">{demoState.output}</p> : null}
      {demoState.error ? <p className="text-sm text-rose-700">{demoState.error}</p> : null}

      <div className="grid gap-2 md:grid-cols-[120px,1fr,120px]">
        <input
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        />
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          placeholder="Write review"
        />
        <button
          type="button"
          onClick={submitReview}
          disabled={reviewState.loading}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700"
        >
          {reviewState.loading ? "Saving..." : "Submit"}
        </button>
      </div>
      {reviewState.message ? <p className="text-sm text-emerald-700">{reviewState.message}</p> : null}
      {reviewState.error ? <p className="text-sm text-rose-700">{reviewState.error}</p> : null}
    </div>
  );
}
