type MediaMtxPath = {
  name?: string;
  ready?: boolean;
};

function toAbsoluteUrl(url: string) {
  return url.replace(/\/$/, "");
}

export async function getStreamStatus(streamPath = process.env.STREAM_PATH || "stream") {
  const streamApiUrl = process.env.STREAM_API_URL;

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
