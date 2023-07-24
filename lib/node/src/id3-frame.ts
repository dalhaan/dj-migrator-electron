export abstract class ID3Frame {
  // Type (ascii32) + Size (UInt32BE/UIntSyncSafe32BE) = 64bits/8bytes
  static HEADER_SIZE = 8;

  type: string;
  size: number;
  frameOffset?: number;

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
