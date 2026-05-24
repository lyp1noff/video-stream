type MediaMtxPath = {
  name?: string;
  ready?: boolean;
};

function toAbsoluteUrl(url: string) {
  return url.replace(/\/$/, "");
}

function derivePathName(whepUrl: string) {
  try {
    const parsedUrl = whepUrl.startsWith("http")
      ? new URL(whepUrl)
      : new URL(whepUrl, "http://localhost");

    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    const whepIndex = parts.findIndex((part) => part === "whep");

    if (whepIndex > 0) {
      return parts[whepIndex - 1];
    }

    if (parts.length > 0) {
      return parts[0];
    }
  } catch {
    return "stream";
  }

  return "stream";
}

export async function getStreamStatus() {
  const streamApiUrl = process.env.STREAM_API_URL;
  const whepUrl = process.env.WHEP_URL || "/stream/whep";
  const streamPath = process.env.STREAM_PATH || derivePathName(whepUrl);

  if (!streamApiUrl) {
    return {
      ready: false,
      streamPath,
    };
  }

  try {
    const response = await fetch(`${toAbsoluteUrl(streamApiUrl)}/v3/paths/list`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ready: false,
        streamPath,
      };
    }

    const payload = (await response.json()) as { items?: MediaMtxPath[] };
    const matchingPath = payload.items?.find((item) => item.name === streamPath);

    return {
      ready: Boolean(matchingPath?.ready),
      streamPath,
    };
  } catch {
    return {
      ready: false,
      streamPath,
    };
  }
}
