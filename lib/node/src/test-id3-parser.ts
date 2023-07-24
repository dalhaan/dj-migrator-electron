import fs from "fs/promises";
import assert from "assert";
import { readUint32SyncSafe } from "./utils";
import { GeobFrame } from "./geob-frame";

function parseID3Tags(buffer: Buffer) {
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
  const endOfFramesOffset = size + 10; // header size + size

  const ID3TagBuffer = buffer.subarray(0, id3TagSize);

  // Extended header
  if (flags.hasExtendedHeader) {
    // Size (2.4: uint32syncsafebe, 2.3: uint32be)
    const extendedHeaderSize =
      minorVersion === 4
        ? readUint32SyncSafe(buffer, offset)
        : buffer.readUint32BE(offset);
    offset += 4;

    // Body (Size - 4B)
    offset += extendedHeaderSize - 4;
  }

  // const paddingSize = calculatePaddingLength(ID3TagBuffer);

  const id3Data: {
    version: {
      minor: number;
      patch: number;
    };
    size: number;
    paddingSize: number;
    flags: any;
    GEOB: GeobFrame[];
  } = {
    version: {
      minor: minorVersion,
      patch: patchVersion,
    },
    size: id3TagSize,
    paddingSize: 0,
    flags,
    GEOB: [],
  };

  let paddingStartOffset = endOfFramesOffset;

  // Tags (Tag)
  while (offset < endOfFramesOffset) {
    // Stop parsing tags when padding or end of frame is reached
    if (offset + 4 > endOfFramesOffset || buffer.readUint8(offset) === 0) {
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
      id3Data.GEOB.push(
        GeobFrame.parse(
          buffer.subarray(offset, offset + 10 + tagSize),
          minorVersion,
          offset
        )
      );
    }

    offset += tagSize + 10;
  }

  // Padding size calculation
  id3Data.paddingSize = endOfFramesOffset - paddingStartOffset;

  return id3Data;
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

  const id3Data = parseID3Tags(file);
  console.log(id3Data);

  const exampleBeatGrid = new GeobFrame(
    0,
    "application/octet-stream",
    "",
    "Serato BeatGrid",
    Buffer.from([
      0x01, 0x01, 0x38, 0x37, 0x2e, 0x30, 0x30, 0x00, 0x2d, 0x35, 0x2e,
    ])
  );
  // const serialized = exampleBeatGrid.serialize(4);
  // const reparsed = GeobFrame.parse(serialized, 4);
  // console.log("example", exampleBeatGrid);
  // console.log("serialized", serialized);
  // console.log("reparsed", reparsed);

  // console.log(toSynch(203 + 68));

  // console.log(toSynch(203));
  // console.log(getSynch(7725));
}

main();
