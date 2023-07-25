import assert from "assert";
import { GeobFrame } from "./geob-frame";
import { readUint32SyncSafe } from "./utils";

export class ID3Tag {
  buffer: Buffer;
  version: {
    minor: number;
    patch: number;
  };
  size: number;
  id3TagSize: number;
  paddingSize: number;
  extendedHeader?: {
    size: number;
    body: Buffer;
  };
  flags: {
    unsynchronisation: boolean;
    hasExtendedHeader: boolean;
    experimentalIndicator: boolean;
    hasFooter: boolean;
    value: number;
  };
  GEOB: GeobFrame[];

  constructor(buffer: Buffer) {
    let offset = 0;

    // Magic [0x49 0x44 0x33] (ASCII3)
    assert(
      buffer
        .subarray(offset, (offset += 3))
        .equals(Buffer.from([0x49, 0x44, 0x33])),
      "Invalid Magic"
    );

    // Version (2B)
    this.version = {
      minor: buffer.readUint8(offset++),
      patch: buffer.readUint8(offset++),
    };
    // offset += 2;

    // Flags (1) (abcd0000)
    // a - Unsynchronisation
    // b - Extended header
    // c - Experimental indicator
    // d - Footer present
    // e.g. 11110000 & 00010000 (16) === 00010000 (16)
    this.flags = {
      unsynchronisation: (buffer.at(offset)! & 0b10000000) !== 0,
      hasExtendedHeader: (buffer.at(offset)! & 0b01000000) !== 0,
      experimentalIndicator: (buffer.at(offset)! & 0b00100000) !== 0,
      hasFooter: (buffer.at(offset)! & 0b00010000) !== 0,
      value: buffer.at(offset)!,
    };

    offset += 1;

    // Size (SynchsafeInt4)
    // ID3 body size === Size - (header size (10) + footer size( 10))
    // [ header ][ extended header ][ body (frames) ][ padding ][ footer ]
    // <-- 10B -><-------------------- size -------------------><-- 10B ->
    // const synchSafeSize = buffer.subarray(offset, (offset += 4));
    this.size = readUint32SyncSafe(buffer, offset);
    offset += 4;

    this.id3TagSize = this.flags.hasFooter ? this.size + 20 : this.size + 10; // header size + size + footer size
    const endOfBodyOffset = this.size + 10; // header size + size

    // Extended header
    if (this.flags.hasExtendedHeader) {
      // Size (2.4: uint32syncsafebe, 2.3: uint32be)
      const extendedHeaderSize =
        this.version.minor === 4
          ? readUint32SyncSafe(buffer, offset)
          : buffer.readUint32BE(offset);
      offset += 4;

      // Body (Size - 4B)
      const extendedHeaderBody = buffer.subarray(
        offset,
        extendedHeaderSize - 4
      );
      offset += extendedHeaderSize - 4;

      this.extendedHeader = {
        size: extendedHeaderSize,
        body: extendedHeaderBody,
      };
    }

    const startOfFramesOffset = offset;
    let paddingStartOffset = endOfBodyOffset;
    const geobFrames: GeobFrame[] = [];

    // Tags (Tag)
    while (offset < endOfBodyOffset) {
      // Stop parsing tags when padding is reached
      if (buffer.readUint8(offset) === 0) {
        paddingStartOffset = offset;
        break;
      }

      // == Tag ==
      // Type (ASCII4)
      const type = buffer.subarray(offset, offset + 4).toString("ascii");

      // Size (Uint32BE)
      const tagSize =
        this.version.minor === 4
          ? readUint32SyncSafe(buffer, offset + 4)
          : buffer.readUint32BE(offset + 4);

      console.log(type, tagSize);

      // Body (Tag.Size)
      if (type === "GEOB") {
        geobFrames.push(
          GeobFrame.parse(
            buffer.subarray(offset, offset + 10 + tagSize),
            this.version.minor,
            offset
          )
        );
      }

      offset += tagSize + 10;
    }

    this.buffer = buffer.subarray(0, paddingStartOffset);
    this.GEOB = geobFrames;
    this.paddingSize = endOfBodyOffset - paddingStartOffset;
  }
}
