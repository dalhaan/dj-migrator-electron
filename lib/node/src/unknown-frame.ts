import { ID3Frame } from "./id3-frame";
import { struct } from "./struct";
import { toSynch } from "./utils";

export class UnknownFrame extends ID3Frame {
  body: Buffer;

  constructor(type: string, flags: number, body: Buffer, frameOffset?: number) {
    const size = body.byteLength;

    super(type, size, flags, frameOffset);

    this.body = body;
  }

  static parse(buffer: Buffer, id3Version: number, frameOffset?: number) {
    let [type, tagSize, flags, offset] = struct(buffer, [
      // == Tag ==
      // Type (ASCII4)
      ["ascii", 4],
      // Size (Uint32BE)
      id3Version === 4 ? "usyncsafeint32be" : "uint32be",
      // Flags (2)
      "uint16be",
    ]);

    // Body
    const body = buffer.subarray(offset);

    return new UnknownFrame(type, flags, body, frameOffset);
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
    this.body.copy(buffer, offset);

    offset += this.body.byteLength;

    return buffer;
  }
}
