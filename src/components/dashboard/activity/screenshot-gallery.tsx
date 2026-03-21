"use client";

import { useEffect, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

type Screenshot = {
  screenshotId: string;
  mimeType: string;
  base64Data: string;
};

function ScreenshotModal({ screenshot, onClose, onPrev, onNext, index, total }: {
  screenshot: Screenshot;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  index: number;
  total: number;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">Screenshot {index + 1} of {total}</span>
            <span className="font-mono text-xs text-slate-600">{screenshot.screenshotId.slice(-8)}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Image */}
        <div className="relative overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:${screenshot.mimeType};base64,${screenshot.base64Data}`}
            alt={`Screenshot ${index + 1}`}
            className="max-h-[80vh] w-full object-contain"
          />
        </div>
        {/* Nav buttons */}
        {total > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-600/60 bg-slate-800/90 p-2 text-slate-300 backdrop-blur-sm transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-600/60 bg-slate-800/90 p-2 text-slate-300 backdrop-blur-sm transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type ScreenshotGalleryProps = {
  executionId: string;
};

export function ScreenshotGallery({ executionId }: ScreenshotGalleryProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/internal/executions/${executionId}/screenshots`)
      .then((r) => r.json())
      .then((data: { screenshots: Screenshot[] }) => {
        setScreenshots(data.screenshots ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [executionId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Camera className="h-4 w-4 animate-pulse" />
        Loading screenshots...
      </div>
    );
  }

  if (screenshots.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-700/60 p-6 text-center">
        <Camera className="mx-auto h-5 w-5 text-slate-600" />
        <p className="text-sm text-slate-500">No screenshots captured for this execution.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Agent Screenshots</span>
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-400">
            {screenshots.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {screenshots.map((s, i) => (
            <button
              key={s.screenshotId}
              onClick={() => setActiveIndex(i)}
              className="group relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40 transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${s.mimeType};base64,${s.base64Data}`}
                alt={`Screenshot ${i + 1}`}
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition-colors group-hover:bg-slate-950/40">
                <Maximize2 className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 to-transparent p-2">
                <p className="text-xs text-slate-400">Step {i + 1}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeIndex !== null && (
        <ScreenshotModal
          screenshot={screenshots[activeIndex]!}
          index={activeIndex}
          total={screenshots.length}
          onClose={() => setActiveIndex(null)}
          onPrev={() => setActiveIndex((prev) => (prev! - 1 + screenshots.length) % screenshots.length)}
          onNext={() => setActiveIndex((prev) => (prev! + 1) % screenshots.length)}
        />
      )}
    </>
  );
}
