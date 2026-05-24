declare class MediaMTXWebRTCReader {
  constructor(config: {
    url: string;
    user?: string;
    pass?: string;
    token?: string;
    onError?: (error: string) => void;
    onTrack?: (event: RTCTrackEvent) => void;
    onDataChannel?: (event: RTCDataChannelEvent) => void;
  });

  close(): void;
}
