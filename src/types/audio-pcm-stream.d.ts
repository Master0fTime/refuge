// Le paquet publie ses types sous un autre nom de module : on les redéclare sous son vrai nom.
declare module '@fugood/react-native-audio-pcm-stream' {
  type Options = {
    sampleRate: number;
    channels: 1 | 2;
    bitsPerSample: 8 | 16;
    audioSource?: number;
    wavFile: string;
    bufferSize?: number;
  };
  const AudioRecord: {
    init(options: Options): void;
    start(): void;
    stop(): Promise<string | null>;
    on(event: 'data', callback: (base64: string) => void): { remove(): void };
  };
  export default AudioRecord;
}
