import { ID3Frame } from "./id3-frame";
import { struct } from "./struct";
import { toSynch } from "./utils";

export class GeobFrame extends ID3Frame {
  textEncoding: number;
  mimeType: string;
  fileName: string;
  description: string;
  body: Buffer;

  constructor(
    flags: number,
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

    super("GEOB", size, flags, frameOffset);

    this.textEncoding = textEncoding;
    this.mimeType = mimeType;
    this.fileName = fileName;
    this.description = description;
    this.body = body;
  }

  static parse(buffer: Buffer, id3Version: number, frameOffset?: number) {
    let [
      type,
      tagSize,
      flags,
      textEncoding,
      mimeType,
      fileName,
      description,
      offset,
    ] = struct(buffer, [
      // == Tag ==
      // Type (ASCII4)
      ["ascii", 4],
      // Size (Uint32BE)
      id3Version === 4 ? "usyncsafeint32be" : "uint32be",
      // Flags (2)
      "uint16be",
      // GEOB frame body
      // Text encoding (1)
      "uint8",
      // Mime type (null-terminated ascii string)
      "asciiz",
      // Filename (null-terminated ascii string)
      "asciiz",
      // Description (null-terminated ascii string)
      "asciiz",
    ]);

    // Body
    const body = buffer.subarray(offset);

    return new GeobFrame(
      flags,
      textEncoding,
      mimeType,
      fileName,
      description,
      body,
      frameOffset
    );
  }

  serialize(id3Version: number) {
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
    offset = buffer.writeUint16BE(this.flags, offset);

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
