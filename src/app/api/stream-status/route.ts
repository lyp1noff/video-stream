import { NextResponse } from "next/server";

import { getStreamStatus } from "@/lib/server/stream-status";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const streamPath = searchParams.get("path") || process.env.STREAM_PATH || "stream";
  const status = await getStreamStatus(streamPath);

  return NextResponse.json(status);
}
