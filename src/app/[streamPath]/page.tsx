import { StreamPageView } from "./stream-page-view";

export const dynamic = "force-dynamic";

type StreamPageProps = {
  params: Promise<{
    streamPath: string;
  }>;
};

export default async function StreamPage({ params }: StreamPageProps) {
  const { streamPath } = await params;
  const whepBaseUrl = process.env.WHEP_BASE_URL || "";

  return <StreamPageView streamPath={streamPath} whepBaseUrl={whepBaseUrl} />;
}
