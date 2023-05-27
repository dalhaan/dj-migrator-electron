/**
 * Waveform reader that reads the buffer created by ffmpeg.
 *
 * The buffer from ffmpeg contains two byte, little endian
 * signed integers representing the PCM values.
 *
 * https://trac.ffmpeg.org/wiki/Waveform
 */
export class WaveformReader {
  static size = 2;

  buffer: Buffer;
  index: number;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.index = 0;
  }

  read(): number | null {
    if (this.buffer.length < this.index + WaveformReader.size) {
      return null;
    }

    const pcmValue = this.buffer.readIntLE(this.index, WaveformReader.size);

    this.index += WaveformReader.size;

    return pcmValue;
  }
}
