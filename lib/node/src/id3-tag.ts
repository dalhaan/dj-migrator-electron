import assert from "assert";
import { GeobFrame } from "./geob-frame";
import { readUint32SyncSafe, writeUInt32SyncSafeBE } from "./utils";
import { ID3Frame } from "./id3-frame";
import { UnknownFrame } from "./unknown-frame";
import { RemovedFrame } from "./removed-frame";
import { struct } from "./struct";

export class ID3Tag {
  static HEADER_SIZE = 10;

  buffer: Buffer;
  version: {
    minor: number;
    patch: number;
  };
  flags: number;
  size: number;
  paddingSize: number;
  extendedHeader?: {
    size: number;
    body: Buffer;
  };
  frames: ID3Frame[] = [];

  // All added frames with `addFrame()`
  addedFrames: ID3Frame[] = [];
  // Includes replaced & removed frames
  matchingFrames: [oldFrame: ID3Frame, newFrame: ID3Frame][] = [];
  // Includes brand new frames
  newFrames: ID3Frame[] = [];

  constructor(buffer: Buffer) {
    assert(
      buffer.length >= ID3Tag.HEADER_SIZE,
      "No ID3 tag found: buffer not large enough."
    );

    let [id3, vMin, vPatch, flags, size, offset] = struct(buffer, [
      ["ascii", 3],
      "uint8",
      "uint8",
      "B",
      "usyncsafeint32be",
    ]);

    // Magic [0x49 0x44 0x33] (ASCII3)
    assert.equal(id3, "ID3", "No ID3 tag found");

    // Version (2B)
    this.version = {
      minor: vMin,
      patch: vPatch,
    };

    // Flags (1) (abcd0000)
    // a - Unsynchronisation
    // b - Extended header
    // c - Experimental indicator
    // d - Footer present
    // e.g. 11110000 & 00010000 (16) === 00010000 (16)
    this.flags = flags;

    // Size (SynchsafeInt4)
    // ID3 body size === Size - (header size (10) + footer size( 10))
    // [ header ][ extended header ][ body (frames) ][ padding ][ footer ]
    // <-- 10B -><-------------------- size -------------------><-- 10B ->
    // const synchSafeSize = buffer.subarray(offset, (offset += 4));
    this.size = size;

    const endOfBodyOffset = this.size + 10; // header size + size

    // Extended header
    if (this.flagHasExtendedHeader) {
      // Size (2.4: uint32syncsafebe, 2.3: uint32be)
      const [extendedHeaderSize] = struct(
        buffer,
        [this.version.minor === 4 ? "usyncsafeint32be" : "uint32be"],
        offset
      );
      offset += 4;

      // Body (Size - 4B)
      const [extendedHeaderBody] = struct(
        buffer,
        [["B", extendedHeaderSize - 4]],
        offset
      );
      offset += extendedHeaderSize - 4;

      this.extendedHeader = {
        size: extendedHeaderSize,
        body: extendedHeaderBody,
      };
    }

    const startOfFramesOffset = offset;
    let paddingStartOffset = endOfBodyOffset;

    // Tags (Tag)
    while (offset < endOfBodyOffset) {
      // Stop parsing tags when padding is reached
      if (buffer.readUint8(offset) === 0) {
        paddingStartOffset = offset;
        break;
      }

      // == Tag ==
      // Type (ASCII4)
      // Size (Uint32BE)
      const [type, tagSize] = struct(
        buffer,
        [
          ["ascii", 4],
          this.version.minor === 4 ? "usyncsafeint32be" : "uint32be",
        ],
        offset
      );

      // Body (Tag.Size)
      const [body] = struct(buffer, [["B", 10 + tagSize]], offset);

      console.log(type, tagSize);

      if (type === "GEOB") {
        this.frames.push(GeobFrame.parse(body, this.version.minor, offset));
      } else {
        this.frames.push(UnknownFrame.parse(body, this.version.minor, offset));
      }

      offset += tagSize + 10;
    }

    this.buffer = buffer.subarray(0, paddingStartOffset);
    this.paddingSize = endOfBodyOffset - paddingStartOffset;
  }

  // Flags (1) (abcd0000)
  // a - Unsynchronisation
  // b - Extended header
  // c - Experimental indicator
  // d - Footer present
  // e.g. 11110000 & 00010000 (16) === 00010000 (16)

  get flagUnsynchronisation(): boolean {
    return Boolean(this.flags & 0b10000000);
  }
  get flagHasExtendedHeader(): boolean {
    return Boolean(this.flags & 0b01000000);
  }
  get flagExperimentalIndicator(): boolean {
    return Boolean(this.flags & 0b00100000);
  }
  get flagHasFooter(): boolean {
    return Boolean(this.flags & 0b00010000);
  }

  get id3TagSize(): number {
    return this.flagHasFooter ? this.size + 20 : this.size + 10; // header size + size + footer size
  }

  buildHeader(size: number, identifier: "ID3" | "3DI" = "ID3"): Buffer {
    const buffer = Buffer.alloc(ID3Tag.HEADER_SIZE);

    let offset = 0;

    // Identifier ["ID3": ascii24]
    offset += buffer.write(identifier, offset, "ascii");

    // Version [minor: UInt8, patch: UInt8]
    offset = buffer.writeUInt8(this.version.minor, offset);
    offset = buffer.writeUInt8(this.version.patch, offset);

    // Flags [abcd0000: UInt8]
    offset = buffer.writeUInt8(this.flags, offset);

    // Size [UIntSyncSafe32BE]
    offset = writeUInt32SyncSafeBE(buffer, size, offset);

    return buffer;
  }

  buildFooter(size: number) {
    return this.buildHeader(size, "3DI");
  }

  addFrame(frame: ID3Frame) {
    this.addedFrames.push(frame);

    const matchingOldFrame = this.frames.find((oldFrame) => {
      if (oldFrame instanceof GeobFrame && frame instanceof GeobFrame) {
        return oldFrame.description === frame.description;
      }

      return oldFrame.type === frame.type;
    });

    if (matchingOldFrame) {
      // Only match first instance (incase there are multiple frames with same description)
      if (
        !this.matchingFrames.some(
          (matchedFrame) =>
            matchedFrame[0] === matchingOldFrame || matchedFrame[1] === frame
        )
      ) {
        this.matchingFrames.push([matchingOldFrame, frame]);
      }
    } else {
      this.newFrames.push(frame);
    }
  }

  removeFrame<FrameType extends ID3Frame>(
    matcher: (frame: FrameType) => boolean
  ) {
    const matchingOldFrame = this.frames.find((frame) => {
      try {
        return matcher(frame as any);
      } catch (e) {}
    });

    if (matchingOldFrame) {
      // Only match first instance (incase there are multiple frames with same description)
      if (
        !this.matchingFrames.some(
          (matchedFrame) => matchedFrame[0] === matchingOldFrame
        )
      ) {
        this.matchingFrames.push([matchingOldFrame, new RemovedFrame()]);
      }
    }
  }

  writeFrames(paddingSize = 0) {
    // Sort by matching old frame offset
    this.matchingFrames.sort(
      ([oldFrameA], [oldFrameB]) =>
        oldFrameA.frameOffset! - oldFrameB.frameOffset!
    );

    // Calculate total sizes of new frames and matching frames
    const totalSizeOfAddedFrames = this.addedFrames.reduce(
      (totalSize, frame) => totalSize + frame.size + ID3Frame.HEADER_SIZE,
      0
    );
    const totalSizeOfMatchingFrames = this.matchingFrames.reduce(
      (totalSize, [oldFrame, newFrame]) => {
        if (newFrame instanceof RemovedFrame) {
          return totalSize;
        }

        return totalSize + oldFrame.size + ID3Frame.HEADER_SIZE;
      },
      0
    );
    const totalSizeOfFrames =
      totalSizeOfAddedFrames - totalSizeOfMatchingFrames;
    const remainingPadding = this.paddingSize - totalSizeOfFrames;

    // --------------
    // Update ID3 tag
    // --------------

    // Split ID3 tag & replace existing frames
    const segments: Buffer[] = [];
    let offset = 0;

    for (const [oldFrame, newFrame] of this.matchingFrames) {
      const segment = this.buffer.subarray(offset, oldFrame.frameOffset!);

      segments.push(segment, newFrame.serialize(this.version.minor));

      offset = oldFrame.frameOffset! + ID3Frame.HEADER_SIZE + oldFrame.size;
    }

    // Add remaining old farmes
    segments.push(this.buffer.subarray(offset));

    // Append new frames
    for (const frame of this.newFrames) {
      segments.push(frame.serialize(this.version.minor));
    }

    let newId3TagBuffer: Buffer | undefined;

    // There is enough padding to fit new frames
    if (remainingPadding >= 0) {
      const segmentsBuffer = Buffer.concat(segments);

      newId3TagBuffer = Buffer.alloc(this.id3TagSize);

      segmentsBuffer.copy(newId3TagBuffer);

      // Append footer
      if (this.flagHasFooter) {
        const footer = this.buildFooter(this.size);
        footer.copy(newId3TagBuffer, 10 + this.size);
      }

      // TODO: Write new ID3 tag to MP3 file buffer
    }
    // Not enough room, need to create new buffer for MP3 file.
    else {
      // Add padding
      const padding = Buffer.alloc(paddingSize);
      segments.push(padding);

      // Calculate new ID3 tag size
      let segmentsBuffer = Buffer.concat(segments);
      const newSize = segmentsBuffer.byteLength - 10;

      // Append footer
      if (this.flagHasFooter) {
        segments.push(this.buildFooter(newSize));
      }

      segmentsBuffer = Buffer.concat(segments);

      newId3TagBuffer = segmentsBuffer;

      // Update ID3 tag size
      writeUInt32SyncSafeBE(newId3TagBuffer, newSize, 6);
      // newId3TagBuffer.writeUInt32BE(toSynch(segmentsBuffer.byteLength - 10), 6);

      // TODO: Write new ID3 tag to MP3 file buffer
    }

    console.log("new frames:", this.newFrames);
    console.log("matching frames:", this.matchingFrames);
    console.log("total size of new frames:", totalSizeOfAddedFrames);
    console.log("total size of matching frames:", totalSizeOfMatchingFrames);
    console.log("original padding:", this.paddingSize);
    console.log("remaining padding:", remainingPadding);

    return {
      buffer: newId3TagBuffer,
      needToCreateNewBuffer: remainingPadding < 0,
    };
  }
}
