import { StreamPlayer } from "@/components/stream-player";
import { getStreamStatus } from "@/lib/server/stream-status";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const whepUrl = process.env.WHEP_URL || "/stream/whep";
  const initialStatus = await getStreamStatus();

  return (
    <main className="page-shell">
      <section className="player-shell">
        <StreamPlayer initialReady={initialStatus.ready} whepUrl={whepUrl} />
      </section>
    </main>
  );
}
