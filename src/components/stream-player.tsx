"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type StreamPlayerProps = {
  initialReady: boolean;
  whepUrl: string;
};

type PlayerState = "loading" | "playing" | "error";

export function StreamPlayer({ initialReady, whepUrl }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<MediaMTXWebRTCReader | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [isReady, setIsReady] = useState(initialReady);
  const [playerState, setPlayerState] = useState<PlayerState>(initialReady ? "loading" : "error");

  useEffect(() => {
    let cancelled = false;

    async function refreshStatus() {
      try {
        const response = await fetch("/api/stream-status", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { ready?: boolean };

        if (!cancelled) {
          setIsReady(Boolean(payload.ready));
        }
      } catch {
        return;
      }
    }

    void refreshStatus();
    const intervalId = window.setInterval(refreshStatus, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !videoRef.current || !isReady) {
      if (!isReady) {
        setPlayerState("error");
      }
      return;
    }

    setPlayerState("loading");

    const reader = new MediaMTXWebRTCReader({
      url: toAbsoluteUrl(whepUrl),
      onError: (error) => {
        setPlayerState("error");
        console.error(error);
      },
      onTrack: (event) => {
        if (!videoRef.current) {
          return;
        }

        videoRef.current.srcObject = event.streams[0];
        setPlayerState("playing");
      },
    });

    readerRef.current = reader;

    return () => {
      reader.close();
      readerRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isReady, scriptReady, whepUrl]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.setAttribute("x-webkit-airplay", "allow");
    video.setAttribute("webkit-playsinline", "true");
    video.disableRemotePlayback = false;
  }, [isReady]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      );
    }

    function toggleMute() {
      if (!videoRef.current) {
        return;
      }

      videoRef.current.muted = !videoRef.current.muted;
    }

    function toggleFullscreen() {
      const element = videoRef.current?.parentElement;

      if (!element) {
        return;
      }

      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
        return;
      }

      if (element.requestFullscreen) {
        void element.requestFullscreen().catch(() => {});
        return;
      }

      (
        element as HTMLDivElement & {
          webkitRequestFullscreen?: () => void;
        }
      ).webkitRequestFullscreen?.();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.code === "KeyM") {
        event.preventDefault();
        toggleMute();
        return;
      }

      if (event.code === "KeyF") {
        event.preventDefault();
        toggleFullscreen();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <>
      <Script
        src="/vendor/mediamtx-reader.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div className={`player-card player-card-${playerState}`}>
        {isReady ? (
          <video
            ref={videoRef}
            className="video-element"
            controls
            muted
            autoPlay
            playsInline
          />
        ) : (
          <div className="banner-state" aria-live="polite">
            <img alt="" className="banner-image" src="/banner.png" />
          </div>
        )}
      </div>
    </>
  );
}

function toAbsoluteUrl(url: string) {
  if (typeof window === "undefined") {
    return url;
  }

  return new URL(url, window.location.origin).toString();
}
