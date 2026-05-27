"use client";

import {
  MediaPlayer,
  MediaProvider,
  useMediaRemote,
  type MediaPlayerInstance,
  type PlayerSrc,
} from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type StreamPlayerProps = {
  initialReady: boolean;
  isTheaterMode: boolean;
  onTheaterModeChange: (isTheaterMode: boolean) => void;
  streamPath: string;
  whepBaseUrl: string;
};

export function StreamPlayer({
  initialReady,
  isTheaterMode,
  onTheaterModeChange,
  streamPath,
  whepBaseUrl,
}: StreamPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const remote = useMediaRemote(playerRef);
  const [mounted, setMounted] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [isReady, setIsReady] = useState(initialReady);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const playerSrc: PlayerSrc | undefined = mediaStream
    ? { src: mediaStream, type: "video/object" }
    : undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshStatus() {
      try {
        const response = await fetch(`/api/stream-status?path=${encodeURIComponent(streamPath)}`, {
          cache: "no-store",
        });

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
  }, [streamPath]);

  useEffect(() => {
    if (!mounted || !scriptReady || !isReady) {
      if (!isReady) {
        setMediaStream(null);
      }

      return;
    }

    const reader = new MediaMTXWebRTCReader({
      url: buildWhepUrl(whepBaseUrl, streamPath),
      onError: (error) => {
        setMediaStream(null);
        console.error(error);
      },
      onTrack: (event) => {
        const stream = event.streams[0];

        if (stream) {
          setMediaStream(stream);
        }
      },
    });

    return () => {
      reader.close();
      setMediaStream(null);
    };
  }, [isReady, mounted, scriptReady, streamPath, whepBaseUrl]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.code === "KeyM") {
        event.preventDefault();
        remote.toggleMuted();
        return;
      }

      if (event.code === "KeyF") {
        event.preventDefault();
        remote.toggleFullscreen("prefer-media");
        return;
      }

      if (event.code === "KeyT") {
        event.preventDefault();
        onTheaterModeChange(!isTheaterMode);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isTheaterMode, onTheaterModeChange, remote]);

  const theaterButton = (
    <button
      aria-label="Theater mode"
      className="vds-button"
      onClick={() => onTheaterModeChange(!isTheaterMode)}
      type="button"
    >
      <svg aria-hidden="true" className="vds-icon" viewBox="0 0 32 32">
        {isTheaterMode ? (
          <path d="M9 10h14v12H9V10Zm2 2v8h10v-8H11Z" fill="currentColor" />
        ) : (
          <path d="M4 7h24v18H4V7Zm3 3v12h18V10H7Z" fill="currentColor" />
        )}
      </svg>
    </button>
  );

  return (
    <>
      <Script
        src="/vendor/mediamtx-reader.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      {mounted && isReady ? (
        <MediaPlayer
          autoPlay
          className="h-full w-full bg-black font-sans text-white"
          muted
          playsInline
          ref={playerRef}
          src={playerSrc}
          streamType="live"
          viewType="video"
        >
          <MediaProvider />
          <DefaultVideoLayout
            colorScheme="dark"
            icons={defaultLayoutIcons}
            noGestures
            slots={{
              airPlayButton: null,
              beforeFullscreenButton: theaterButton,
              captionButton: null,
              chapterTitle: <div className="flex-1" />,
              chaptersMenu: null,
              downloadButton: null,
              googleCastButton: null,
              settingsMenu: null,
              timeSlider: null,
            }}
          />
        </MediaPlayer>
      ) : (
        <img alt="" className="h-full w-full bg-black object-cover" src="/banner.png" />
      )}
    </>
  );
}

function buildWhepUrl(baseUrl: string, streamPath: string) {
  const cleanPath = streamPath.replace(/^\/+|\/+$/g, "");

  if (typeof window === "undefined") {
    return `/${cleanPath}/whep`;
  }

  const resolvedBaseUrl = baseUrl || window.location.origin;
  const normalizedBaseUrl = new URL(resolvedBaseUrl, window.location.origin);
  normalizedBaseUrl.pathname = [
    normalizedBaseUrl.pathname.replace(/\/+$/g, ""),
    cleanPath,
    "whep",
  ]
    .filter(Boolean)
    .join("/");

  return normalizedBaseUrl.toString();
}
