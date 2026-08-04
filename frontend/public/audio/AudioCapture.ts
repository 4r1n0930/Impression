import { floatTo16BitPCM } from "./pcmUtils";

export default class AudioCapture {
  private context: AudioContext | null = null;
  private worklet: AudioWorkletNode | null = null;

  async start(
    stream: MediaStream,
    onPCM: (pcm: Int16Array) => void
  ) {
    this.context = new AudioContext({
      sampleRate: 16000,
    });

    await this.context.audioWorklet.addModule("/audio/audio-worklet.js");

    const source = this.context.createMediaStreamSource(stream);

    this.worklet = new AudioWorkletNode(
      this.context,
      "pcm-processor"
    );

    this.worklet.port.onmessage = (event) => {
      const pcm = floatTo16BitPCM(event.data);
      onPCM(pcm);
    };

    source.connect(this.worklet);
  }

  stop() {
    if (this.worklet) {
      this.worklet.disconnect();
      this.worklet = null;
    }

    if (this.context && this.context.state !== "closed") {
      this.context.close();
    }

    this.context = null;
  }
}