"use client";

import { StreamPlayer } from "@/components/stream-player";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./stream-page-view.module.css";

type StreamPageViewProps = {
  streamPath: string;
  whepBaseUrl: string;
};

export function StreamPageView({ streamPath, whepBaseUrl }: StreamPageViewProps) {
  const searchParams = useSearchParams();
  const autoPlay = getBooleanParam(searchParams, "autoplay", true);
  const controls = getBooleanParam(searchParams, "controls", true);
  const muted = getBooleanParam(searchParams, "muted", true);
  const full = searchParams.has("fullscreen")
    ? getBooleanParam(searchParams, "fullscreen", true)
    : getBooleanParam(searchParams, "full", false);
  const [isTheaterMode, setIsTheaterMode] = useState(full);

  useEffect(() => {
    setIsTheaterMode(full);
  }, [full]);

  return (
    <main className={styles.page} data-theater-mode={isTheaterMode}>
      <div className={styles.stage}>
        <div className={styles.frame}>
          <StreamPlayer
            autoPlay={autoPlay}
            controls={controls}
            isTheaterMode={isTheaterMode}
            muted={muted}
            onTheaterModeChange={setIsTheaterMode}
            streamPath={streamPath}
            whepBaseUrl={whepBaseUrl}
          />
        </div>
      </div>
    </main>
  );
}

function getBooleanParam(
  searchParams: URLSearchParams,
  name: string,
  fallback: boolean,
) {
  if (!searchParams.has(name)) {
    return fallback;
  }

  const value = searchParams.get(name)?.trim().toLowerCase();

  if (value === "" || value === "true" || value === "1" || value === "yes" || value === "on") {
    return true;
  }

  if (value === "false" || value === "0" || value === "no" || value === "off") {
    return false;
  }

  return fallback;
}
