# video-stream

Minimal rewrite on `Next.js + TypeScript`.

Current scope:

- root redirect to `/${STREAM_PATH}`
- dynamic player pages at `/{streamPath}`
- direct MediaMTX WebRTC playback through `MediaMTXWebRTCReader`
- no iframe
- Tailwind UI with Vidstack controls

## Environment

Use:

- `STREAM_PATH` optional, defaults to `stream`
- `WHEP_BASE_URL` optional, example: `https://live.example.com`

For `/foo`, the player uses `${WHEP_BASE_URL}/foo/whep`.
If `WHEP_BASE_URL` is empty, the browser origin is used.

## URL options

Player behavior can be changed with query parameters:

- `muted` — start muted, defaults to `true`
- `autoplay` — start playback automatically, defaults to `true`
- `controls` — show player controls, defaults to `true`
- `full` or `fullscreen` — open in the full-page theater layout, defaults to `false`

Boolean options accept `true`/`false`, `1`/`0`, `yes`/`no`, and `on`/`off`.
An option without a value is treated as `true`, for example `/stream?full`.

Examples:

```text
/stream?muted=false
/stream?full&controls=false
/stream?fullscreen=true&autoplay=false
```

`full`/`fullscreen` selects the full-page layout rather than the browser Fullscreen API,
which browsers only allow after a user interaction. Unmuted autoplay can also be blocked
by the browser's autoplay policy.

## Run

```bash
npm install
npm run dev
```

Official MediaMTX docs used for the player approach:

- https://mediamtx.org/docs/read/web-browsers
- official `reader.js`: https://github.com/bluenviron/mediamtx/blob/main/internal/servers/webrtc/reader.js
