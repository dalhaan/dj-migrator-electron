import assert from "assert";
import { GeobFrame } from "./geob-frame";
import { readUint32SyncSafe, writeUInt32SyncSafeBE } from "./utils";
import { ID3Frame } from "./id3-frame";
import { UnknownFrame } from "./unknown-frame";

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
  frames: ID3Frame[] = [];

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
        this.frames.push(
          GeobFrame.parse(
            buffer.subarray(offset, offset + 10 + tagSize),
            this.version.minor,
            offset
          )
        );
      } else {
        this.frames.push(
          UnknownFrame.parse(
            buffer.subarray(offset, offset + 10 + tagSize),
            this.version.minor,
            offset
          )
        );
      }

      offset += tagSize + 10;
    }

    this.buffer = buffer.subarray(0, paddingStartOffset);
    this.paddingSize = endOfBodyOffset - paddingStartOffset;
  }

  buildHeader(size: number, identifier: "ID3" | "3DI" = "ID3"): Buffer {
    const buffer = Buffer.alloc(ID3Frame.HEADER_SIZE);

    let offset = 0;

    // Identifier ["ID3": ascii24]
    offset += buffer.write(identifier, offset, "ascii");

    // Version [minor: UInt8, patch: UInt8]
    offset = buffer.writeUInt8(this.version.minor, offset);
    offset = buffer.writeUInt8(this.version.patch, offset);

    // Flags [abcd0000: UInt8]
    offset = buffer.writeUInt8(this.flags.value, offset);

    // Size [UIntSyncSafe32BE]
    offset = writeUInt32SyncSafeBE(buffer, size, offset);

    return buffer;
  }

  buildFooter(size: number) {
    return this.buildHeader(size, "3DI");
  }

  writeSeratoFrames(frames: ID3Frame[], paddingSize = 0) {
    // Find existing frames that will be replaced
    const matchingFrames: [oldFrame: ID3Frame, newFrame: ID3Frame][] = [];
    const newFrames: ID3Frame[] = [];

    for (const frame of frames) {
      const matchingOldFrame = this.frames.find((oldFrame) => {
        if (oldFrame instanceof GeobFrame && frame instanceof GeobFrame) {
          return oldFrame.description === frame.description;
        }

        return oldFrame.type === frame.type;
      });

      if (matchingOldFrame) {
        // Only match first instance (incase there are multiple frames with same description)
        if (
          !matchingFrames.some(
            (matchedFrame) =>
              matchedFrame[0] === matchingOldFrame || matchedFrame[1] === frame
          )
        ) {
          matchingFrames.push([matchingOldFrame, frame]);
        }
      } else {
        newFrames.push(frame);
      }
    }

    // Sort by matching old frame offset
    matchingFrames.sort(
      ([oldFrameA], [oldFrameB]) =>
        oldFrameA.frameOffset! - oldFrameB.frameOffset!
    );

    // Calculate total sizes of new frames and matching frames
    const totalSizeOfNewFrames = frames.reduce(
      (totalSize, frame) => totalSize + frame.size + ID3Frame.HEADER_SIZE,
      0
    );
    const totalSizeOfMatchingFrames = matchingFrames.reduce(
      (totalSize, [oldFrame]) =>
        totalSize + oldFrame.size + ID3Frame.HEADER_SIZE,
      0
    );
    const totalSizeOfFrames = totalSizeOfNewFrames - totalSizeOfMatchingFrames;
    const remainingPadding = this.paddingSize - totalSizeOfFrames;

    // --------------
    // Update ID3 tag
    // --------------

    // Split ID3 tag & replace existing frames
    const segments: Buffer[] = [];
    let offset = 0;

    for (const [oldFrame, newFrame] of matchingFrames) {
      const segment = this.buffer.subarray(offset, oldFrame.frameOffset!);

      segments.push(segment, newFrame.serialize(this.version.minor));

      offset = oldFrame.frameOffset! + ID3Frame.HEADER_SIZE + 2 + oldFrame.size;
    }

    // Add remaining old farmes
    segments.push(this.buffer.subarray(offset));

    // Append new frames
    for (const frame of newFrames) {
      segments.push(frame.serialize(this.version.minor));
    }

    let newId3TagBuffer: Buffer | undefined;

    // There is enough padding to fit new frames
    if (remainingPadding >= 0) {
      const segmentsBuffer = Buffer.concat(segments);

      newId3TagBuffer = Buffer.alloc(this.id3TagSize);

      segmentsBuffer.copy(newId3TagBuffer);

      // Append footer
      if (this.flags.hasFooter) {
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
      if (this.flags.hasFooter) {
        segments.push(this.buildFooter(newSize));
      }

      segmentsBuffer = Buffer.concat(segments);

      newId3TagBuffer = segmentsBuffer;

      // Update ID3 tag size
      writeUInt32SyncSafeBE(newId3TagBuffer, newSize, 6);
      // newId3TagBuffer.writeUInt32BE(toSynch(segmentsBuffer.byteLength - 10), 6);

      // TODO: Write new ID3 tag to MP3 file buffer
    }

    console.log("new frames:", frames);
    console.log("matching frames:", matchingFrames);
    console.log("total size of new frames:", totalSizeOfNewFrames);
    console.log("total size of matching frames:", totalSizeOfMatchingFrames);
    console.log("original padding:", this.paddingSize);
    console.log("remaining padding:", remainingPadding);

    return {
      buffer: newId3TagBuffer,
      needToCreateNewBuffer: remainingPadding < 0,
    };
  }
}
