export abstract class ID3Frame {
  protected type: string;
  protected size: number;
  protected frameOffset?: number;

  constructor(type: string, size: number, frameOffset?: number) {
    this.type = type;
    this.size = size;
    this.frameOffset = frameOffset;
  }

  static parse: (
    buffer: Buffer,
    id3Version: number,
    frameOffset?: number
  ) => ID3Frame;

  abstract serialize(id3Version: 3 | 4): Buffer;
}
