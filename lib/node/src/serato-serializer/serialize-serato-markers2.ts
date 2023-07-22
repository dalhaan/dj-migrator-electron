import { NULL_BYTE, Serializable } from "./common";

abstract class SeratoMarkers2Tag implements Serializable {
  type: Buffer;

  constructor(type: "COLOR" | "CUE" | "BPMLOCK") {
    this.type = Buffer.alloc(type.length + 1);
    this.type.write(type, "ascii");
  }

  abstract serialize(): Buffer;
}

class CueTag extends SeratoMarkers2Tag {
  index: Buffer;
  position: Buffer;
  color: Buffer;
  name: Buffer | undefined;

  constructor(
    index: number,
    position: number,
    color: [number, number, number],
    name: string
  ) {
    super("CUE");

    // Index
    this.index = Buffer.alloc(1);
    this.index.writeUIntBE(index, 0, 1);

    // Position
    this.position = Buffer.alloc(4);
    this.position.writeUInt32BE(position, 0);

    // Color
    this.color = Buffer.from(color);

    // Name
    this.name = Buffer.from(name, "ascii");
  }

  serialize() {
    const body = Buffer.concat([
      NULL_BYTE,
      this.index,
      this.position,
      NULL_BYTE,
      this.color,
      NULL_BYTE,
      NULL_BYTE,
      ...(this.name ? [this.name, NULL_BYTE] : []),
    ]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class ColorTag extends SeratoMarkers2Tag {
  color: Buffer;

  constructor(color: [number, number, number]) {
    super("COLOR");
    this.color = Buffer.from(color);
  }

  serialize() {
    const body = Buffer.concat([NULL_BYTE, this.color]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class BpmLockTag extends SeratoMarkers2Tag {
  isLocked: Buffer;

  constructor(isLocked: boolean) {
    super("BPMLOCK");
    this.isLocked = Buffer.alloc(1);
    this.isLocked.writeUintBE(isLocked ? 1 : 0, 0, 1);
  }

  serialize() {
    const body = this.isLocked;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

export class SeratoMarkers2 implements Serializable {
  private static magic = new Uint8Array([0x01, 0x01]);
  tags: SeratoMarkers2Tag[] = [];
  private footer = NULL_BYTE;

  addCueTag(
    index: number,
    position: number,
    color: [number, number, number],
    name: string
  ) {
    this.tags.push(new CueTag(index, position, color, name));

    return this;
  }

  addColorTag(color: [number, number, number]) {
    this.tags.push(new ColorTag(color));

    return this;
  }

  addBpmLockTag(isLocked: boolean) {
    this.tags.push(new BpmLockTag(isLocked));

    return this;
  }

  serialize() {
    return Buffer.concat([
      SeratoMarkers2.magic,
      ...this.tags.map((tag) => tag.serialize()),
      this.footer,
    ]);
  }
}
