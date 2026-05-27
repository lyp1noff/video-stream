"use client";

import { StreamPlayer } from "@/components/stream-player";
import { useState } from "react";

type StreamPageViewProps = {
  streamPath: string;
  whepBaseUrl: string;
};

export function StreamPageView({ streamPath, whepBaseUrl }: StreamPageViewProps) {
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-50">
      <div
          className={
            isTheaterMode
              ? "fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black"
            : "grid min-h-screen min-w-0 place-items-center p-3 md:p-4"
        }
      >
        <div
          className={
            isTheaterMode
              ? "h-[min(100vh,calc(100vw*9/16))] w-[min(100vw,calc(100vh*16/9))] bg-black"
              : "aspect-video w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-black md:max-w-300"
          }
        >
          <StreamPlayer
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
