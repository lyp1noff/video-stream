# video-stream

Minimal rewrite on `Next.js + TypeScript`.

Current scope:

- one public page
- direct MediaMTX WebRTC playback through `MediaMTXWebRTCReader`
- no iframe

## Environment

Use:

- `WHEP_URL` example: `/stream/whep`
- `STREAM_API_URL` example: `http://mediamtx:9997`
- `STREAM_PATH` optional, defaults to the path inferred from `WHEP_URL`

## Run

```bash
npm install
npm run dev
```

Official MediaMTX docs used for the player approach:

- https://mediamtx.org/docs/read/web-browsers
- official `reader.js`: https://github.com/bluenviron/mediamtx/blob/main/internal/servers/webrtc/reader.js

The app polls MediaMTX every 5 seconds through `/api/stream-status`.
