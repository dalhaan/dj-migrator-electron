export class AudioPlayer {
  buffer: AudioBuffer | null = null;
  context: AudioContext;
  sourceNode: AudioBufferSourceNode | null = null;

  constructor() {
    this.context = new AudioContext();
  }

  async loadAudioData(audioData: ArrayBuffer) {
    this.buffer = await this.decodeAudioData(audioData);
    const sourceNode = this.resetSourceNode();
    sourceNode.start(0);
    await this.context.suspend();
  }

  async play() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  async pause() {
    if (this.context.state === "running") {
      await this.context.suspend();
    }
  }

  setTime(time: number) {
    const sourceNode = this.resetSourceNode();
    sourceNode.start(this.context.currentTime, time / 1000);
  }

  resetSourceNode() {
    this.sourceNode?.stop(0);
    this.sourceNode = this.context.createBufferSource();
    this.sourceNode.buffer = this.buffer;
    this.sourceNode.connect(this.context.destination);

    return this.sourceNode;
  }

  private decodeAudioData(audioData: ArrayBuffer) {
    return new Promise<AudioBuffer>((resolve, reject) => {
      this.context.decodeAudioData(audioData, resolve, reject);
    });
  }
}
