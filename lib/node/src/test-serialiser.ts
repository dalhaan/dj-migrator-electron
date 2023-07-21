const NULL_BYTE = new Uint8Array([0x00]);

// ==================================
// Beat Grid
// ==================================

abstract class SeratoCrateTag {
  type: Buffer;

  constructor(type: "vrsn" | "osrt" | "tvcn" | "ovct" | "otrk" | "ptrk") {
    this.type = Buffer.from(type, "ascii");
  }

  abstract serialize(): Buffer;
}

class VersionTag extends SeratoCrateTag {
  versionMetadata: Buffer;

  constructor(versionMetadata: string) {
    super("vrsn");

    // Encode string as UTF16BE
    this.versionMetadata = Buffer.from(versionMetadata, "utf16le").swap16();
  }

  serialize(): Buffer {
    const body = this.versionMetadata;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class ColumnNameTag extends SeratoCrateTag {
  name: Buffer;

  constructor(name: string) {
    super("tvcn");

    // Encode string as UTF16BE
    this.name = Buffer.from(name, "utf16le").swap16();
  }

  serialize(): Buffer {
    const body = this.name;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}
class FirstColumnTag extends SeratoCrateTag {
  tags: SeratoCrateTag[] = [];

  constructor() {
    super("osrt");
  }

  addColumnNameTag(name: string) {
    this.tags.push(new ColumnNameTag(name));
  }

  serialize(): Buffer {
    const body = Buffer.concat(this.tags.map((tag) => tag.serialize()));
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class ColumnTag extends SeratoCrateTag {
  tags: SeratoCrateTag[] = [];

  constructor() {
    super("ovct");
  }

  addColumnNameTag(name: string) {
    this.tags.push(new ColumnNameTag(name));
  }

  serialize(): Buffer {
    const body = Buffer.concat(this.tags.map((tag) => tag.serialize()));
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class SeratoCrate {
  tags: SeratoCrateTag[] = [];

  addVersionTag(versionMetadata: string) {
    this.tags.push(new VersionTag(versionMetadata));
  }

  addFirstColumnTag(name: string) {
    const tag = new FirstColumnTag();
    tag.addColumnNameTag(name);
    this.tags.push(tag);
  }

  addColumnTag(name: string) {
    const tag = new ColumnTag();
    tag.addColumnNameTag(name);
    this.tags.push(tag);
  }

  serialize(): Buffer {
    return Buffer.concat(this.tags.map((tag) => tag.serialize()));
  }
}

interface SeratoBeatGridTag {
  serialize(): Buffer;
}

class NonTerminalMarker implements SeratoBeatGridTag {
  static size = 8;
  buffer: Buffer;

  constructor(position: number, beatsToNextMarker: number) {
    const buffer = Buffer.alloc(NonTerminalMarker.size);

    // Position
    buffer.writeFloatBE(position, 0);

    // Beats to next marker
    buffer.writeUInt32BE(beatsToNextMarker, 4);

    this.buffer = buffer;
  }

  serialize() {
    return this.buffer;
  }
}

class TerminalMarker implements SeratoBeatGridTag {
  static size = 8;
  buffer: Buffer;

  constructor(position: number, bpm: number) {
    const buffer = Buffer.alloc(TerminalMarker.size);

    // Position
    buffer.writeFloatBE(position, 0);

    // Beats to next marker
    buffer.writeFloatBE(bpm, 4);

    this.buffer = buffer;
  }

  serialize() {
    return this.buffer;
  }
}

class SeratoBeatGrid {
  private static magic = new Uint8Array([0x01, 0x00]);
  private nonTerminalMarkers: NonTerminalMarker[] = [];
  private terminalMarker: TerminalMarker | undefined;

  constructor() {}

  addNonTerminalMarker(position: number, beatsToNextMarker: number) {
    this.nonTerminalMarkers.push(
      new NonTerminalMarker(position, beatsToNextMarker)
    );
  }

  addTerminalMarker(position: number, bpm: number) {
    this.terminalMarker = new TerminalMarker(position, bpm);
  }

  build() {
    const buffer = Buffer.concat([
      SeratoBeatGrid.magic,
      ...this.nonTerminalMarkers.map((marker) => marker.buffer),
      ...(this.terminalMarker ? [this.terminalMarker.buffer] : []),
    ]);

    return buffer;
  }
}

abstract class SeratoMarkers2Tag {
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

  // constructor(index: number, position: number, color: [number, number, number], name?: string) {
  constructor(
    index: number,
    position: number,
    color: [number, number, number],
    name?: string
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
    if (name) {
      this.name = Buffer.from(name, "ascii");
    }
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

class SeratoMarkers2 {
  private static magic = new Uint8Array([0x01, 0x01]);
  tags: SeratoMarkers2Tag[] = [];
  footer = NULL_BYTE;

  addCueTag(
    index: number,
    position: number,
    color: [number, number, number],
    name: string
  ) {
    this.tags.push(new CueTag(index, position, color, name));
  }

  addColorTag(color: [number, number, number]) {
    this.tags.push(new ColorTag(color));
  }

  addBpmLockTag(isLocked: boolean) {
    this.tags.push(new BpmLockTag(isLocked));
  }

  serialize() {
    return Buffer.concat([
      SeratoMarkers2.magic,
      ...this.tags.map((tag) => tag.serialize()),
      this.footer,
    ]);
  }
}

async function main() {
  const beatGrid = new SeratoBeatGrid();
  beatGrid.addNonTerminalMarker(1.2, 64);
  beatGrid.addNonTerminalMarker(2.4, 64);
  beatGrid.addTerminalMarker(5.0, 178);
  console.log(beatGrid.build());

  const markers = new SeratoMarkers2();
  markers.addColorTag([255, 0, 0]);
  markers.addCueTag(1, 2020, [255, 255, 255], "Energy 7");
  markers.addBpmLockTag(false);
  console.log(markers.serialize());

  const crate = new SeratoCrate();
  crate.addVersionTag("1.0/Serato ScratchLive Crate");
  // crate.addFirstColumnTag("song");
  // crate.addColumnTag("song");
  console.log(crate.serialize());
}

main();
