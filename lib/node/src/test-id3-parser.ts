import fs from "fs/promises";
import assert from "assert";

abstract class ID3Frame {
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

class GeobFrame extends ID3Frame {
  private textEncoding: number;
  private mimeType: string;
  private fileName: string;
  private description: string;
  private body: Buffer;

  constructor(
    textEncoding: number,
    mimeType: string,
    fileName: string,
    description: string,
    body: Buffer,
    frameOffset?: number
  ) {
    const size =
      1 +
      mimeType.length +
      1 +
      fileName.length +
      1 +
      description.length +
      1 +
      body.byteLength;

    super("GEOB", size, frameOffset);

    this.textEncoding = textEncoding;
    this.mimeType = mimeType;
    this.fileName = fileName;
    this.description = description;
    this.body = body;
  }

  static parse(buffer: Buffer, id3Version: number, frameOffset?: number) {
    let offset = 0;

    // == Tag ==
    // Type (ASCII4)
    const type = buffer.subarray(offset, offset + 4).toString("ascii");
    offset += 4;

    // Size (Uint32BE)
    const tagSize =
      id3Version === 4
        ? readUint32SyncSafe(buffer, offset)
        : buffer.readUint32BE(offset);
    offset += 4;

    // Flags (2)
    offset += 2;

    // GEOB frame body
    // Text encoding (1)
    const textEncoding = buffer.readUInt8(offset);
    offset += 1;

    // Mime type (null-terminated ascii string)
    const mimeType = buffer
      .subarray(offset, (offset = buffer.indexOf(0, offset)))
      .toString("ascii");
    offset += 1;

    // Filename (null-terminated ascii string)
    const fileName = buffer
      .subarray(offset, (offset = buffer.indexOf(0, offset)))
      .toString("ascii");
    offset += 1;

    // Description (null-terminated ascii string)
    const description = buffer
      .subarray(offset, (offset = buffer.indexOf(0x00, offset)))
      .toString("ascii");
    offset += 1;

    // Body
    const body = buffer.subarray(offset);

    return new GeobFrame(
      textEncoding,
      mimeType,
      fileName,
      description,
      body,
      frameOffset
    );
  }

  serialize(id3Version: 3 | 4) {
    const buffer = Buffer.alloc(4 + 4 + 2 + this.size);
    let offset = 0;

    // Type
    offset += buffer.write(this.type, offset, "ascii");

    // Size
    offset = buffer.writeUInt32BE(
      id3Version === 4 ? toSynch(this.size) : this.size,
      offset
    );

    // Flags
    offset = buffer.writeUint16BE(0, offset);

    // Body
    // Text encoding
    offset = buffer.writeUInt8(this.textEncoding, offset);

    // Mime type
    offset += buffer.write(this.mimeType, offset, "ascii");
    // NULL terminated
    offset = buffer.writeUInt8(0, offset);

    // File name
    offset += buffer.write(this.fileName, offset, "ascii");
    // NULL terminated
    offset = buffer.writeUInt8(0, offset);

    // Description
    offset += buffer.write(this.description, offset, "ascii");
    // NULL terminated
    offset = buffer.writeUInt8(0, offset);

    // Body
    buffer.fill(this.body, offset, offset + this.body.byteLength);
    offset += this.body.byteLength;

    return buffer;
  }
}

function toSynch(input: number) {
  let out = 0;
  let mask = 0x7f;
  while (mask ^ 0x7fffffff) {
    out = input & ~mask;
    out = out << 1;
    out = out | (input & mask);
    mask = ((mask + 1) << 8) - 1;
    input = out;
  }
  return out;
}

/**
 * Gets the "synch" representation of a number
 * @param num Number to convert
 */
function getSynch(num: number): number {
  let out = 0;
  let mask = 0x7f000000;

  while (mask) {
    out >>= 1;
    out |= num & mask;
    mask >>= 8;
  }

  return out;
}

/**
 * Gets a "synch2 uint8 from a view
 * @param view View to read
 * @param offset Offset to read from
 */
function readUint8SyncSafe(view: Buffer, offset: number = 0): number {
  return getSynch(view.readUInt8(offset));
}

/**
 * Gets a "synch2 uint32 from a view
 * @param view View to read
 * @param offset Offset to read from
 */
function readUint32SyncSafe(view: Buffer, offset: number = 0): number {
  return getSynch(view.readUint32BE(offset));
}

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

  const id3Data: {
    version: string;
    size: number;
    flags: any;
    GEOB: GeobFrame[];
  } = {
    version: `3.${minorVersion}.${patchVersion}`,
    size: id3TagSize,
    flags,
    GEOB: [],
  };

  // Tags (Tag)
  while (offset < endOfFramesOffset) {
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
          buffer.subarray(offset, offset + tagSize),
          minorVersion,
          offset
        )
      );
    }

    offset += tagSize + 10;
  }

  return id3Data;
}

async function main() {
  const file = await fs.readFile(
    // "/Users/dallanfreemantle/Desktop/Deadline - Dreamer.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Justin Hawkes - Lift off the Roof.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Molecular - Skank.mp3"
    "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/DUBZ/Mefjus & Emperor vs Jam Thieves - Flashizm vs Criminal Thugs (Emperor Edit).mp3"
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
    "Serato Autotags",
    Buffer.from([
      0x01, 0x01, 0x38, 0x37, 0x2e, 0x30, 0x30, 0x00, 0x2d, 0x35, 0x2e,
    ])
  );

  const serialized = exampleBeatGrid.serialize(4);

  const reparsed = GeobFrame.parse(serialized, 4);

  console.log("example", exampleBeatGrid);
  console.log("serialized", serialized);
  console.log("reparsed", reparsed);

  // console.log(toSynch(203 + 68));

  // console.log(toSynch(203));
  // console.log(getSynch(7725));
}

main();
