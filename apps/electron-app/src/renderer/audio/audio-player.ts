export class AudioPlayer {
  player: HTMLAudioElement;
  context: AudioContext;
  sourceNode: MediaElementAudioSourceNode | null = null;
  playListener: (() => void) | null = null;
  pauseListener: (() => void) | null = null;

  constructor() {
    this.player = new Audio();
    this.context = new AudioContext();
    this.sourceNode = this.context.createMediaElementSource(this.player);
    this.sourceNode.connect(this.context.destination);
  }

  loadAudioData(filePath: string) {
    return new Promise<void>((resolve, reject) => {
      const onLoadedData = (event: Event) => {
        if (event.target) {
          this.player.removeEventListener("loadeddata", onLoadedData);
          resolve();
        } else {
          reject();
        }
      };

      this.player.addEventListener("loadeddata", onLoadedData);

      this.player.src = "local://" + filePath;
    });
  }

  play() {
    this.player.play();
  }

  pause() {
    this.player.pause();
  }

  get currentTime() {
    return this.player.currentTime * 1000;
  }

  get duration() {
    return this.player.duration;
  }

  setTime(time: number) {
    this.player.currentTime = time / 1000;
  }

  onPlay(callback: () => void) {
    this.playListener = callback;
    this.player.addEventListener("play", this.playListener);
  }

  onPause(callback: () => void) {
    this.pauseListener = callback;
    this.player.addEventListener("pause", this.pauseListener);
  }

  cleanUp() {
    if (this.playListener) {
      this.player.removeEventListener("play", this.playListener);
    }
    if (this.pauseListener) {
      this.player.removeEventListener("pause", this.pauseListener);
    }
  }
}
