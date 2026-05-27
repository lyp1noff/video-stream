"use client";

import { StreamPlayer } from "@/components/stream-player";
import { useState } from "react";

type StreamPageViewProps = {
  initialReady: boolean;
  streamPath: string;
  whepBaseUrl: string;
};

export function StreamPageView({ initialReady, streamPath, whepBaseUrl }: StreamPageViewProps) {
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div
        className={
          isTheaterMode
            ? "fixed inset-0 z-50 overflow-hidden bg-black"
            : "grid min-h-screen place-items-center p-3 md:p-4"
        }
      >
        <div
          className={
            isTheaterMode
              ? "h-full w-full bg-black"
              : "aspect-video w-full max-w-300 overflow-hidden rounded-lg border border-white/10 bg-black"
          }
        >
          <StreamPlayer
            initialReady={initialReady}
            isTheaterMode={isTheaterMode}
            onTheaterModeChange={setIsTheaterMode}
            streamPath={streamPath}
            whepBaseUrl={whepBaseUrl}
          />
        </div>
      </div>
    </main>
  );
}
