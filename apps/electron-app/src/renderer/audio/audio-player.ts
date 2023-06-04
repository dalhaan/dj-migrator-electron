export class AudioPlayer {
  buffer: AudioBuffer | null = null;
  context: AudioContext;
  sourceNode: AudioBufferSourceNode | null = null;
  startTime = 0;
  offsetTime = 0;

  constructor() {
    this.context = new AudioContext();
  }

  async loadAudioData(audioData: ArrayBuffer) {
    this.buffer = await this.decodeAudioData(audioData);
    const sourceNode = this.resetSourceNode();
    sourceNode.start(0);
    await this.context.suspend();
    this.startTime = this.context.currentTime;
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
    this.startTime = this.context.currentTime;
    this.offsetTime = time / 1000;
  }

  getCurrentTime() {
    return this.context.currentTime - this.startTime + this.offsetTime;
  }

  private resetSourceNode() {
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
