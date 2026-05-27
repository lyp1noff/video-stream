"use client";

import {
  MediaPlayer,
  MediaProvider,
  useMediaRemote,
  type MediaPlayerInstance,
  type PlayerSrc,
} from "@vidstack/react";
import { PlyrLayout, plyrLayoutIcons } from "@vidstack/react/player/layouts/plyr";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type StreamPlayerProps = {
  isTheaterMode: boolean;
  onTheaterModeChange: (isTheaterMode: boolean) => void;
  streamPath: string;
  whepBaseUrl: string;
};

export function StreamPlayer({
  isTheaterMode,
  onTheaterModeChange,
  streamPath,
  whepBaseUrl,
}: StreamPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const remote = useMediaRemote(playerRef);
  const [mounted, setMounted] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const playerSrc: PlayerSrc | undefined = mediaStream
    ? { src: mediaStream, type: "video/object" }
    : undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !scriptReady) {
      return;
    }

    let reader: MediaMTXWebRTCReader | null = null;
    let retryAttempt = 0;
    let stopped = false;

    function clearRetryTimeout() {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (stopped) {
        return;
      }

      const delay = Math.min(30000, 1000 * 2 ** retryAttempt);
      retryAttempt += 1;
      clearRetryTimeout();
      retryTimeoutRef.current = window.setTimeout(connect, delay);
    }

    function connect() {
      if (stopped) {
        return;
      }

      reader?.close();
      reader = new MediaMTXWebRTCReader({
        url: buildWhepUrl(whepBaseUrl, streamPath),
        onError: () => {
          setMediaStream(null);
          scheduleReconnect();
        },
        onTrack: (event) => {
          const stream = event.streams[0];

          if (stream) {
            retryAttempt = 0;
            setMediaStream(stream);
          }
        },
      });
    }

    connect();

    return () => {
      stopped = true;
      clearRetryTimeout();
      reader?.close();
      setMediaStream(null);
    };
  }, [mounted, scriptReady, streamPath, whepBaseUrl]);

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
      className="plyr__controls__item plyr__control"
      onClick={() => onTheaterModeChange(!isTheaterMode)}
      type="button"
    >
      <svg aria-hidden="true" viewBox="0 0 32 32">
        {isTheaterMode ? (
          <path d="M9 10h14v12H9V10Zm2 2v8h10v-8H11Z" fill="currentColor" />
        ) : (
          <path d="M4 7h24v18H4V7Zm3 3v12h18V10H7Z" fill="currentColor" />
        )}
      </svg>
      <span className="plyr__tooltip">Theater</span>
    </button>
  );

  return (
    <>
      <Script
        src="/vendor/mediamtx-reader.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      {mounted ? (
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
          <PlyrLayout
            clickToFullscreen={false}
            clickToPlay={false}
            controls={["play", "mute+volume", "current-time", "pip", "fullscreen"]}
            icons={plyrLayoutIcons}
            slots={{
              airPlayButton: null,
              afterCurrentTime: <span className="min-w-0 flex-1" />,
              beforeFullscreenButton: theaterButton,
              settingsMenu: null,
            }}
          />
        </MediaPlayer>
      ) : (
        null
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
