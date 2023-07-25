import fs from "fs/promises";
import assert from "assert";
import {
  base64Encode,
  getSynch,
  readUint32SyncSafe,
  toSynch,
  writeUInt32SyncSafeBE,
} from "./utils";
import { GeobFrame } from "./geob-frame";
import { ID3Frame } from "./id3-frame";
import { SeratoMarkers2 } from "./serato-serializer/serialize-serato-markers2";

type Id3Tag = {
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
};

function parseID3Tag(buffer: Buffer): Id3Tag {
  let offset = 0;

  // Magic [0x49 0x44 0x33] (ASCII3)
  assert(
    buffer
      .subarray(offset, (offset += 3))
      .equals(Buffer.from([0x49, 0x44, 0x33])),
    "Invalid Magic"
  );

  // Version (2B)
  const minorVersion = buffer.readUint8(offset++);
  const patchVersion = buffer.readUint8(offset++);
  // offset += 2;

  // Flags (1) (abcd0000)
  // a - Unsynchronisation
  // b - Extended header
  // c - Experimental indicator
  // d - Footer present
  // e.g. 11110000 & 00010000 (16) === 00010000 (16)
  const flags = {
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
  const size = readUint32SyncSafe(buffer, offset);
  offset += 4;
  const id3TagSize = flags.hasFooter ? size + 20 : size + 10; // header size + size + footer size
  const endOfBodyOffset = size + 10; // header size + size

  // Extended header
  let extendedHeader: Id3Tag["extendedHeader"];
  if (flags.hasExtendedHeader) {
    // Size (2.4: uint32syncsafebe, 2.3: uint32be)
    const extendedHeaderSize =
      minorVersion === 4
        ? readUint32SyncSafe(buffer, offset)
        : buffer.readUint32BE(offset);
    offset += 4;

    // Body (Size - 4B)
    const extendedHeaderBody = buffer.subarray(offset, extendedHeaderSize - 4);
    offset += extendedHeaderSize - 4;

    extendedHeader = {
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
      minorVersion === 4
        ? readUint32SyncSafe(buffer, offset + 4)
        : buffer.readUint32BE(offset + 4);

    console.log(type, tagSize);

    // Body (Tag.Size)
    if (type === "GEOB") {
      geobFrames.push(
        GeobFrame.parse(
          buffer.subarray(offset, offset + 10 + tagSize),
          minorVersion,
          offset
        )
      );
    }

    offset += tagSize + 10;
  }

  const id3Tag: Id3Tag = {
    buffer: buffer.subarray(0, paddingStartOffset),
    version: {
      minor: minorVersion,
      patch: patchVersion,
    },
    size,
    id3TagSize,
    flags,
    paddingSize: endOfBodyOffset - paddingStartOffset,
    extendedHeader,
    GEOB: geobFrames,
  };

  return id3Tag;
}

function buildHeader(
  version: { minor: number; patch: number },
  flags: number,
  size: number,
  identifier: "ID3" | "3DI" = "ID3"
): Buffer {
  const buffer = Buffer.alloc(ID3Frame.HEADER_SIZE);

  let offset = 0;

  // Identifier ["ID3": ascii24]
  offset += buffer.write(identifier, offset, "ascii");

  // Version [minor: UInt8, patch: UInt8]
  offset = buffer.writeUInt8(version.minor, offset);
  offset = buffer.writeUInt8(version.patch, offset);

  // Flags [abcd0000: UInt8]
  offset = buffer.writeUInt8(flags, offset);

  // Size [UIntSyncSafe32BE]
  offset = writeUInt32SyncSafeBE(buffer, size, offset);

  return buffer;
}

function buildFooter(
  version: { minor: number; patch: number },
  flags: number,
  size: number
) {
  return buildHeader(version, flags, size, "3DI");
}

function writeSeratoFrames(
  frames: GeobFrame[],
  id3Tag: Id3Tag,
  paddingSize = 0
) {
  // Find existing frames that will be replaced
  // const geobFrameDescriptions = frames.map((frame) => frame.description);
  // const matchingFrames = id3Tag.GEOB.filter((frame) =>
  //   geobFrameDescriptions.includes(frame.description)
  // ).sort((frameA, frameB) => frameA.frameOffset! - frameB.frameOffset!);
  const matchingFrames: [oldFrame: GeobFrame, newFrame: GeobFrame][] = [];
  const newFrames: GeobFrame[] = [];

  // Calculate total sizes of new frames and matching frames
  const totalSizeOfNewFrames = frames.reduce(
    (totalSize, frame) => totalSize + frame.size + ID3Frame.HEADER_SIZE,
    0
  );
  const totalSizeOfMatchingFrames = matchingFrames.reduce(
    (totalSize, [oldFrame]) => totalSize + oldFrame.size + ID3Frame.HEADER_SIZE,
    0
  );
  const totalSizeOfFrames = totalSizeOfNewFrames - totalSizeOfMatchingFrames;

  const remainingPadding = id3Tag.paddingSize - totalSizeOfFrames;

  for (const frame of frames) {
    const matchingOldFrame = id3Tag.GEOB.find(
      (oldFrame) => oldFrame.description === frame.description
    );

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

  // --------------
  // Update ID3 tag
  // --------------

  // Split ID3 tag & replace existing frames
  const segments: Buffer[] = [];
  let offset = 0;

  for (const [oldFrame, newFrame] of matchingFrames) {
    const segment = id3Tag.buffer.subarray(offset, oldFrame.frameOffset!);

    segments.push(segment, newFrame.serialize(id3Tag.version.minor));

    offset = oldFrame.frameOffset! + ID3Frame.HEADER_SIZE + 2 + oldFrame.size;
  }

  // Add remaining old farmes
  segments.push(id3Tag.buffer.subarray(offset));

  // Append new frames
  for (const frame of newFrames) {
    segments.push(frame.serialize(id3Tag.version.minor));
  }

  let newId3TagBuffer: Buffer | undefined;

  // There is enough padding to fit new frames
  if (remainingPadding >= 0) {
    const segmentsBuffer = Buffer.concat(segments);

    newId3TagBuffer = Buffer.alloc(id3Tag.id3TagSize);

    segmentsBuffer.copy(newId3TagBuffer);

    // Append footer
    if (id3Tag.flags.hasFooter) {
      const footer = buildFooter(
        id3Tag.version,
        id3Tag.flags.value,
        id3Tag.size
      );
      footer.copy(newId3TagBuffer, 10 + id3Tag.size);
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
    if (id3Tag.flags.hasFooter) {
      segments.push(buildFooter(id3Tag.version, id3Tag.flags.value, newSize));
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
  console.log("remaining padding:", remainingPadding);

  return {
    buffer: newId3TagBuffer,
    needToCreateNewBuffer: remainingPadding < 0,
  };
}

async function main() {
  const file = await fs.readFile(
    "/Users/dallanfreemantle/Desktop/Deadline - Dreamer.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Justin Hawkes - Lift off the Roof.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Molecular - Skank.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/DUBZ/Mefjus & Emperor vs Jam Thieves - Flashizm vs Criminal Thugs (Emperor Edit).mp3"
  );
  const data = Buffer.from([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x02, 0x0f, 0x54, 0x49,
    0x54, 0x32, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x44, 0x72, 0x65,
    0x61, 0x6d, 0x65, 0x72, 0x54, 0x50, 0x45, 0x31, 0x00, 0x00, 0x00, 0x09,
    0x00, 0x00, 0x00, 0x44, 0x65, 0x61, 0x64, 0x6c, 0x69, 0x6e, 0x65, 0x54,
    0x41, 0x4c, 0x42, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x44, 0x72,
    0x65, 0x61, 0x6d, 0x65, 0x72, 0x54, 0x43, 0x4f, 0x4e, 0x00, 0x00, 0x00,
    0x0f, 0x00, 0x00, 0x00, 0x45, 0x6c, 0x65, 0x63, 0x74, 0x72, 0x6f, 0x2f,
    0x44, 0x61, 0x6e, 0x63, 0x65, 0x00, 0x54, 0x50, 0x55, 0x42, 0x00, 0x00,
    0x00, 0x09, 0x00, 0x00, 0x00, 0x44, 0x65, 0x61, 0x64, 0x6c, 0x69, 0x6e,
    0x65, 0x54, 0x59, 0x45, 0x52, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x00,
    0x32, 0x30, 0x32, 0x30, 0x54, 0x4b, 0x45, 0x59, 0x00, 0x00, 0x00, 0x04,
    0x00, 0x00, 0x00, 0x45, 0x62, 0x6d, 0x54, 0x58, 0x58, 0x58, 0x00, 0x00,
    0x00, 0x15, 0x00, 0x00, 0x00, 0x53, 0x45, 0x52, 0x41, 0x54, 0x4f, 0x5f,
    0x50, 0x4c, 0x41, 0x59, 0x43, 0x4f, 0x55, 0x4e, 0x54, 0x00, 0x31, 0x31,
    0x00, 0x52, 0x56, 0x41, 0x44, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00,
    0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x54, 0x42, 0x50,
    0x4d, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x31, 0x37, 0x34, 0x47,
    0x45, 0x4f, 0x42, 0x00, 0x00, 0x00, 0x3a, 0x00, 0x00, 0x00, 0x61, 0x70,
    0x70, 0x6c, 0x69, 0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x6f, 0x63,
    0x74, 0x65, 0x74, 0x2d, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x00, 0x00,
    0x53, 0x65, 0x72, 0x61, 0x74, 0x6f, 0x20, 0x42, 0x65, 0x61, 0x74, 0x47,
    0x72, 0x69, 0x64, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x01, 0x3d, 0x3c,
    0x3e, 0x82, 0x43, 0x2e, 0x00, 0x00, 0x00,
  ]);

  const id3Tag = parseID3Tag(file);
  console.log(id3Tag);

  const markers = new SeratoMarkers2();
  markers
    .addColorTag([255, 255, 255])
    .addCueTag(1, 1000, [204, 0, 0], "Cue 1")
    .addCueTag(2, 2000, [0, 204, 0], "Cue 2")
    .addCueTag(3, 3000, [0, 0, 204], "Cue 3")
    .addBpmLockTag(false);

  const updatedSeratoMarkers2 = new GeobFrame(
    0,
    "application/octet-stream",
    "",
    "Serato Markers2",
    base64Encode(markers.serialize())
  );

  const updatedID3Tag = writeSeratoFrames([updatedSeratoMarkers2], id3Tag, 0);

  if (!updatedID3Tag.needToCreateNewBuffer) {
    updatedID3Tag.buffer.copy(file);

    await fs.writeFile("/Users/dallanfreemantle/Desktop/new-audio.mp3", file);
  } else {
    // Create new buffer
    const buffer = Buffer.alloc(
      file.length - id3Tag.id3TagSize + updatedID3Tag.buffer.length
    );

    // Copy updated ID3 tag to start of new buffer
    updatedID3Tag.buffer.copy(buffer);

    // Append original MP3 file audio data to new buffer
    file.subarray(id3Tag.id3TagSize).copy(buffer, updatedID3Tag.buffer.length);

    await fs.writeFile("/Users/dallanfreemantle/Desktop/new-audio.mp3", buffer);
  }
  console.log(updatedID3Tag);
  // await fs.writeFile(
  //   "/Users/dallanfreemantle/Desktop/updated-id3.octet-stream",
  //   updatedID3Tag.buffer
  // );
  // const serialized = exampleBeatGrid.serialize(4);
  // const reparsed = GeobFrame.parse(serialized, 4);
  // console.log("example", exampleBeatGrid);
  // console.log("serialized", serialized);
  // console.log("reparsed", reparsed);

  // console.log(toSynch(203 + 68));

  // console.log(toSynch(203));
  // console.log(getSynch(7725));
  // console.log("old:", getSynch(410667));
  // console.log("new:", getSynch(410925));
}

main();
