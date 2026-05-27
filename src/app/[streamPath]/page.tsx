import { StreamPageView } from "./stream-page-view";
import { getStreamStatus } from "@/lib/server/stream-status";

export const dynamic = "force-dynamic";

type StreamPageProps = {
  params: Promise<{
    streamPath: string;
  }>;
};

export default async function StreamPage({ params }: StreamPageProps) {
  const { streamPath } = await params;
  const initialStatus = await getStreamStatus(streamPath);
  const whepBaseUrl = process.env.WHEP_BASE_URL || "";

  return (
    <StreamPageView
      initialReady={initialStatus.ready}
      streamPath={streamPath}
      whepBaseUrl={whepBaseUrl}
    />
  );
}
