# video-stream

Minimal rewrite on `Next.js + TypeScript`.

Current scope:

- root redirect to `/${STREAM_PATH}`
- dynamic player pages at `/{streamPath}`
- direct MediaMTX WebRTC playback through `MediaMTXWebRTCReader`
- no iframe
- Tailwind UI with Media Chrome controls

## Environment

Use:

- `STREAM_API_URL` example: `http://mediamtx:9997`
- `STREAM_PATH` optional, defaults to `stream`
- `WHEP_BASE_URL` optional, example: `https://live.example.com`

For `/foo`, the player uses `${WHEP_BASE_URL}/foo/whep` and polls MediaMTX for path `foo`.
If `WHEP_BASE_URL` is empty, the browser origin is used.

## Run

```bash
npm install
npm run dev
```

Official MediaMTX docs used for the player approach:

- https://mediamtx.org/docs/read/web-browsers
- official `reader.js`: https://github.com/bluenviron/mediamtx/blob/main/internal/servers/webrtc/reader.js

The app polls MediaMTX every 5 seconds through `/api/stream-status`.
