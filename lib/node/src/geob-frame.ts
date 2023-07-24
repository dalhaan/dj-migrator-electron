import { ID3Frame } from "./id3-frame";
import { readUint32SyncSafe, toSynch } from "./utils";

export class GeobFrame extends ID3Frame {
  textEncoding: number;
  mimeType: string;
  fileName: string;
  description: string;
  body: Buffer;

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
