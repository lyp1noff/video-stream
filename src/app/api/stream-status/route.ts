import { NextResponse } from "next/server";

import { getStreamStatus } from "@/lib/server/stream-status";

export async function GET() {
  const status = await getStreamStatus();
  return NextResponse.json(status);
}
