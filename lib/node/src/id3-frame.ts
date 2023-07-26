export abstract class ID3Frame {
  // Type (ascii32) + Size (UInt32BE/UIntSyncSafe32BE) = 64bits/8bytes
  static HEADER_SIZE = 8;

  type: string;
  frameOffset?: number;
  size: number;
  flags: number;

  constructor(type: string, size: number, flags: number, frameOffset?: number) {
    this.type = type;
    this.frameOffset = frameOffset;
    this.size = size;
    this.flags = flags;
  }

  static parse: (
    buffer: Buffer,
    id3Version: number,
    frameOffset?: number
  ) => ID3Frame;

  abstract serialize(id3Version: number): Buffer;
}
